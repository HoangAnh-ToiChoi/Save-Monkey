"use client"
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatVND } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

export function RecentTransactions({ transactions, onDeleteAll }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <Card className="col-span-1 md:col-span-2 h-full bg-surface-900/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>Khoản chi/thu mới nhất</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowModal(true)} 
          title="Xóa tất cả giao dịch"
          disabled={!transactions || transactions.length === 0}
        >
           <Trash2 className="w-4 h-4 text-danger-500" />
        </Button>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-surface-500">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-surface-800/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-lg text-white ${
                    tx.type === 'income' ? 'bg-success-500' : 'bg-primary-500'
                  }`}>
                    {tx.note?.startsWith('Test: ') ? tx.note.split(' ')[1].charAt(0) : (tx.type === 'income' ? '+' : '-')}
                  </div>
                  <div>
                    <p className="font-medium text-white">{tx.note?.replace('Test: ', '') || "Giao dịch"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-surface-400">
                        {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}
                      </span>
                      {tx.source === 'auto' && (
                        <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-primary-500/30 text-primary-400">Auto</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${tx.type === 'income' ? 'text-success-500' : 'text-foreground'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Xoá Tất Cả (Popup nghịch hướng) */}
      {showModal && typeof document !== 'undefined' && createPortal(
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
                Bạn có chắc chắn muốn xóa toàn bộ lịch sử giao dịch? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="bg-surface-800/50 p-4 flex gap-3">
              {/* Nút Xóa (Trái, trong suốt, viền đỏ, chữ đỏ) */}
              <Button 
                variant="outline" 
                className="flex-1 border-danger-500/50 text-danger-500 hover:bg-danger-500/10"
                onClick={() => {
                  setShowModal(false)
                  if (onDeleteAll) onDeleteAll()
                }}
              >
                Tiếp tục xóa
              </Button>
              {/* Nút Hủy (Phải, nền nổi bật) */}
              <Button 
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                onClick={() => setShowModal(false)}
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
