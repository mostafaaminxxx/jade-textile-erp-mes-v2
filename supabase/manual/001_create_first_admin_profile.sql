-- Review-only manual setup template.
-- Use only for the first real admin setup after a real Supabase Auth signup.
-- Do not use fake user ids.
-- Do not commit secrets.
-- This does not create an auth user; the auth user must sign up first from /login.
--
-- Steps:
-- 1. Sign up in the app from /login.
-- 2. Copy the auth user id from ProfileStatusPanel.
-- 3. Replace REPLACE_WITH_AUTH_USER_ID below with that real auth user id.
-- 4. Run this SQL manually in the Supabase SQL Editor.

insert into public.profiles (
  id,
  full_name,
  employee_code,
  role,
  department,
  assigned_group_code,
  language_preference,
  is_active
)
values (
  'REPLACE_WITH_AUTH_USER_ID',
  'Mostafa Admin',
  'ADMIN-001',
  'ADMIN',
  'Management',
  null,
  'en',
  true
)
on conflict (id) do update
set
  role = 'ADMIN',
  is_active = true,
  full_name = excluded.full_name,
  employee_code = excluded.employee_code,
  department = excluded.department,
  language_preference = excluded.language_preference,
  updated_at = now();
