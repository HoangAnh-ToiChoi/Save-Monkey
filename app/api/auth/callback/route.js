import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Đổi code lấy session và lưu thẳng vào cookie
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Xác thực thành công -> vào trang tổng quan
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }
  }

  // Lỗi code hoặc không có code -> quay lại màn đăng nhập với thông báo lỗi
  return NextResponse.redirect(`${requestUrl.origin}/login?message=auth-error`)
}
