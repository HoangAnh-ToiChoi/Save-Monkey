-- ============================================================
-- CHI TIÊU THÔNG MINH — DATABASE SCHEMA
-- Chạy theo thứ tự: user_profiles → categories → scheduled_expenses
--                  → transactions → budgets → push_subscriptions
--                  → ai_suggestions → RLS → RPC Functions
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. BẢNG user_profiles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID    REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  monthly_income   DECIMAL(15, 0) DEFAULT 0,  -- Vẫn dùng làm Số tiền hạn mức
  limit_frequency  VARCHAR(10)   DEFAULT 'monthly' CHECK (limit_frequency IN ('daily','weekly','monthly','yearly')),
  limit_start_date DATE          DEFAULT CURRENT_DATE,
  limit_end_date   DATE,
  currency         VARCHAR(3)    DEFAULT 'VND',
  onboarding_done  BOOLEAN       DEFAULT FALSE,
  timezone         VARCHAR(50)   DEFAULT 'Asia/Ho_Chi_Minh',
  ai_last_run_at   TIMESTAMP,
  created_at       TIMESTAMP     DEFAULT NOW(),
  updated_at       TIMESTAMP     DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. BẢNG categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(10),          -- emoji: "🍜"
  color      VARCHAR(7),           -- hex: "#FF6B6B"
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ─────────────────────────────────────────────
-- 3. BẢNG scheduled_expenses — Chi phí tự động theo giờ
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_expenses (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID    REFERENCES auth.users(id)  ON DELETE CASCADE,
  category_id    UUID    REFERENCES categories(id)  ON DELETE SET NULL,

  name           VARCHAR(200)  NOT NULL,
  amount         DECIMAL(15,0) NOT NULL CHECK (amount > 0),
  note           TEXT,

  -- Lịch chạy
  frequency      VARCHAR(10) NOT NULL CHECK (
                   frequency IN ('daily','weekly','monthly','yearly')
                 ),
  scheduled_time TIME NOT NULL,              -- Giờ cụ thể: '07:00:00'
  day_of_week    INTEGER[],
  -- Mảng ngày trong tuần: [1,2,3,4,5]=T2-T6, [0,6]=cuối tuần
  -- Chỉ dùng khi frequency='weekly'
  day_of_month   INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  -- Chỉ dùng khi frequency='monthly' hoặc 'yearly'
  month_of_year  INTEGER CHECK (month_of_year BETWEEN 1 AND 12),
  -- Chỉ dùng khi frequency='yearly'

  start_date     DATE      NOT NULL DEFAULT CURRENT_DATE,
  end_date       DATE,               -- NULL = không hết hạn
  is_active      BOOLEAN   DEFAULT TRUE,
  last_run_date  DATE,               -- Ngày cuối đã chạy thành công
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_user_id ON scheduled_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_active  ON scheduled_expenses(is_active, last_run_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_time    ON scheduled_expenses(scheduled_time);

-- ─────────────────────────────────────────────
-- 4. BẢNG transactions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID    REFERENCES auth.users(id)          ON DELETE CASCADE,
  category_id          UUID    REFERENCES categories(id)          ON DELETE SET NULL,
  scheduled_expense_id UUID    REFERENCES scheduled_expenses(id)  ON DELETE SET NULL,
  -- NULL = nhập tay | có ID = tạo tự động

  type                 VARCHAR(10) NOT NULL CHECK (type IN ('expense','income')),
  amount               DECIMAL(15,0) NOT NULL CHECK (amount > 0),
  note                 TEXT,
  source               VARCHAR(10) DEFAULT 'manual'
                         CHECK (source IN ('manual','auto')),
  -- 'manual' = người dùng nhập tay
  -- 'auto'   = hệ thống tự tạo từ scheduled_expenses

  transaction_date     DATE      NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMP DEFAULT NOW()
);

-- UNIQUE constraint: mỗi scheduled_expense chỉ được chạy 1 lần/ngày
-- Dùng partial unique index vì scheduled_expense_id có thể NULL (giao dịch manual)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_scheduled_per_day
  ON transactions(scheduled_expense_id, transaction_date)
  WHERE scheduled_expense_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source    ON transactions(source);

-- ─────────────────────────────────────────────
-- 5. BẢNG budgets
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    REFERENCES auth.users(id)  ON DELETE CASCADE,
  category_id UUID    REFERENCES categories(id)  ON DELETE CASCADE,
  amount      DECIMAL(15,0) NOT NULL CHECK (amount > 0),
  month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),

  UNIQUE (user_id, category_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);

-- ─────────────────────────────────────────────
-- 6. BẢNG push_subscriptions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT    NOT NULL,   -- URL endpoint của trình duyệt
  p256dh     TEXT    NOT NULL,   -- Public key
  auth_key   TEXT    NOT NULL,   -- Auth secret
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);

-- ─────────────────────────────────────────────
-- 7. BẢNG ai_suggestions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_data JSONB   NOT NULL,   -- Dữ liệu đã gửi cho Gemini
  response    JSONB   NOT NULL,   -- Kết quả trả về (đã parse JSON)
  period_from DATE    NOT NULL,
  period_to   DATE    NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_user_id ON ai_suggestions(user_id, created_at DESC);

-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS) — BẮT BUỘC
-- ─────────────────────────────────────────────
ALTER TABLE user_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_expenses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions      ENABLE ROW LEVEL SECURITY;

-- Policy: Mỗi user chỉ thấy data của chính mình
CREATE POLICY "Users only see own data" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users only see own data" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users only see own data" ON scheduled_expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users only see own data" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users only see own data" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users only see own data" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users only see own data" ON ai_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 9. BẢNG cron_logs — Ghi log mỗi lần cron chạy
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_logs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_expense_id UUID        REFERENCES scheduled_expenses(id) ON DELETE SET NULL,
  status               TEXT        NOT NULL CHECK (status IN ('success', 'skipped', 'failed')),
  message              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cron_logs_expense_id ON cron_logs(scheduled_expense_id);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at DESC);

-- ─────────────────────────────────────────────
-- 10. RPC FUNCTION: process_scheduled_expense
-- Atomic: INSERT transaction + UPDATE last_run_date + ghi cron_logs
-- Trả về TRUE nếu insert thành công, FALSE nếu skipped/failed
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_scheduled_expense(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expense        scheduled_expenses%ROWTYPE;
  v_rows_inserted  INT;
  v_today          DATE := CURRENT_DATE;
BEGIN
  -- Lấy thông tin scheduled_expense
  SELECT * INTO v_expense
  FROM scheduled_expenses
  WHERE id = p_id;

  IF NOT FOUND THEN
    INSERT INTO cron_logs (scheduled_expense_id, status, message)
    VALUES (p_id, 'failed', 'Scheduled expense not found');
    RETURN FALSE;
  END IF;

  -- Thử INSERT transaction (ON CONFLICT DO NOTHING để tránh duplicate)
  INSERT INTO transactions (
    user_id,
    category_id,
    scheduled_expense_id,
    type,
    amount,
    note,
    source,
    transaction_date
  ) VALUES (
    v_expense.user_id,
    v_expense.category_id,
    v_expense.id,
    'expense',
    v_expense.amount,
    v_expense.note,
    'auto',
    v_today
  )
  ON CONFLICT (scheduled_expense_id, transaction_date)
    WHERE scheduled_expense_id IS NOT NULL
  DO NOTHING;

  GET DIAGNOSTICS v_rows_inserted = ROW_COUNT;

  IF v_rows_inserted = 1 THEN
    -- Thành công: cập nhật last_run_date + log success
    UPDATE scheduled_expenses
    SET last_run_date = v_today,
        updated_at    = NOW()
    WHERE id = p_id;

    INSERT INTO cron_logs (scheduled_expense_id, status, message)
    VALUES (p_id, 'success', 'Transaction inserted successfully');

    RETURN TRUE;

  ELSE
    -- Conflict (đã chạy hôm nay): log skipped
    INSERT INTO cron_logs (scheduled_expense_id, status, message)
    VALUES (p_id, 'skipped', 'Transaction already exists for today');

    RETURN FALSE;
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Lỗi DB bất kỳ: log failed + lưu error message
  INSERT INTO cron_logs (scheduled_expense_id, status, message)
  VALUES (p_id, 'failed', SQLERRM);

  RETURN FALSE;
END;
$$;
