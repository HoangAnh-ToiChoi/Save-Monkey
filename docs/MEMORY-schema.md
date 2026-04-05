# DATABASE SCHEMA (SUPABASE)
*(Chi tiết SQL: `supabase/schema.sql`)*
- Đã cài đặt DB: ✅ Đã chạy thành công trên Supabase Cloud
- Supabase Project: `shhtnvlbthtbrihtqljw`
- DB Timezone: UTC (app tự tính VN timezone trước khi gửi)

## Danh sách bảng:
| Bảng | Mô tả | RLS |
|------|--------|-----|
| `user_profiles` | Hồ sơ user (thu nhập, timezone, onboarding) | ✅ |
| `categories` | Danh mục chi tiêu (emoji, color) | ✅ |
| `scheduled_expenses` | Lịch chi phí tự động (frequency, time) | ✅ |
| `transactions` | Giao dịch (manual + auto) | ✅ |
| `budgets` | Định mức ngân sách theo tháng | ✅ |
| `push_subscriptions` | Web Push endpoint | ✅ |
| `ai_suggestions` | Kết quả phân tích AI | ✅ |

## Indexes đặc biệt:
- `idx_unique_scheduled_per_day` — Partial UNIQUE index trên `transactions(scheduled_expense_id, transaction_date)` WHERE `scheduled_expense_id IS NOT NULL`
  → Đảm bảo mỗi scheduled_expense chỉ tạo 1 transaction/ngày

## RPC Functions:
- `process_scheduled_expense(p_scheduled_expense_id, p_user_id, p_category_id, p_amount, p_note, p_transaction_date)`
  → INSERT transaction (ON CONFLICT DO NOTHING) + UPDATE last_run_date
  → Trả BOOLEAN: true = đã tạo, false = đã chạy rồi hôm nay
  → SECURITY DEFINER (bypass RLS)
