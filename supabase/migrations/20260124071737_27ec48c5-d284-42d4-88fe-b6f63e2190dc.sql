-- Fix overly permissive UPDATE policies on asset_requests
DROP POLICY IF EXISTS "Users can update asset requests" ON public.asset_requests;

CREATE POLICY "Users can update own pending or managers update all" ON public.asset_requests
FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending')
    OR public.is_manager_or_admin(auth.uid())
);

-- Fix overly permissive SELECT policy on asset_requests (make it role-based)
DROP POLICY IF EXISTS "Users can view all asset requests" ON public.asset_requests;

CREATE POLICY "Users can view own requests or managers view all" ON public.asset_requests
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);

-- Fix overly permissive UPDATE policies on expense_claims
DROP POLICY IF EXISTS "Users can update expense claims" ON public.expense_claims;

CREATE POLICY "Users can update own pending or managers update all" ON public.expense_claims
FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending')
    OR public.is_manager_or_admin(auth.uid())
);

-- Fix overly permissive SELECT policy on expense_claims (make it role-based)
DROP POLICY IF EXISTS "Users can view all expense claims" ON public.expense_claims;

CREATE POLICY "Users can view own claims or managers view all" ON public.expense_claims
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_manager_or_admin(auth.uid())
);