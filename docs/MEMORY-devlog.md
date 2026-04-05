# DEVLOG — GHI CHÚ KỸ THUẬT

## 2026-04-05 — Setup DB + Cron Auto-Deduct

### Quyết định kỹ thuật:
1. **Dùng RPC Function thay vì JS transaction**: 
   - Supabase JS SDK không hỗ trợ `BEGIN...COMMIT` (DB transaction)
   - Tạo PostgreSQL function `process_scheduled_expense` chạy INSERT + UPDATE atomic
   - Dùng `SECURITY DEFINER` để bypass RLS (cron cần truy cập data tất cả users)

2. **Partial UNIQUE Index cho duplicate guard**:
   - `UNIQUE (scheduled_expense_id, transaction_date) WHERE scheduled_expense_id IS NOT NULL`
   - Không dùng table-level UNIQUE vì `scheduled_expense_id` có thể NULL (giao dịch manual)
   - Kết hợp `ON CONFLICT DO NOTHING` trong RPC → không bao giờ duplicate

3. **Timezone handling**:
   - Supabase DB chạy UTC
   - API cron tính today theo `Asia/Ho_Chi_Minh` trước khi truyền vào RPC
   - Truyền date dạng string `'YYYY-MM-DD'` → PostgreSQL cast sang DATE đúng
   - **Lưu ý**: Khi đọc DATE từ pg driver (Node.js), `.toISOString()` sẽ bị lệch 7h → dùng `.getDate()/.getMonth()/.getFullYear()` để so sánh

4. **Connection string**: Dùng pooler (port 6543) thay vì direct (port 5432)
   - Phù hợp serverless (Vercel) — connection pooling giữ số kết nối thấp

### Test results:
- ✅ RPC lần 1: INSERT thành công (return true)
- ✅ RPC lần 2: Duplicate blocked (return false)
- ✅ Transactions count = 1 (không duplicate)
- ✅ last_run_date được cập nhật đúng
- ✅ API `/api/cron/process` trả HTTP 200
