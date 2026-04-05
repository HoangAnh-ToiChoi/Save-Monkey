"use client"
import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatVND } from '@/lib/utils'

export function SpendingPieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 h-full bg-surface-900/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Cơ cấu chi tiêu</CardTitle>
          <CardDescription>Tháng này</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-surface-500">
          Chưa có dữ liệu giao dịch
        </CardContent>
      </Card>
    )
  }

  // Pre-defined modern vibrant colors
  const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9']

  return (
    <Card className="col-span-1 h-full bg-surface-900/50 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Cơ cấu chi tiêu</CardTitle>
        <CardDescription>Các danh mục tốn kém nhất</CardDescription>
      </CardHeader>
      <CardContent className="h-64 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => formatVND(value)}
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
