// lib/supabase-server.js
// Server-side Supabase clients dùng trong API Routes

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Service Role client — bypass RLS hoàn toàn
 * → Dùng cho cron job, admin operations
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Auth-aware client — xác thực người dùng qua Bearer token trong Authorization header
 * Trả về { supabase, user } — user là null nếu token không hợp lệ
 */
export async function getAuthenticatedClient(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  // Dùng service role client để verify token
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  if (!token) {
    return { supabase: adminClient, user: null }
  }

  // Verify JWT token với Supabase
  const { data: { user }, error } = await adminClient.auth.getUser(token)

  if (error || !user) {
    return { supabase: adminClient, user: null }
  }

  // Tạo client với token của user để RLS hoạt động đúng
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return { supabase: userClient, user }
}

/**
 * @deprecated Dùng getAuthenticatedClient thay thế
 */
export function createServerClientWithAuth(request) {
  const authHeader = request.headers.get('authorization')
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return client
}
