"use client"
import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, CalendarClock, PieChart, Menu, X, Settings, LogOut, Wallet } from "lucide-react"
import { Toaster } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/transactions", label: "Giao dịch", icon: Receipt },
  { href: "/scheduled", label: "Kế hoạch Autopay", icon: CalendarClock },
  { href: "/budgets", label: "Ngân sách", icon: PieChart },
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Try to fetch profile from DB
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle()
        setUser({
          email: session.user.email,
          name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
        })
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          className: '!bg-surface-800 !text-white !rounded-xl !shadow-glow border border-surface-700/50',
          duration: 3000
        }} 
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-surface-800 bg-surface-900/50 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:flex lg:translate-x-0",
        isSidebarOpen ? "flex translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-surface-800/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-white">Save<span className="text-primary-400">Monkey</span></span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-8 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary-500/10 text-primary-400 shadow-[inset_2px_0_0_0_#6366f1]" 
                    : "text-surface-300 hover:bg-surface-800/50 hover:text-white"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-400" : "text-surface-400 group-hover:text-white")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-surface-800/50">
          <div className="flex items-center gap-3 rounded-xl bg-surface-800/50 p-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-primary-600 flex items-center justify-center font-bold text-white shadow-sm uppercase">
              {user?.name?.[0] || 'G'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user?.name || 'Guest User'}</p>
              <p className="truncate text-xs text-surface-400">{user?.email || 'guest@savemonkey.app'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-surface-400 hover:text-danger-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-surface-800 bg-background/50 backdrop-blur-md px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary-500" />
            <span className="font-heading text-lg font-bold">SaveMonkey</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl animate-fade-in-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
