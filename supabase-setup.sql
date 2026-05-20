-- =====================================================
-- SUPABASE DATABASE SETUP
-- Nexora Application
-- =====================================================

-- Cleanup existing schema if this script has already been applied.
-- This removes old tables, policies, functions, and triggers so the setup
-- can be rerun safely.

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view approved users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

DROP POLICY IF EXISTS "Users can view own uploads" ON uploads;
DROP POLICY IF EXISTS "Admins can view all uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert their own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON uploads;
DROP POLICY IF EXISTS "Admins can delete uploads" ON uploads;

DROP POLICY IF EXISTS "Users can view their own logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_logs;

DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_email(UUID);
DROP FUNCTION IF EXISTS public.is_email_approved(TEXT);

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- 2. UPLOADS TABLE
-- =====================================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_uploads_uploaded_by ON uploads(uploaded_by);
CREATE INDEX idx_uploads_created_at ON uploads(created_at DESC);

-- =====================================================
-- 3. ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT
);

-- Create indexes for faster queries
CREATE INDEX idx_activity_logs_email ON activity_logs(user_email);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- To avoid self-referential policy evaluation (which can cause infinite
-- recursion when policies query the same table), use SECURITY DEFINER
-- helper functions that execute with the owner's privileges.

-- Helper: check if a given user id is an admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = uid AND role = 'admin');
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: get email for a given user id
CREATE OR REPLACE FUNCTION public.get_user_email(uid UUID)
RETURNS TEXT AS $$
  SELECT email FROM users WHERE id = uid;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: check if a user (by email) is approved
CREATE OR REPLACE FUNCTION public.is_email_approved(e TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE email = e AND approved = true);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view approved users" ON users
  FOR SELECT USING (approved = true);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Uploads table policies (use helpers to fetch email and approval)
CREATE POLICY "Users can view own uploads" ON uploads
  FOR SELECT USING (
    uploaded_by = public.get_user_email(auth.uid())
  );

CREATE POLICY "Authenticated users can view all uploads" ON uploads
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can view all uploads" ON uploads
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own uploads" ON uploads
  FOR INSERT WITH CHECK (
    uploaded_by = public.get_user_email(auth.uid()) AND
    public.is_email_approved(uploaded_by)
  );

CREATE POLICY "Users can delete their own uploads" ON uploads
  FOR DELETE USING (
    uploaded_by = public.get_user_email(auth.uid())
  );

CREATE POLICY "Admins can delete uploads" ON uploads
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Activity logs policies (use helper to get email)
CREATE POLICY "Users can view their own logs" ON activity_logs
  FOR SELECT USING (
    user_email = public.get_user_email(auth.uid())
  );

CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, approved)
  VALUES (new.id, new.email, 'user', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. STORAGE SETUP
-- =====================================================

-- Create private storage bucket in Supabase Storage
-- This must be created manually in the Supabase dashboard.
-- Bucket name: secure-uploads
-- Public: false (private)
--
-- In Supabase Storage: create a bucket named exactly 'secure-uploads',
-- then apply the storage policies below for authenticated access.

-- =====================================================
-- 7. STORAGE POLICIES
-- =====================================================

-- Storage access policies for the private bucket
CREATE POLICY "Users can upload to their own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'secure-uploads' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Users can read their own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'secure-uploads' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Authenticated users can read all uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'secure-uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'secure-uploads' AND
    auth.uid()::text = split_part(name, '/', 1)
  );

CREATE POLICY "Admins can view all uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'secure-uploads' AND
    public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'secure-uploads' AND
    public.is_admin(auth.uid())
  );

-- NOTE: Supabase storage policies must target authenticated users in the dashboard.
-- If you use the UI instead of SQL, select target role `authenticated` for each policy.

-- =====================================================
-- 8. SEED DATA (Optional - Replace with your admin email)
-- =====================================================

-- Uncomment and update these lines with your admin email
-- INSERT INTO users (id, email, role, approved) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'admin', true);
-- Example: seed admin user for 'alabiabdulkareem567@gmailcom' (replace id with a real UUID)
-- INSERT INTO users (id, email, role, approved)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'alabiabdulkareem567@gmailcom', 'admin', true);

-- =====================================================
-- END OF SETUP
-- =====================================================
