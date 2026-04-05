// app/api/cron/process/route.js
// API xử lý auto-deduct — chạy bằng Vercel Cron
// Logic: Lấy scheduled_expenses: scheduled_time <= NOW() AND last_run_date < TODAY
// Gọi RPC tạo transaction → cập nhật last_run_date

import { createServerClient, createServerClientWithAuth } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Không cache response
export const maxDuration = 30 // Timeout 30 giây (Vercel free tier)

export async function POST(request) {
  // Allow POST for manual triggering and testing
  return handleCronProcess(request)
}

export async function GET(request) {
  return handleCronProcess(request)
}

async function handleCronProcess(request) {
  try {
    // ─────────────────────────────────────────
    // Bước 1: Xác thực — Vercel Cron hoặc CRON_SECRET
    // ─────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let isAuthorized = false
    
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true
    } else {
      // Check if logged in user is manually triggering
      const authSupabase = createServerClientWithAuth(request)
      const { data: { user } } = await authSupabase.auth.getUser()
      if (user) isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ─────────────────────────────────────────
    // Bước 2: Tính toán thời gian (Asia/Ho_Chi_Minh)
    // ─────────────────────────────────────────
    const supabase = createServerClient()

    const nowVN = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
    const today = nowVN.toISOString().split('T')[0] // 'YYYY-MM-DD'
    const dayOfWeek = nowVN.getDay()       // 0=CN, 1=T2, ..., 6=T7
    const dayOfMonth = nowVN.getDate()     // 1-31
    const monthOfYear = nowVN.getMonth() + 1 // 1-12

    const currentTimeString = `${String(nowVN.getHours()).padStart(2, '0')}:${String(nowVN.getMinutes()).padStart(2, '0')}:00`

    console.log(`[CRON] Thực thi lúc ${currentTimeString} VN - Hôm nay: ${today}`)

    // ─────────────────────────────────────────
    // Bước 3: Query scheduled_expenses hợp lệ
    // ĐIỀU KIỆN TRỌNG YẾU: scheduled_time <= NOW() AND last_run_date < TODAY
    // ─────────────────────────────────────────
    let query = supabase
      .from('scheduled_expenses')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .lte('scheduled_time', currentTimeString) // <= NOW()

    // end_date hợp lệ: NULL (vô hạn) hoặc >= today
    query = query.or(`end_date.is.null,end_date.gte.${today}`)

    // last_run_date < today (chưa chạy hôm nay)
    query = query.or(`last_run_date.is.null,last_run_date.lt.${today}`)

    const { data: expenses, error: queryError } = await query

    if (queryError) {
      console.error('[CRON] Lỗi query:', queryError)
      throw queryError
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Không có lịch nào cần xử lý (đã chạy xong hoặc chưa đến giờ)',
        processed: 0,
        skipped: 0,
        failed: 0,
        results: [],
        date: today,
        time: currentTimeString
      })
    }

    // ─────────────────────────────────────────
    // Bước 4: Lọc theo frequency
    // ─────────────────────────────────────────
    const validExpenses = expenses.filter((expense) => {
      switch (expense.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          return Array.isArray(expense.day_of_week) && expense.day_of_week.includes(dayOfWeek);
        case 'monthly':
          return expense.day_of_month === dayOfMonth;
        case 'yearly':
          return expense.month_of_year === monthOfYear && expense.day_of_month === dayOfMonth;
        default:
          return false;
      }
    })

    // ─────────────────────────────────────────
    // Bước 5: Xử lý từng record độc lập (Failure Isolation)
    // ─────────────────────────────────────────
    let processedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const results = []

    for (const expense of validExpenses) {
      try {
        // RPC thực hiện INSERT ON CONFLICT DO NOTHING + LOG
        const { data: inserted, error: rpcError } = await supabase.rpc(
          'process_scheduled_expense',
          { p_id: expense.id }
        )

        if (rpcError) {
          console.error(`[CRON] Lỗi RPC cho expense ${expense.id}:`, rpcError)
          failedCount++
          results.push({ id: expense.id, status: 'failed', error: rpcError.message })
          continue // FAILURE ISOLATION: Continue with next
        }

        if (inserted) {
          processedCount++
          results.push({ id: expense.id, status: 'processed' })
        } else {
          skippedCount++
          results.push({ id: expense.id, status: 'skipped (duplicate detected by DB lock)' })
        }
      } catch (err) {
        failedCount++
        console.error(`[CRON] Exception cho expense ${expense.id}:`, err)
        results.push({ id: expense.id, status: 'failed', error: err.message })
      }
    }

    // ─────────────────────────────────────────
    // Bước 6: Trả kết quả (Verification logic)
    // ─────────────────────────────────────────
    console.log(`[CRON] Hoàn tất: ${processedCount} processed, ${skippedCount} skipped, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      failed: failedCount,
      total: validExpenses.length,
      results,
      date: today,
      time: currentTimeString
    })
  } catch (error) {
    console.error('[CRON] Lỗi nghiêm trọng:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi xử lý cron job', error: error.message },
      { status: 500 }
    )
  }
}
