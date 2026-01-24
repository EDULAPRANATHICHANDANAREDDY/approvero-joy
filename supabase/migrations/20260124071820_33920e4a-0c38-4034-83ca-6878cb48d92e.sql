-- Fix notifications INSERT policy (with_check: true is too permissive)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications for themselves" ON public.notifications
FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

-- Fix employees ALL policy (too permissive)
DROP POLICY IF EXISTS "Authenticated users can manage employees" ON public.employees;

-- Managers can insert/update employees
CREATE POLICY "Managers can insert employees" ON public.employees
FOR INSERT WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can update employees" ON public.employees
FOR UPDATE USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can delete employees" ON public.employees
FOR DELETE USING (public.is_manager_or_admin(auth.uid()));