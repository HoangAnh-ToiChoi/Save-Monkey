"use client"
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatVND } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Loader2, Plus, Clock, Power, Play, Trash2 } from 'lucide-react'

export function ScheduledWidget() {
  const [schedules, setSchedules] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // States cho form add
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [bulkActioning, setBulkActioning] = useState(false)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category_id: '',
    frequency: 'daily',
    scheduled_time: '07:00',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    day_of_week: [1], // Mặc định Thứ 2
    day_of_month: 1   // Mặc định mùng 1
  })

  useEffect(() => {
    fetchSchedules()
    fetchCategories()
  }, [])

  const getHeaders = async (includeJson = false) => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers = {}
    if (includeJson) headers['Content-Type'] = 'application/json'
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`
    return headers
  }

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/scheduled', { headers: await getHeaders() })
      const json = await res.json()
      if (json.success) {
        setSchedules(json.data)
      } else {
        toast.error('Lỗi tải danh sách tự động')
      }
    } catch (e) {
      toast.error('Lỗi kết nối Server')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { headers: await getHeaders() })
      const json = await res.json()
      if (json.success) setCategories(json.data)
    } catch (e) { }
  }

  const handleToggle = async (id, currentStatus) => {
    try {
      setTogglingId(id)
      const res = await fetch(`/api/scheduled/${id}`, {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify({ is_active: !currentStatus })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(currentStatus ? 'Đã tạm dừng' : 'Đã bật lại')
        fetchSchedules()
      } else {
        toast.error(json.message)
      }
    } catch (e) {
      toast.error('Lỗi khi thay đổi trạng thái')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteClick = (id) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    try {
      setTogglingId(deletingId)
      const res = await fetch(`/api/scheduled/${deletingId}`, { 
        method: 'DELETE',
        headers: await getHeaders()
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Đã xóa thành công')
        fetchSchedules()
        setShowDeleteModal(false)
      } else {
        toast.error(json.message)
      }
    } catch (e) {
      toast.error('Lỗi khi xóa')
    } finally {
      setTogglingId(null)
      setDeletingId(null)
    }
  }

  const handleManualTest = async () => {
    try {
      toast.loading('Đang chạy cron thủ công...', { id: 'cron' })
      const res = await fetch('/api/cron/process', { 
        method: 'POST',
        headers: await getHeaders()
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Xong! Processed: ${json.processed}, Skipped: ${json.skipped}, Failed: ${json.failed}`, { id: 'cron' })
        fetchSchedules()
      } else {
        toast.error('Có lỗi: ' + json.message, { id: 'cron' })
      }
    } catch (e) {
      toast.error('Lỗi gọi API cron', { id: 'cron' })
    }
  }

  const handleBulkToggle = async (isActive) => {
    try {
      setBulkActioning(true)
      const res = await fetch('/api/scheduled', {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify({ is_active: isActive })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(isActive ? 'Đã bật tất cả' : 'Đã dừng tất cả')
        fetchSchedules()
      } else {
        toast.error(json.message)
      }
    } catch (e) {
      toast.error('Lỗi kết nối Server')
    } finally {
      setBulkActioning(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setBulkActioning(true)
      const res = await fetch('/api/scheduled', {
        method: 'DELETE',
        headers: await getHeaders()
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Đã xóa tất cả hạn mức')
        fetchSchedules()
        setShowDeleteAllModal(false)
      } else {
        toast.error(json.message)
      }
    } catch (e) {
      toast.error('Lỗi kết nối Server')
    } finally {
      setBulkActioning(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.amount || !formData.scheduled_time) {
      toast.error('Vui lòng điền đủ thông tin')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/scheduled', {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify({
          ...formData,
          // Đảm bảo HH:mm:ss
          scheduled_time: formData.scheduled_time + ':00',
          amount: Number(formData.amount.replace(/\D/g, '')),
          start_date: new Date().toISOString().split('T')[0]
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Đã thêm giới hạn tự động trừ')
        setShowForm(false)
        setFormData({ 
          name: '', 
          amount: '', 
          category_id: '', 
          frequency: 'daily', 
          scheduled_time: '07:00',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          day_of_week: [1],
          day_of_month: 1
        })
        fetchSchedules()
      } else {
        toast.error(json.message)
      }
    } catch (e) {
      toast.error('Lỗi kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-gradient-to-b from-surface-900 to-surface-900/50 border-primary-500/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Hạn mức tự động trừ
          </CardTitle>
          <CardDescription>Trừ tiền hoặc thêm thu nhập mỗi ngày</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleManualTest} title="Chạy tất cả (Test Cron)" disabled={bulkActioning}>
             <Play className="w-4 h-4 text-warning-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleBulkToggle(false)} title="Dừng tất cả" disabled={bulkActioning}>
             <Power className="w-4 h-4 text-surface-400" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowDeleteAllModal(true)} title="Xóa tất cả" disabled={bulkActioning || schedules.length === 0}>
             <Trash2 className="w-4 h-4 text-danger-500" />
          </Button>
          <Button size="icon" onClick={() => setShowForm(!showForm)} disabled={bulkActioning}>
            <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-surface-800 rounded-xl border border-surface-700 space-y-4">
            <h4 className="text-sm font-semibold text-white">Thêm lịch mới</h4>
            
            <div className="grid gap-3">
              <div>
                <Label>Hạn mức / Lý do</Label>
                <Input 
                  placeholder="Tiền cà phê sáng..." 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Số tiền</Label>
                  <Input 
                    type="number" 
                    placeholder="35000" 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Thời gian chạy</Label>
                  <Input 
                    type="time" 
                    value={formData.scheduled_time}
                    onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tần suất</Label>
                  <Select 
                    value={formData.frequency}
                    onChange={e => setFormData({...formData, frequency: e.target.value})}
                  >
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </Select>
                </div>
                <div>
                  {formData.frequency === 'weekly' && (
                    <>
                      <Label>Ngày trong tuần</Label>
                      <Select 
                        value={formData.day_of_week[0]}
                        onChange={e => setFormData({...formData, day_of_week: [Number(e.target.value)]})}
                      >
                        <option value={1}>Thứ 2</option>
                        <option value={2}>Thứ 3</option>
                        <option value={3}>Thứ 4</option>
                        <option value={4}>Thứ 5</option>
                        <option value={5}>Thứ 6</option>
                        <option value={6}>Thứ 7</option>
                        <option value={0}>Chủ nhật</option>
                      </Select>
                    </>
                  )}
                  {formData.frequency === 'monthly' && (
                    <>
                      <Label>Ngày trong tháng</Label>
                      <Input 
                        type="number" 
                        min="1" max="28" 
                        value={formData.day_of_month}
                        onChange={e => setFormData({...formData, day_of_month: Number(e.target.value)})}
                      />
                    </>
                  )}
                  {formData.frequency === 'daily' && (
                    <>
                      <Label>Danh mục (Tùy chọn)</Label>
                      <Select 
                        value={formData.category_id}
                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                      >
                        <option value="">-- Chọn --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </Select>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ngày bắt đầu</Label>
                  <Input 
                    type="date" 
                    value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Ngày kết thúc (không bắt buộc)</Label>
                  <Input 
                    type="date" 
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              {formData.frequency !== 'daily' && (
                <div>
                  <Label>Danh mục (Tùy chọn)</Label>
                  <Select 
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Lưu lại'}
            </Button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-surface-400 text-sm border border-dashed border-surface-700 rounded-xl">
            Bạn chưa cài hạn mức tự động nào.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.is_active ? 'bg-surface-800 border-surface-700' : 'bg-surface-900 border-surface-800 opacity-60'} transition-all`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{item.name}</span>
                    {!item.is_active && <Badge variant="outline" className="text-[10px] h-4 py-0 text-surface-400">Đã dừng</Badge>}
                  </div>
                  <div className="text-xs text-surface-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-danger-400 font-semibold">{formatVND(item.amount)}</span>
                    <span>• Lúc: {item.scheduled_time.slice(0, 5)} ({item.frequency})</span>
                    {item.last_run_date ? (
                      <span className="text-success-400">✔ Chạy gần nhất: {new Date(item.last_run_date).toLocaleDateString('vi-VN')}</span>
                    ) : (
                      <span className="text-warning-400">⏳ Chưa chạy</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-surface-400 hover:text-white"
                    onClick={() => handleToggle(item.id, item.is_active)}
                    disabled={togglingId === item.id}
                  >
                    {togglingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className={`w-4 h-4 ${item.is_active ? 'text-success-500' : ''}`} />}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-surface-400 hover:text-danger-500"
                    onClick={() => handleDeleteClick(item.id)}
                    disabled={togglingId === item.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Custom Delete All Confirmation Modal */}
      {showDeleteAllModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-danger-500/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-danger-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Xóa tất cả?</h3>
              <p className="text-surface-400 text-center text-sm">
                Bạn có chắc chắn muốn xóa tất cả hạn mức tự động không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="bg-surface-800/50 p-4 flex gap-3">
              {/* Delete button (Nghịch hướng: Trái, trong suốt, viền đỏ) */}
              <Button 
                variant="outline" 
                className="flex-1 border-danger-500/50 text-danger-500 hover:bg-danger-500/10"
                onClick={handleDeleteAll}
                disabled={bulkActioning}
              >
                {bulkActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tiếp tục xóa
              </Button>
              {/* Cancel button (Phải, nổi bật) */}
              <Button 
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={bulkActioning}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Single Delete Confirmation Modal */}
      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-danger-500/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-danger-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Xác nhận xóa?</h3>
              <p className="text-surface-400 text-center text-sm">
                Bạn có chắc muốn xóa lịch tự động cộng/trừ này không?
              </p>
            </div>
            <div className="bg-surface-800/50 p-4 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-danger-500/50 text-danger-500 hover:bg-danger-500/10"
                onClick={handleConfirmDelete}
                disabled={togglingId === deletingId}
              >
                {togglingId === deletingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tiếp tục xóa
              </Button>
              <Button 
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingId(null)
                }}
                disabled={togglingId === deletingId}
              >
                Hủy bỏ
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Card>
  )
}
