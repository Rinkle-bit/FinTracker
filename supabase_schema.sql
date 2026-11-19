-- ============================================================
-- FinTrack Supabase Schema
-- Run this in the Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for speedy monthly and user queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- 3. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL CHECK (limit_amount >= 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_category_month UNIQUE (user_id, category, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);

-- 4. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target NUMERIC(12, 2) NOT NULL CHECK (target > 0),
  saved NUMERIC(12, 2) DEFAULT 0 CHECK (saved >= 0),
  deadline TEXT DEFAULT '',
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

-- 5. Recurring Transactions Table
CREATE TABLE IF NOT EXISTS public.recurring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
  category TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Monthly',
  next_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring(user_id);

-- 6. Anti-Impulse Chamber Table
CREATE TABLE IF NOT EXISTS public.impulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  category TEXT NOT NULL,
  note TEXT DEFAULT '',
  cooling_hours INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impulses_user ON public.impulses(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impulses ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- For anon/authenticated direct access policies (if using Supabase Auth or direct API):
CREATE POLICY "Allow service role full access" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service role full access tx" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow service role full access bg" ON public.budgets FOR ALL USING (true);
CREATE POLICY "Allow service role full access gl" ON public.goals FOR ALL USING (true);
CREATE POLICY "Allow service role full access rc" ON public.recurring FOR ALL USING (true);
CREATE POLICY "Allow service role full access imp" ON public.impulses FOR ALL USING (true);

