-- 1) Create roles enum and table (idempotent)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Minimal RLS (not used directly by frontend; access via SECURITY DEFINER funcs)
DROP POLICY IF EXISTS "user_roles noop" ON public.user_roles;
CREATE POLICY "user_roles noop" ON public.user_roles FOR SELECT USING (true);

-- 2) Helper function to check roles (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

-- 3) Update is_super_admin() to use user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- 4) Recreate profiles policies using the non-recursive helper
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_super_admin());

CREATE POLICY "Super admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_super_admin());

-- 5) Seed roles from existing profiles and ensure Sam is super_admin in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'super_admin'::public.app_role
FROM public.profiles p
WHERE p.role::text = 'super_admin'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'sam@datatube.app'
ON CONFLICT (user_id, role) DO NOTHING;