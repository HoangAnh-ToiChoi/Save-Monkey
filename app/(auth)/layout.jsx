import React from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-600/10 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow">
              <Wallet className="h-7 w-7 text-white" />
            </div>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-heading font-bold tracking-tight text-white">
            Save<span className="text-primary-400">Monkey</span>
          </h2>
          <p className="mt-2 text-center text-sm text-surface-400">
            Ứng dụng tự động quản lý tài chính cá nhân
          </p>
        </div>
        
        {children}
      </div>
    </div>
  )
}
