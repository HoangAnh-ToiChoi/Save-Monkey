import { getAuthenticatedClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const { supabase, user } = await getAuthenticatedClient(request)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.is_active === undefined) {
      return NextResponse.json({ success: false, message: 'Missing is_active flag' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('scheduled_expenses')
      .update({
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API Scheduled PATCH] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const { supabase, user } = await getAuthenticatedClient(request)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('scheduled_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (error) {
    console.error('[API Scheduled DELETE] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
