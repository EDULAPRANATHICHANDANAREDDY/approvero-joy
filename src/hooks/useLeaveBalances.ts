import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
}

export function useLeaveBalances() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setBalances(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const getBalance = (leaveType: string) => {
    const balance = balances.find(b => b.leave_type === leaveType);
    return balance ? balance.total_days - balance.used_days : 0;
  };

  const hasEnoughBalance = (leaveType: string, days: number) => {
    return getBalance(leaveType) >= days;
  };

  return { balances, loading, getBalance, hasEnoughBalance, refetch: fetchBalances };
}
