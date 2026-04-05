// lib/supabase.js
// Client-side Supabase client — dùng trong React components
// Dùng createBrowserClient từ @supabase/ssr để đồng bộ session qua Cookie với Server

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton instance
let _supabase = null

export const supabase = (() => {
  if (!_supabase) {
    _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
})()
