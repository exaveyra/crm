-- ============================================
-- USER PROFILES
-- Mirrors auth.users with CRM-specific fields.
-- Auto-populated via trigger on new user creation.
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT CHECK (role IN ('admin', 'sales_manager', 'sales_rep')) DEFAULT 'sales_rep',
  title       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- TRIGGER: auto-insert profile on new auth user
-- Runs when Supabase Auth creates any new user
-- (sign up, invite, OAuth, magic link, etc.)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep'),
    COALESCE(NEW.raw_user_meta_data->>'title', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for assignee picker, team page)
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role (admin API) can do everything
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (auth.role() = 'service_role');
