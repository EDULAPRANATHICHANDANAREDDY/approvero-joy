-- Fix user_sessions SELECT policy (expose emails to all users)
DROP POLICY IF EXISTS "Users can view sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions or managers view all" ON public.user_sessions
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

-- Add DELETE policy for user_sessions
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Fix employees SELECT policy (publicly readable)
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;

CREATE POLICY "Authenticated users can view employees" ON public.employees
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix activity_log SELECT policy (publicly readable)
DROP POLICY IF EXISTS "Users can view all activity logs" ON public.activity_log;

CREATE POLICY "Users can view own logs or managers view all" ON public.activity_log
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

-- Add immutability policies for activity_log (prevent UPDATE/DELETE)
CREATE POLICY "Activity logs cannot be updated" ON public.activity_log
FOR UPDATE USING (false);

CREATE POLICY "Activity logs cannot be deleted" ON public.activity_log
FOR DELETE USING (false);

-- Fix leave_balances to allow managers to view all
DROP POLICY IF EXISTS "Users can view own leave balances" ON public.leave_balances;

CREATE POLICY "Users can view own balances or managers view all" ON public.leave_balances
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);