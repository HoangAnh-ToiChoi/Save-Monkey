"use client"
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatVND } from '@/lib/utils'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SpendingPieChart } from '@/components/charts/SpendingPieChart'
import { ScheduledWidget } from '@/components/dashboard/ScheduledWidget'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [updatingIncome, setUpdatingIncome] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  
  const [newIncome, setNewIncome] = useState('')
  const [limitFrequency, setLimitFrequency] = useState('monthly')
  const [limitStartDate, setLimitStartDate] = useState(new Date().toISOString().split('T')[0])
  const [limitEndDate, setLimitEndDate] = useState('')
  
  // Data states
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const userId = session.user.id

      // 1. Lấy thu nhập từ profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        
      let monthlyIncome = profile?.monthly_income || 0
      
      if (profile) {
        setNewIncome(profile.monthly_income?.toString() || '')
        setLimitFrequency(profile.limit_frequency || 'monthly')
        if (profile.limit_start_date) setLimitStartDate(profile.limit_start_date)
        if (profile.limit_end_date) setLimitEndDate(profile.limit_end_date)
      }
      
      if (!profile) {
        // Tự cấp profile ảo nếu chưa qua onboarding
        await supabase.from('user_profiles').insert({
          id: userId,
          monthly_income: 15000000, // mock 15 tr
          onboarding_done: true
        })
        monthlyIncome = 15000000
      }
      
      setIncome(monthlyIncome)

      // 2. Lấy giao dịch trong tháng
      const now = new Date()
      // Create first day of month and last day of month in local time string YYYY-MM-DD
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: txs, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('transaction_date', startOfMonth)
        .lte('transaction_date', endOfMonth)
        .order('transaction_date', { ascending: false })

      if (error) throw error

      setTransactions(txs || [])

      // Tính tổng chi tiêu
      const totalExpense = txs?.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0) || 0
      setExpense(totalExpense)

      // Gom nhóm cho Chart
      const grouped = txs?.filter(t => t.type === 'expense').reduce((acc, curr) => {
        // Fallback: read category name from note if category relation is null
        let cat = 'Khác'
        if (curr.category_id && curr.categories?.name) {
          cat = curr.categories.name
        } else if (curr.note && curr.note.startsWith('Test: ')) {
          cat = curr.note.replace('Test: ', '')
        }
        acc[cat] = (acc[cat] || 0) + curr.amount
        return acc
      }, {})

      const pieData = Object.keys(grouped || {}).map(key => ({
        name: key,
        value: grouped[key]
      }))
      
      setChartData(pieData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Lỗi lấy data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleUpdateIncome = async (e) => {
    e.preventDefault()
    if (!newIncome) return

    try {
      setUpdatingIncome(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const numIncome = Number(newIncome.replace(/\D/g, ''))
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          monthly_income: numIncome,
          limit_frequency: limitFrequency,
          limit_start_date: limitStartDate,
          limit_end_date: limitEndDate || null
        })
        .eq('id', session.user.id)

      if (error) throw error
      
      toast.success('Đã cập nhật hạn mức tháng!')
      setShowIncomeModal(false)
      fetchDashboardData() // Refresh
      
    } catch (error) {
      toast.error('Lỗi cập nhật: ' + error.message)
    } finally {
      setUpdatingIncome(false)
    }
  }

  const handleDeleteTransactions = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/transactions', { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Đã xóa tất cả giao dịch')
        fetchDashboardData()
      } else {
        toast.error(json.message)
      }
    } catch (error) {
      toast.error('Lỗi khi xóa giao dịch')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const balance = income - expense

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Tổng quan</h1>
          <p className="text-surface-400 mt-1">Xin chào! Dưới đây là tình hình tháng này của bạn.</p>
        </div>
        <Button onClick={() => setShowIncomeModal(true)} className="w-full sm:w-auto">
          + Cập nhật hạn mức
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-surface-900 to-surface-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-surface-300">
              Tổng thu {limitFrequency === 'monthly' ? '(Tháng này)' : limitFrequency === 'weekly' ? '(Tuần này)' : '(Hôm nay)'}
            </CardDescription>
            <CardTitle className="text-2xl text-success-500">{formatVND(income)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-surface-900 to-surface-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-surface-300">Tổng chi</CardDescription>
            <CardTitle className="text-2xl text-danger-500">{formatVND(expense)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-primary-900/20 to-accent-900/10 border-primary-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-300">Số dư khả dụng</CardDescription>
            <CardTitle className="text-2xl text-primary-400">{formatVND(balance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SpendingPieChart data={chartData} />
        <RecentTransactions 
          transactions={transactions.slice(0, 5)} 
          onDeleteAll={handleDeleteTransactions} 
        />
      </div>

      <div className="grid grid-cols-1">
        <ScheduledWidget />
      </div>

      {showIncomeModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Cập nhật hạn mức</h3>
              <p className="text-surface-400 text-sm mb-4">
                Nhập số tiền và chu kỳ hạn mức của bạn.
              </p>
              <form onSubmit={handleUpdateIncome} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-surface-300">Số tiền (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    placeholder="VD: 15000000"
                    value={newIncome}
                    onChange={(e) => setNewIncome(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-surface-300">Chu kỳ hạn mức</label>
                  <select
                    className="w-full mt-1 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    value={limitFrequency}
                    onChange={e => setLimitFrequency(e.target.value)}
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-surface-300">Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500 text-xs sm:text-sm"
                      value={limitStartDate}
                      onChange={e => setLimitStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300">Ngày kết thúc</label>
                    <input
                      type="date"
                      className="w-full mt-1 px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white focus:outline-none focus:border-primary-500 text-xs sm:text-sm"
                      value={limitEndDate}
                      onChange={e => setLimitEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowIncomeModal(false)}
                    disabled={updatingIncome}
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit"
                    className="flex-1"
                    disabled={updatingIncome}
                  >
                    {updatingIncome ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Lưu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
