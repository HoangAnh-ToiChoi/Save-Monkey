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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) return toast.error("Vui lòng điền đủ thông tin")
    if (password !== confirmPassword) return toast.error("Mật khẩu xác nhận không khớp")
    if (password.length < 6) return toast.error("Mật khẩu tối thiểu 6 ký tự")

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        }
      })

      if (error) {
        throw error
      }

      if (data?.user?.identities?.length === 0) {
        setLoading(false)
        return toast.error("Email này đã được đăng ký.")
      }

      if (data?.session) {
        // Đăng ký + đăng nhập luôn (email confirmation tắt)
        toast.success("Đăng ký thành công!")
        setTimeout(() => {
          window.location.replace("/dashboard")
        }, 500)
      } else {
        // Yêu cầu xác thực email
        setLoading(false)
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.")
        setTimeout(() => {
          window.location.href = "/login?message=check-email"
        }, 2000)
      }

    } catch (error) {
      setLoading(false)
      toast.error(error.message || "Có lỗi xảy ra khi đăng ký")
    }
  }

  return (
    <Card className="glass-panel w-full border-surface-700/60 shadow-2xl">
      <CardHeader className="space-y-1 pb-6 text-center">
        <CardTitle className="text-2xl font-bold">Tạo tài khoản</CardTitle>
        <CardDescription>Bắt đầu kiểm soát tài chính của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
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
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-surface-400">Tối thiểu 6 ký tự</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Đang đăng ký...</> : "Đăng ký ngay"}
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
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300">
            Đăng nhập
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
