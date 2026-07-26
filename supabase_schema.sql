-- OpsPortal Complete Supabase Database Schema

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (Maps to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Production Registry Table (Live Branch Details)
CREATE TABLE IF NOT EXISTS public.production_registry (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  region TEXT NOT NULL,
  project TEXT NOT NULL,
  version TEXT NOT NULL,
  updated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Delivery Tracker Table
CREATE TABLE IF NOT EXISTS public.delivery_tracker (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  jira_id TEXT NOT NULL,
  task_name TEXT DEFAULT '',
  resource TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'UAT', 'Ready for Live', 'Completed', 'On Hold')),
  live_updates JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Leave Tracker Table
CREATE TABLE IF NOT EXISTS public.leave_tracker (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  resource TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Planned', 'Emergency')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Daily Status Table
CREATE TABLE IF NOT EXISTS public.daily_status (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  date DATE NOT NULL,
  resource TEXT NOT NULL,
  focus TEXT NOT NULL,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Team Members Directory Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies (Allow Public / Authenticated Access)
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read production_registry" ON public.production_registry FOR SELECT USING (true);
CREATE POLICY "Allow public insert production_registry" ON public.production_registry FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update production_registry" ON public.production_registry FOR UPDATE USING (true);
CREATE POLICY "Allow public delete production_registry" ON public.production_registry FOR DELETE USING (true);

CREATE POLICY "Allow public read delivery_tracker" ON public.delivery_tracker FOR SELECT USING (true);
CREATE POLICY "Allow public insert delivery_tracker" ON public.delivery_tracker FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update delivery_tracker" ON public.delivery_tracker FOR UPDATE USING (true);
CREATE POLICY "Allow public delete delivery_tracker" ON public.delivery_tracker FOR DELETE USING (true);

CREATE POLICY "Allow public read leave_tracker" ON public.leave_tracker FOR SELECT USING (true);
CREATE POLICY "Allow public insert leave_tracker" ON public.leave_tracker FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update leave_tracker" ON public.leave_tracker FOR UPDATE USING (true);
CREATE POLICY "Allow public delete leave_tracker" ON public.leave_tracker FOR DELETE USING (true);

CREATE POLICY "Allow public read daily_status" ON public.daily_status FOR SELECT USING (true);
CREATE POLICY "Allow public insert daily_status" ON public.daily_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update daily_status" ON public.daily_status FOR UPDATE USING (true);
CREATE POLICY "Allow public delete daily_status" ON public.daily_status FOR DELETE USING (true);

CREATE POLICY "Allow public read team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_members" ON public.team_members FOR INSERT WITH CHECK (true);

-- 10. Seed Initial Team Members Directory (Clean, Zero Dummy Data for Registries)
INSERT INTO public.team_members (name) VALUES
  ('Sameer'),
  ('Thomas'),
  ('Nilha'),
  ('Sreeyuktha'),
  ('Sidharth'),
  ('Shehana Sherin')
ON CONFLICT (name) DO NOTHING;
