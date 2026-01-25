-- Fix infinite recursion in user_roles RLS policy
-- The current "Admins can manage roles" policy directly queries user_roles, causing recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create new policies that use SECURITY DEFINER function to avoid recursion
-- For SELECT: users can view their own roles, admins can view all
CREATE POLICY "Users can view own roles or admins view all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- For INSERT: only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For UPDATE: only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- For DELETE: only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Drop the old "Users can view own roles" policy if it exists to avoid duplicate
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;