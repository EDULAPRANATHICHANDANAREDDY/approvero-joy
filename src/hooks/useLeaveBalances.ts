import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
}

// Default leave balances per month for each type
const DEFAULT_BALANCES = [
  { leave_type: "Annual Leave", total_days: 20, used_days: 0 },
  { leave_type: "Sick Leave", total_days: 10, used_days: 0 },
  { leave_type: "Personal Leave", total_days: 5, used_days: 0 },
];

export function useLeaveBalances() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const initializeBalances = async (userId: string) => {
    // Check if balances exist
    const { data: existing } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("user_id", userId);

    if (!existing || existing.length === 0) {
      // Initialize default balances for the user
      const insertData = DEFAULT_BALANCES.map(b => ({
        user_id: userId,
        leave_type: b.leave_type,
        total_days: b.total_days,
        used_days: b.used_days,
      }));

      const { error } = await supabase
        .from("leave_balances")
        .insert(insertData);

      if (error) {
        console.error("Error initializing leave balances:", error);
        return;
      }
    }
  };

  const fetchBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // First try to initialize balances if they don't exist
    await initializeBalances(user.id);

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

  const updateUsedDays = async (leaveType: string, daysUsed: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const balance = balances.find(b => b.leave_type === leaveType);
    if (!balance) return;

    const newUsedDays = balance.used_days + daysUsed;
    
    const { error } = await supabase
      .from("leave_balances")
      .update({ used_days: newUsedDays })
      .eq("id", balance.id);

    if (!error) {
      await fetchBalances();
    }
  };

  return { balances, loading, getBalance, hasEnoughBalance, updateUsedDays, refetch: fetchBalances };
}
