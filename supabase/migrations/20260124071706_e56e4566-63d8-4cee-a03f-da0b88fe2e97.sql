-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create user_roles table for proper role storage
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for viewing roles (users can see their own roles, managers/admins can see all)
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Policy for managing roles (only admins can insert/update/delete)
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to check if user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('manager', 'admin')
    )
$$;

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new secure policy for profiles
CREATE POLICY "Users can view own profile or managers view all" ON public.profiles
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

-- Drop existing problematic policies on leave_requests
DROP POLICY IF EXISTS "Users can view all leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update leave requests" ON public.leave_requests;

-- Create new secure policies for leave_requests
CREATE POLICY "Users can view own requests or managers view all" ON public.leave_requests
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

CREATE POLICY "Users can update own pending requests" ON public.leave_requests
FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending')
    OR public.is_manager_or_admin(auth.uid())
);

-- Migrate existing managers from profiles.role to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'manager'::app_role
FROM public.profiles
WHERE role = 'manager'
ON CONFLICT (user_id, role) DO NOTHING;