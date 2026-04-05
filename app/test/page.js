'use client'
// app/test/page.js
// Trang test backend — chỉ dùng trong môi trường development

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CRON_SECRET = 'savemonkey-cron-secret-2026'
const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

// Tạo Supabase client một lần
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Styles object ───
const S = {
  page: { background: '#0f1117', color: '#e2e8f0', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { background: '#1a1d27', borderBottom: '1px solid #2e3347', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 },
  h1: { fontSize: 15, fontWeight: 700, color: '#818cf8', margin: 0 },
  badge: { background: '#6366f1', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700 },
  serverStatus: { marginLeft: 'auto', fontSize: 11 },
  layout: { display: 'grid', gridTemplateColumns: '270px 1fr', flex: 1, overflow: 'hidden', height: 'calc(100vh - 53px)' },
  sidebar: { background: '#1a1d27', borderRight: '1px solid #2e3347', overflowY: 'auto', padding: '12px 0' },
  sectionLabel: { padding: '6px 16px', fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginTop: 8, display: 'block' },
  main: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  testPanel: { padding: '18px 24px', borderBottom: '1px solid #2e3347', background: '#242736', flexShrink: 0 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: '#818cf8', marginBottom: 4 },
  panelDesc: { color: '#64748b', fontSize: 11, marginBottom: 14 },
  controls: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  logArea: { overflowY: 'auto', padding: '12px 24px', flex: 1 },
  inputRow: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  label: { color: '#64748b', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 },
  input: { background: '#1a1d27', border: '1px solid #2e3347', color: '#e2e8f0', fontFamily: 'inherit', fontSize: 12, padding: '6px 10px', borderRadius: 6, outline: 'none', minWidth: 200 },
}

// ─── Button component ───
function Btn({ onClick, children, variant = 'primary', disabled = false }) {
  const colors = {
    primary: { background: '#6366f1', color: 'white' },
    secondary: { background: '#1a1d27', color: '#e2e8f0', border: '1px solid #2e3347' },
    danger: { background: '#ef4444', color: 'white' },
    success: { background: '#22c55e', color: '#000' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...colors[variant],
        border: colors[variant].border || 'none',
        padding: '7px 16px',
        borderRadius: 6,
        fontFamily: 'inherit',
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: 600,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Sidebar button ───
function SideBtn({ id, icon, label, active, dotStatus, onClick }) {
  const dotColor = { pass: '#22c55e', fail: '#ef4444', warn: '#f59e0b', '': '#64748b' }[dotStatus] || '#64748b'
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', background: active ? '#242736' : 'none',
        border: 'none', borderRight: active ? '2px solid #6366f1' : '2px solid transparent',
        color: active ? '#818cf8' : '#e2e8f0',
        fontFamily: 'inherit', fontSize: 12,
        padding: '9px 16px', cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
    </button>
  )
}

// ─── Log entry component ───
function LogEntry({ time, msg, type, isJson, isTable, data, cols }) {
  const typeColors = { success: '#22c55e', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6', header: '#818cf8', '': '#e2e8f0' }
  const color = typeColors[type] || '#e2e8f0'

  if (isJson) {
    return (
      <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ color: '#64748b', fontSize: 10, flexShrink: 0, minWidth: 70, paddingTop: 2 }}>{time}</span>
        <div style={{ flex: 1 }}>
          <pre style={{ background: '#242736', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#94a3b8', margin: 0, overflowX: 'auto', borderLeft: '2px solid #6366f1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {msg}
          </pre>
        </div>
      </div>
    )
  }

  if (isTable && data) {
    return (
      <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: 10, flexShrink: 0, minWidth: 70 }}>{time}</span>
          <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>{data.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>{cols.map(c => <th key={c} style={{ background: '#1a1d27', color: '#64748b', padding: '5px 10px', textAlign: 'left', border: '1px solid #2e3347', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {cols.map(c => {
                    let val = row[c]
                    let display = ''
                    let style = { padding: '5px 10px', border: '1px solid #2e3347', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                    if (val === null || val === undefined) { display = 'null'; style.color = '#64748b' }
                    else if (typeof val === 'boolean') { display = val ? '✅' : '❌' }
                    else if (typeof val === 'object') { display = JSON.stringify(val).substring(0, 50) }
                    else { display = String(val).substring(0, 80) }
                    // Status chips
                    if (c === 'status') {
                      const chipColor = { success: '#22c55e', skipped: '#f59e0b', failed: '#ef4444', created: '#22c55e', error: '#ef4444' }[val] || '#64748b'
                      return <td key={c} style={style}><span style={{ background: chipColor + '22', color: chipColor, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{display}</span></td>
                    }
                    return <td key={c} style={style} title={String(row[c] ?? '')}>{display}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', animation: 'fadeIn 0.2s ease' }}>
      <span style={{ color: '#64748b', fontSize: 10, flexShrink: 0, minWidth: 70, paddingTop: 2 }}>{time}</span>
      <span style={{ flex: 1, color, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6, fontWeight: type === 'header' ? 700 : 400, fontSize: type === 'header' ? 12 : 13 }}>{msg}</span>
    </div>
  )
}

// ─── Main component ───
export default function TestPage() {
  const [activePanel, setActivePanel] = useState('supabase')
  const [logs, setLogs] = useState([])
  const [dots, setDots] = useState({})
  const [serverStatus, setServerStatus] = useState({ text: 'Đang kiểm tra...', color: '#64748b', online: false })
  const [loading, setLoading] = useState(false)
  const logRef = useRef(null)

  // Form fields
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [rpcId, setRpcId] = useState('')
  const [seedUserId, setSeedUserId] = useState('')
  const [seedCatId, setSeedCatId] = useState('')

  // Append log
  const addLog = useCallback((msg, type = '', extra = {}) => {
    const time = new Date().toLocaleTimeString('vi-VN')
    setLogs(prev => [...prev, { time, msg, type, ...extra, key: Date.now() + Math.random() }])
    setTimeout(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, 50)
  }, [])

  const clearLog = useCallback(() => setLogs([]), [])

  const setDot = useCallback((id, status) => {
    setDots(prev => ({ ...prev, [id]: status }))
  }, [])

  // Ping server on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/cron/process', {
          method: 'GET',
          headers: { Authorization: 'Bearer wrong-intentional-401' },
        })
        if (r.status === 401 || r.ok) {
          setServerStatus({ text: '✅ Next.js: Running', color: '#22c55e', online: true })
        }
      } catch {
        setServerStatus({ text: '❌ Server offline', color: '#ef4444', online: false })
      }

      // Welcome log
      addLog('══════════════════════════════════════', 'header')
      addLog('  🧪 CHI TIÊU THÔNG MINH — TEST UI', 'header')
      addLog('══════════════════════════════════════', 'header')
      addLog('Sẵn sàng! Chọn test từ sidebar.', 'success')
      addLog('Thứ tự khuyến nghị: Supabase → Auth → Tables → Cron API → RPC', 'info')
    })()
  }, [addLog])

  // ─── Test: Supabase Connection ───
  async function testSupabase() {
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  🔌 SUPABASE CONNECTION TEST', 'header')
    addLog('══════════════════════════════════════', 'header')
    addLog(`URL: ${SUPABASE_URL}`, 'info')
    addLog(`Anon Key: ${SUPABASE_ANON_KEY?.substring(0, 20)}...`, 'info')
    addLog('\n🔄 Ping Supabase...', 'info')

    try {
      const start = Date.now()
      const { error, status } = await supabase.from('categories').select('count', { count: 'exact', head: true })
      const ms = Date.now() - start

      if (error && error.code !== 'PGRST116') {
        addLog(`❌ Lỗi: ${error.message} (${error.code})`, 'error')
        setDot('supabase', 'fail')
      } else {
        addLog(`✅ Kết nối thành công! Ping: ${ms}ms | HTTP ${status}`, 'success')
        setDot('supabase', 'pass')
      }

      // Check session
      addLog('\n🔄 Kiểm tra Auth session...', 'info')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        addLog(`✅ Đang đăng nhập: ${session.user.email}`, 'success')
        addLog(`   User ID: ${session.user.id}`, 'info')
        setSeedUserId(session.user.id)
      } else {
        addLog('⚠️  Chưa đăng nhập — RLS sẽ trả 0 rows cho các bảng user', 'warn')
      }

      // Check cron_logs (public)
      addLog('\n🔄 Test truy cập bảng cron_logs...', 'info')
      const { data: logData, error: logErr } = await supabase.from('cron_logs').select('id').limit(1)
      if (logErr) {
        addLog(`⚠️  cron_logs: ${logErr.message}`, 'warn')
      } else {
        addLog(`✅ cron_logs OK — ${logData?.length ?? 0} rows hiển thị`, 'success')
      }

    } catch (e) {
      addLog(`💥 Exception: ${e.message}`, 'error')
      setDot('supabase', 'fail')
    }
    addLog('\n✅ Hoàn tất!', 'success')
  }

  // ─── Test: Cron API ───
  async function testCronAPI(correct) {
    clearLog()
    const secret = correct ? CRON_SECRET : 'wrong-secret-xyz'
    addLog('══════════════════════════════════════', 'header')
    addLog(`  ⚙️  CRON API — ${correct ? 'ĐÚNG SECRET' : 'SAI SECRET'}`, 'header')
    addLog('══════════════════════════════════════', 'header')
    addLog(`\n🔄 GET /api/cron/process`, 'info')
    addLog(`   Authorization: Bearer ${secret}`, 'info')
    setLoading(true)

    try {
      const start = Date.now()
      const res = await fetch('/api/cron/process', { headers: { Authorization: `Bearer ${secret}` } })
      const ms = Date.now() - start
      const json = await res.json()

      addLog(`\n📡 HTTP ${res.status} | ${ms}ms`, res.ok ? 'success' : 'error')

      if (res.status === 401) {
        if (!correct) {
          addLog('✅ Auth guard hoạt động đúng — từ chối sai secret', 'success')
          setDot('cron-api', 'pass')
        } else {
          addLog('❌ Lỗi: API từ chối đúng secret!', 'error')
          setDot('cron-api', 'fail')
        }
      } else if (json.success) {
        addLog(`✅ Cron API OK!`, 'success')
        addLog(`   Processed: ${json.processed} | Skipped: ${json.skipped} | Total: ${json.total}`, 'success')
        addLog(`   Window: ${json.window?.start} → ${json.window?.end} | Date: ${json.date}`, 'info')
        if (json.results?.length > 0) {
          addLog('\n📊 Results:', 'info')
          addLog(null, '', { isTable: true, data: json.results, cols: ['id','name','amount','status','reason','error'] })
        }
        setDot('cron-api', 'pass')
      }

      addLog(JSON.stringify(json, null, 2), '', { isJson: true })
    } catch (e) {
      addLog(`💥 Fetch error: ${e.message}`, 'error')
      setDot('cron-api', 'fail')
    }
    setLoading(false)
  }

  // ─── View Table ───
  async function viewTable(table, cols, orderBy = 'created_at', limit = 30) {
    clearLog()
    const dotId = { scheduled_expenses: 'scheduled', cron_logs: 'cron-logs', transactions: 'transactions', categories: 'categories' }[table] || table
    addLog('══════════════════════════════════════', 'header')
    addLog(`  📊 TABLE: ${table.toUpperCase()}`, 'header')
    addLog('══════════════════════════════════════', 'header')
    addLog(`🔄 Query ${limit} rows...`, 'info')
    setLoading(true)

    try {
      const { data, error, status } = await supabase.from(table).select('*').order(orderBy, { ascending: false }).limit(limit)

      if (error) {
        addLog(`❌ Lỗi HTTP ${status}: ${error.message}`, 'error')
        addLog(`   Code: ${error.code}`, 'error')
        if (error.code === 'PGRST301' || error.code === '42501') {
          addLog('⚠️  RLS đang chặn — cần đăng nhập trước', 'warn')
        }
        setDot(dotId, 'fail')
      } else {
        addLog(`✅ ${data.length} rows trả về`, 'success')
        if (data.length === 0) {
          addLog('⚠️  Bảng trống — cần seed data hoặc đăng nhập với đúng user', 'warn')
          setDot(dotId, 'warn')
        } else {
          addLog(null, '', { isTable: true, data, cols })
          setDot(dotId, 'pass')
        }
      }
    } catch (e) {
      addLog(`💥 ${e.message}`, 'error')
    }
    setLoading(false)
  }

  // ─── View Cron Logs ───
  async function viewCronLogs() {
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  📋 CRON LOGS VIEWER', 'header')
    addLog('══════════════════════════════════════', 'header')
    setLoading(true)

    const { data, error } = await supabase.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(50)

    if (error) {
      addLog(`❌ ${error.message}`, 'error')
      if (error.message.includes('row-level') || error.code === 'PGRST301') {
        addLog('⚠️  cron_logs chưa có RLS policy — cần thêm vào schema', 'warn')
      }
      setDot('cron-logs', 'fail')
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      addLog('⚠️  Bảng cron_logs trống', 'warn')
      addLog('💡 Chạy Cron API test để tạo logs', 'info')
      setDot('cron-logs', 'warn')
      setLoading(false)
      return
    }

    const s = data.filter(r => r.status === 'success').length
    const sk = data.filter(r => r.status === 'skipped').length
    const f = data.filter(r => r.status === 'failed').length
    addLog(`✅ ${data.length} logs | ✅ ${s} success | ⏭ ${sk} skipped | ❌ ${f} failed`, 'success')
    addLog(null, '', { isTable: true, data, cols: ['id','scheduled_expense_id','status','message','created_at'] })
    setDot('cron-logs', f > 0 ? 'warn' : 'pass')
    setLoading(false)
  }

  // ─── RPC ───
  async function loadRPCIds() {
    clearLog()
    addLog('🔄 Tải danh sách scheduled expenses...', 'info')
    const { data, error } = await supabase.from('scheduled_expenses').select('id, name, amount, frequency, is_active').limit(10)

    if (error) { addLog(`❌ ${error.message}`, 'error'); return }
    if (!data || data.length === 0) {
      addLog('⚠️  Không có scheduled expense nào', 'warn')
      addLog('💡 Dùng tab "Insert Test Data" để seed', 'info')
      return
    }
    addLog(`✅ ${data.length} scheduled expenses:`, 'success')
    addLog(null, '', { isTable: true, data, cols: ['id','name','amount','frequency','is_active'] })
    setRpcId(data[0].id)
    addLog(`\n✅ Auto-fill ID: ${data[0].id}`, 'success')
  }

  async function testRPC() {
    if (!rpcId.trim()) { addLog('⚠️  Nhập Scheduled Expense ID!', 'warn'); return }
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  ⚡ RPC: process_scheduled_expense', 'header')
    addLog('══════════════════════════════════════', 'header')
    addLog(`\n🔄 Gọi RPC với p_id = ${rpcId}`, 'info')
    setLoading(true)

    try {
      const start = Date.now()
      const { data, error } = await supabase.rpc('process_scheduled_expense', { p_id: rpcId })
      const ms = Date.now() - start

      if (error) {
        addLog(`\n❌ RPC Error (${ms}ms): ${error.message}`, 'error')
        addLog(`   Code: ${error.code}`, 'error')
        if (error.message.includes('function') || error.message.includes('argument')) {
          addLog('\n🐛 BUG: Function signature không khớp!', 'error')
          addLog('   SQL nhận: p_id UUID', 'warn')
          addLog('   Cron route gọi: p_scheduled_expense_id (params cũ) → cần fix!', 'warn')
        }
        setDot('rpc', 'fail')
        addLog(JSON.stringify(error, null, 2), '', { isJson: true })
        setLoading(false)
        return
      }

      if (data === true) {
        addLog(`\n✅ THÀNH CÔNG (${ms}ms) — Transaction mới đã tạo!`, 'success')
        setDot('rpc', 'pass')
      } else if (data === false) {
        addLog(`\n⏭️  SKIPPED (${ms}ms) — Đã chạy hôm nay (ON CONFLICT DO NOTHING)`, 'warn')
        addLog('   Đây là behavior đúng!', 'info')
        setDot('rpc', 'warn')
      }

      // Xem log mới nhất
      addLog('\n🔄 Cron logs mới nhất sau khi chạy:', 'info')
      const { data: logs } = await supabase.from('cron_logs').select('*').order('created_at', { ascending: false }).limit(3)
      if (logs?.length > 0) {
        addLog(null, '', { isTable: true, data: logs, cols: ['id','scheduled_expense_id','status','message','created_at'] })
      }
    } catch (e) {
      addLog(`💥 ${e.message}`, 'error')
      setDot('rpc', 'fail')
    }
    setLoading(false)
  }

  // ─── Seed ───
  async function seedExpense() {
    if (!seedUserId.trim()) { addLog('⚠️  Nhập User ID! (Đăng nhập ở tab Auth)', 'warn'); return }
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  🌱 SEED: Tạo Scheduled Expense Test', 'header')
    addLog('══════════════════════════════════════', 'header')
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const payload = {
      user_id: seedUserId,
      category_id: seedCatId || null,
      name: `[TEST] Chi phí tự động ${Date.now()}`,
      amount: 50000,
      frequency: 'daily',
      scheduled_time: '00:05:00',
      start_date: today,
      is_active: true,
    }

    addLog(JSON.stringify(payload, null, 2), '', { isJson: true })

    const { data, error } = await supabase.from('scheduled_expenses').insert(payload).select().single()
    if (error) {
      addLog(`❌ ${error.message}`, 'error')
      if (error.code === '42501' || error.message.includes('RLS') || error.message.includes('policy')) {
        addLog('⚠️  RLS chặn INSERT — cần đăng nhập để insert data của chính user', 'warn')
      }
      setDot('seed', 'fail')
    } else {
      addLog(`\n✅ Tạo thành công!`, 'success')
      addLog(JSON.stringify(data, null, 2), '', { isJson: true })
      setRpcId(data.id)
      addLog(`\n💡 ID đã được auto-fill vào tab RPC: ${data.id}`, 'info')
      setDot('seed', 'pass')
    }
    setLoading(false)
  }

  // ─── Auth ───
  async function doSignUp() {
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  📝 AUTH: Đăng ký', 'header')
    addLog('══════════════════════════════════════', 'header')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    if (error) {
      addLog(`❌ ${error.message}`, 'error')
      setDot('auth', 'fail')
    } else {
      addLog('✅ Đăng ký thành công!', 'success')
      if (data.user) {
        addLog(`   User ID: ${data.user.id}`, 'info')
        addLog(`   Email: ${data.user.email}`, 'info')
        setSeedUserId(data.user.id)
        addLog('💡 User ID đã auto-fill vào tab Seed Data', 'info')
      }
      if (!data.session) addLog('⚠️  Kiểm tra email để xác nhận tài khoản', 'warn')
      setDot('auth', 'pass')
      addLog(JSON.stringify(data, null, 2), '', { isJson: true })
    }
    setLoading(false)
  }

  async function doSignIn() {
    clearLog()
    addLog('══════════════════════════════════════', 'header')
    addLog('  🔑 AUTH: Đăng nhập', 'header')
    addLog('══════════════════════════════════════', 'header')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) {
      addLog(`❌ ${error.message}`, 'error')
      setDot('auth', 'fail')
    } else {
      addLog(`✅ Đăng nhập thành công!`, 'success')
      addLog(`   User ID: ${data.user.id}`, 'success')
      addLog(`   Email: ${data.user.email}`, 'info')
      setSeedUserId(data.user.id)
      setServerStatus(prev => ({ ...prev, text: `✅ Logged in: ${data.user.email}`, color: '#22c55e' }))
      setDot('auth', 'pass')
    }
    setLoading(false)
  }

  async function doSignOut() {
    const { error } = await supabase.auth.signOut()
    clearLog()
    if (error) { addLog(`❌ ${error.message}`, 'error'); return }
    addLog('✅ Đã đăng xuất', 'success')
    setServerStatus(prev => ({ ...prev, text: '✅ Next.js: Running', color: '#22c55e' }))
  }

  async function getSession() {
    clearLog()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      addLog('⚠️  Không có session — chưa đăng nhập', 'warn')
      return
    }
    addLog(`✅ Session active!`, 'success')
    addLog(`   User ID: ${session.user.id}`, 'info')
    addLog(`   Email: ${session.user.email}`, 'info')
    addLog(`   Expires: ${new Date(session.expires_at * 1000).toLocaleString('vi-VN')}`, 'info')
    setSeedUserId(session.user.id)
    addLog(JSON.stringify(session.user, null, 2), '', { isJson: true })
  }

  // ─── Panel definitions ───
  const sidePanels = [
    { section: 'KẾT NỐI' },
    { id: 'supabase', icon: '🔌', label: 'Supabase Connection' },
    { id: 'cron-api', icon: '⚙️', label: 'Cron API Endpoint' },
    { section: 'DATABASE' },
    { id: 'categories', icon: '📂', label: 'Categories' },
    { id: 'scheduled', icon: '🕐', label: 'Scheduled Expenses' },
    { id: 'transactions', icon: '💳', label: 'Transactions' },
    { id: 'cron-logs', icon: '📋', label: 'Cron Logs' },
    { section: 'RPC FUNCTIONS' },
    { id: 'rpc', icon: '⚡', label: 'process_scheduled_expense' },
    { section: 'DATA & AUTH' },
    { id: 'seed', icon: '🌱', label: 'Insert Test Data' },
    { id: 'auth', icon: '🔐', label: 'Auth (Đăng ký / Đăng nhập)' },
  ]

  // ─── Render panel content ───
  const renderPanel = () => {
    switch (activePanel) {
      case 'supabase':
        return (
          <>
            <h2 style={S.panelTitle}>🔌 Supabase Connection Test</h2>
            <p style={S.panelDesc}>Kiểm tra kết nối đến Supabase Cloud và xác thực anon key.</p>
            <div style={S.controls}>
              <Btn onClick={testSupabase} disabled={loading}>▶ Chạy Test</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'cron-api':
        return (
          <>
            <h2 style={S.panelTitle}>⚙️ Cron API Endpoint Test</h2>
            <p style={S.panelDesc}>Gọi <code style={{background:'#1a1d27',padding:'1px 6px',borderRadius:4}}>GET /api/cron/process</code> — test auth và xử lý scheduled expenses.</p>
            <div style={S.controls}>
              <Btn onClick={() => testCronAPI(true)} disabled={loading}>▶ Test đúng secret</Btn>
              <Btn onClick={() => testCronAPI(false)} variant="danger" disabled={loading}>✗ Test sai secret</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'categories':
        return (
          <>
            <h2 style={S.panelTitle}>📂 Categories Table</h2>
            <p style={S.panelDesc}>Xem bảng categories — cần đăng nhập (RLS policy).</p>
            <div style={S.controls}>
              <Btn onClick={() => viewTable('categories', ['id','user_id','name','icon','color','is_default','created_at'])} disabled={loading}>▶ Xem dữ liệu</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'scheduled':
        return (
          <>
            <h2 style={S.panelTitle}>🕐 Scheduled Expenses</h2>
            <p style={S.panelDesc}>Xem bảng scheduled_expenses — cần đăng nhập (RLS).</p>
            <div style={S.controls}>
              <Btn onClick={() => viewTable('scheduled_expenses', ['id','name','amount','frequency','scheduled_time','is_active','last_run_date','created_at'])} disabled={loading}>▶ Xem dữ liệu</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'transactions':
        return (
          <>
            <h2 style={S.panelTitle}>💳 Transactions</h2>
            <p style={S.panelDesc}>20 transactions mới nhất — cần đăng nhập (RLS).</p>
            <div style={S.controls}>
              <Btn onClick={() => viewTable('transactions', ['id','type','amount','source','note','transaction_date','created_at'], 'transaction_date', 20)} disabled={loading}>▶ Xem dữ liệu</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'cron-logs':
        return (
          <>
            <h2 style={S.panelTitle}>📋 Cron Logs</h2>
            <p style={S.panelDesc}>50 logs gần nhất từ bảng cron_logs.</p>
            <div style={S.controls}>
              <Btn onClick={viewCronLogs} disabled={loading}>▶ Tải Cron Logs</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'rpc':
        return (
          <>
            <h2 style={S.panelTitle}>⚡ RPC: process_scheduled_expense</h2>
            <p style={S.panelDesc}>Test RPC function trực tiếp — INSERT transaction + log atomically.</p>
            <div style={S.inputRow}>
              <label style={S.label}>
                Scheduled Expense ID (UUID)
                <input
                  style={{ ...S.input, minWidth: 340 }}
                  value={rpcId}
                  onChange={e => setRpcId(e.target.value)}
                  placeholder="paste UUID ở đây..."
                />
              </label>
            </div>
            <div style={S.controls}>
              <Btn onClick={testRPC} disabled={loading}>⚡ Gọi RPC</Btn>
              <Btn onClick={loadRPCIds} variant="secondary" disabled={loading}>📋 Load danh sách IDs</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'seed':
        return (
          <>
            <h2 style={S.panelTitle}>🌱 Insert Test Data</h2>
            <p style={S.panelDesc}>Tạo scheduled_expense test. Đăng nhập trước để lấy User ID.</p>
            <div style={S.inputRow}>
              <label style={S.label}>
                User ID
                <input style={S.input} value={seedUserId} onChange={e => setSeedUserId(e.target.value)} placeholder="auto-fill sau khi đăng nhập..." />
              </label>
              <label style={S.label}>
                Category ID (tuỳ chọn)
                <input style={S.input} value={seedCatId} onChange={e => setSeedCatId(e.target.value)} placeholder="optional UUID..." />
              </label>
            </div>
            <div style={S.controls}>
              <Btn onClick={seedExpense} variant="success" disabled={loading}>🌱 Tạo Test Expense</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      case 'auth':
        return (
          <>
            <h2 style={S.panelTitle}>🔐 Auth — Đăng ký / Đăng nhập</h2>
            <p style={S.panelDesc}>Test Supabase Auth. Đăng nhập để các test table khác hoạt động (RLS).</p>
            <div style={S.inputRow}>
              <label style={S.label}>
                Email
                <input type="email" style={S.input} value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="your@email.com" />
              </label>
              <label style={S.label}>
                Password
                <input type="password" style={S.input} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="min 6 ký tự" />
              </label>
            </div>
            <div style={S.controls}>
              <Btn onClick={doSignUp} disabled={loading}>📝 Đăng ký</Btn>
              <Btn onClick={doSignIn} variant="success" disabled={loading}>🔑 Đăng nhập</Btn>
              <Btn onClick={doSignOut} variant="danger" disabled={loading}>🚪 Đăng xuất</Btn>
              <Btn onClick={getSession} variant="secondary" disabled={loading}>👤 Xem Session</Btn>
              <Btn onClick={clearLog} variant="secondary">🗑 Xóa log</Btn>
            </div>
          </>
        )
      default: return null
    }
  }

  return (
    <div style={S.page}>
      {/* Global animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f1117; }
        ::-webkit-scrollbar-thumb { background: #2e3347; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={S.header}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: serverStatus.online ? '#22c55e' : '#64748b', flexShrink: 0 }} />
        <h1 style={S.h1}>🧪 Chi Tiêu Thông Minh — Backend Test UI</h1>
        <span style={S.badge}>DEV</span>
        {loading && <span style={{ color: '#f59e0b', fontSize: 11, marginLeft: 8 }}>⏳ Loading...</span>}
        <span style={{ ...S.serverStatus, color: serverStatus.color }}>{serverStatus.text}</span>
      </header>

      {/* Layout */}
      <div style={S.layout}>
        {/* Sidebar */}
        <aside style={S.sidebar}>
          {sidePanels.map((item, i) =>
            item.section
              ? <span key={i} style={S.sectionLabel}>{item.section}</span>
              : <SideBtn key={item.id} {...item} active={activePanel === item.id} dotStatus={dots[item.id] || ''} onClick={setActivePanel} />
          )}
        </aside>

        {/* Main */}
        <main style={S.main}>
          <div style={S.testPanel}>{renderPanel()}</div>
          <div ref={logRef} style={S.logArea}>
            {logs.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', padding: 40, fontSize: 12 }}>
                Chưa có log — bấm nút để chạy test
              </div>
            )}
            {logs.map(entry => <LogEntry key={entry.key} {...entry} />)}
          </div>
        </main>
      </div>
    </div>
  )
}
