import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MANAGER_EMAIL = "edulapranathi@gmail.com";

export interface PendingCounts {
  leave: number;
  expense: number;
  asset: number;
}

export function usePendingCounts() {
  const [counts, setCounts] = useState<PendingCounts>({ leave: 0, expense: 0, asset: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const isManager = user.email === MANAGER_EMAIL;

    // Build queries - filter by user_id for non-managers
    let leaveQuery = supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    let expenseQuery = supabase.from("expense_claims").select("id", { count: "exact", head: true }).eq("status", "pending");
    let assetQuery = supabase.from("asset_requests").select("id", { count: "exact", head: true }).eq("status", "pending");

    if (!isManager) {
      leaveQuery = leaveQuery.eq("user_id", user.id);
      expenseQuery = expenseQuery.eq("user_id", user.id);
      assetQuery = assetQuery.eq("user_id", user.id);
    }

    const [leaveResult, expenseResult, assetResult] = await Promise.all([
      leaveQuery,
      expenseQuery,
      assetQuery,
    ]);

    setCounts({
      leave: leaveResult.count || 0,
      expense: expenseResult.count || 0,
      asset: assetResult.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchCounts();

    // Subscribe to real-time changes
    const leaveChannel = supabase
      .channel("pending_leave_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, fetchCounts)
      .subscribe();

    const expenseChannel = supabase
      .channel("pending_expense_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_claims" }, fetchCounts)
      .subscribe();

    const assetChannel = supabase
      .channel("pending_asset_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "asset_requests" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(expenseChannel);
      supabase.removeChannel(assetChannel);
    };
  }, []);

  return { counts, loading, refetch: fetchCounts };
}
