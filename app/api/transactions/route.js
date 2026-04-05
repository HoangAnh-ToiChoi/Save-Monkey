import { getAuthenticatedClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Delete all transactions for the current user
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Đã xóa tất cả giao dịch' })
  } catch (error) {
    console.error('[API Transactions DELETE ALL] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
