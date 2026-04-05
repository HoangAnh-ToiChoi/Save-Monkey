import { getAuthenticatedClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { supabase, user } = await getAuthenticatedClient(request)

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('[API Categories] Error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
