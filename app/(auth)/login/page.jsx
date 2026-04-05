"use client"
import React, { useState } from "react"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = params.get("message")
    if (message === "check-email") {
      toast.success("Vui lòng kiểm tra email để kích hoạt tài khoản!", { duration: 5000 })
    } else if (message === "auth-error") {
      toast.error("Có lỗi xảy ra khi xác thực email. Link có thể đã hết hạn.", { duration: 5000 })
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error("Vui lòng điền đủ thông tin")

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast.success("Đăng nhập thành công!")

      // Đợi cookie SSR được set xong rồi mới chuyển trang
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 800)

    } catch (error) {
      setLoading(false)
      toast.error(error.message || "Email hoặc mật khẩu không đúng")
    }
    // Không setLoading(false) khi thành công vì đang chuyển trang
  }

  return (
    <Card className="glass-panel w-full border-surface-700/60 shadow-2xl">
      <CardHeader className="space-y-1 pb-6 text-center">
        <CardTitle className="text-2xl font-bold">Chào mừng trở lại</CardTitle>
        <CardDescription>Đăng nhập vào tài khoản của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ten@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <Link href="#" className="text-xs font-medium text-primary-400 hover:text-primary-300">
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Đang đăng nhập...</> : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-surface-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface-900 px-2 text-surface-400">hoặc</span>
          </div>
        </div>
        <p className="text-center text-sm text-surface-400 mt-2">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary-400 hover:text-primary-300">
            Đăng ký
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
