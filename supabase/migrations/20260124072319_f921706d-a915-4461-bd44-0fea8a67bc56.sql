-- Remove self-modification policies for leave_balances
DROP POLICY IF EXISTS "Users can insert own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can update own leave balances" ON public.leave_balances;

-- Only managers/admins and system can modify leave balances
CREATE POLICY "Managers can insert leave balances" ON public.leave_balances
FOR INSERT WITH CHECK (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Managers can update leave balances" ON public.leave_balances
FOR UPDATE USING (public.is_manager_or_admin(auth.uid()));