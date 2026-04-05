import { getAuthenticatedClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: list, error } = await supabase
      .from('scheduled_expenses')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    console.error('[API Scheduled] GET Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name, amount, category_id,
      frequency, scheduled_time, start_date, end_date,
      day_of_week, day_of_month, month_of_year
    } = body

    if (!name || !amount || !frequency || !scheduled_time) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    if (frequency === 'weekly' && (!day_of_week || day_of_week.length === 0)) {
      return NextResponse.json({ success: false, message: 'Cần chọn ngày trong tuần cho lịch weekly' }, { status: 400 })
    }
    if ((frequency === 'monthly' || frequency === 'yearly') && !day_of_month) {
      return NextResponse.json({ success: false, message: 'Cần chọn ngày trong tháng cho lịch monthly/yearly' }, { status: 400 })
    }

    const payload = {
      user_id: user.id,
      category_id: category_id || null,
      name,
      amount,
      frequency,
      scheduled_time,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      day_of_week: day_of_week || null,
      day_of_month: day_of_month || null,
      month_of_year: month_of_year || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('scheduled_expenses')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API Scheduled] POST Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('scheduled_expenses')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Đã xóa tất cả hạn mức tự động' })
  } catch (error) {
    console.error('[API Scheduled DELETE ALL] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate that we only update boolean flags like is_active for bulk
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Missing or invalid is_active flag' }, { status: 400 })
    }

    const { error } = await supabase
      .from('scheduled_expenses')
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Đã cập nhật trạng thái tất cả hạn mức tự động' })
  } catch (error) {
    console.error('[API Scheduled PATCH ALL] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
