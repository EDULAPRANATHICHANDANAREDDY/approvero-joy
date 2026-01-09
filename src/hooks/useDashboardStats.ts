import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  pending: number;
  approvedThisWeek: number;
  rejected: number;
  total: number;
  pendingByCategory: { leave: number; expense: number; asset: number };
  approvalTrend: number[];
  topRejectionReason: string;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    approvedThisWeek: 0,
    rejected: 0,
    total: 0,
    pendingByCategory: { leave: 0, expense: 0, asset: 0 },
    approvalTrend: [0, 0, 0, 0, 0, 0, 0],
    topRejectionReason: "No rejections"
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [leaveRes, expenseRes, assetRes] = await Promise.all([
      supabase.from("leave_requests").select("status, created_at"),
      supabase.from("expense_claims").select("status, created_at"),
      supabase.from("asset_requests").select("status, created_at")
    ]);

    const allRequests = [
      ...(leaveRes.data || []).map(r => ({ ...r, type: "leave" })),
      ...(expenseRes.data || []).map(r => ({ ...r, type: "expense" })),
      ...(assetRes.data || []).map(r => ({ ...r, type: "asset" }))
    ];

    const pending = allRequests.filter(r => r.status === "pending").length;
    const approvedThisWeek = allRequests.filter(r => 
      r.status === "approved" && new Date(r.created_at) >= weekAgo
    ).length;
    const rejected = allRequests.filter(r => r.status === "rejected").length;

    const pendingByCategory = {
      leave: (leaveRes.data || []).filter(r => r.status === "pending").length,
      expense: (expenseRes.data || []).filter(r => r.status === "pending").length,
      asset: (assetRes.data || []).filter(r => r.status === "pending").length
    };

    // Calculate 7-day approval trend
    const approvalTrend = Array(7).fill(0);
    allRequests.filter(r => r.status === "approved").forEach(r => {
      const daysDiff = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        approvalTrend[6 - daysDiff]++;
      }
    });

    setStats({
      pending,
      approvedThisWeek,
      rejected,
      total: allRequests.length,
      pendingByCategory,
      approvalTrend,
      topRejectionReason: rejected > 0 ? "Policy violation" : "No rejections"
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    const channels = [
      supabase.channel("stats_leave").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, fetchStats),
      supabase.channel("stats_expense").on("postgres_changes", { event: "*", schema: "public", table: "expense_claims" }, fetchStats),
      supabase.channel("stats_asset").on("postgres_changes", { event: "*", schema: "public", table: "asset_requests" }, fetchStats)
    ];

    channels.forEach(c => c.subscribe());

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  return { stats, loading, refetch: fetchStats };
}
