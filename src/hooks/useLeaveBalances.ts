import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  monthly_used_days: number;
  yearly_used_days: number;
  monthly_limit: number;
  yearly_limit: number;
  last_month_reset: string | null;
  last_year_reset: string | null;
}

const MONTHLY_LIMIT = 5;
const YEARLY_LIMIT = 60;

// Default leave balances per month for each type
const DEFAULT_BALANCES = [
  { leave_type: "Annual Leave", total_days: 20, used_days: 0, monthly_used_days: 0, yearly_used_days: 0, monthly_limit: MONTHLY_LIMIT, yearly_limit: YEARLY_LIMIT },
  { leave_type: "Sick Leave", total_days: 10, used_days: 0, monthly_used_days: 0, yearly_used_days: 0, monthly_limit: MONTHLY_LIMIT, yearly_limit: YEARLY_LIMIT },
  { leave_type: "Personal Leave", total_days: 5, used_days: 0, monthly_used_days: 0, yearly_used_days: 0, monthly_limit: MONTHLY_LIMIT, yearly_limit: YEARLY_LIMIT },
];

export function useLeaveBalances() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [yearlyUsed, setYearlyUsed] = useState(0);

  const checkAndResetBalances = async (userId: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const { data: existing } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("user_id", userId);

    if (existing && existing.length > 0) {
      // Check if we need to reset monthly balances
      for (const balance of existing) {
        const lastReset = balance.last_month_reset ? new Date(balance.last_month_reset) : null;
        const needsMonthlyReset = !lastReset || 
          lastReset.getMonth() !== currentMonth || 
          lastReset.getFullYear() !== currentYear;

        const lastYearReset = balance.last_year_reset ? new Date(balance.last_year_reset) : null;
        const needsYearlyReset = !lastYearReset || 
          lastYearReset.getFullYear() !== currentYear;

        if (needsMonthlyReset || needsYearlyReset) {
          const updates: Record<string, unknown> = {};
          if (needsMonthlyReset) {
            updates.monthly_used_days = 0;
            updates.last_month_reset = now.toISOString();
          }
          if (needsYearlyReset) {
            updates.yearly_used_days = 0;
            updates.last_year_reset = now.toISOString();
          }

          await supabase
            .from("leave_balances")
            .update(updates)
            .eq("id", balance.id);
        }
      }
    }
  };

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
        monthly_used_days: b.monthly_used_days,
        yearly_used_days: b.yearly_used_days,
        monthly_limit: b.monthly_limit,
        yearly_limit: b.yearly_limit,
        last_month_reset: new Date().toISOString(),
        last_year_reset: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("leave_balances")
        .insert(insertData);

      if (error) {
        console.error("Error initializing leave balances:", error);
        return;
      }
    } else {
      // Check and reset if needed
      await checkAndResetBalances(userId);
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
      // Calculate type-safe balances with defaults for new columns
      const typedBalances: LeaveBalance[] = data.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        user_id: b.user_id as string,
        leave_type: b.leave_type as string,
        total_days: (b.total_days as number) || 0,
        used_days: (b.used_days as number) || 0,
        monthly_used_days: (b.monthly_used_days as number) || 0,
        yearly_used_days: (b.yearly_used_days as number) || 0,
        monthly_limit: (b.monthly_limit as number) || MONTHLY_LIMIT,
        yearly_limit: (b.yearly_limit as number) || YEARLY_LIMIT,
        last_month_reset: b.last_month_reset as string | null,
        last_year_reset: b.last_year_reset as string | null,
      }));

      setBalances(typedBalances);

      // Calculate total monthly and yearly used across all leave types
      const totalMonthlyUsed = typedBalances.reduce((sum, b) => sum + b.monthly_used_days, 0);
      const totalYearlyUsed = typedBalances.reduce((sum, b) => sum + b.yearly_used_days, 0);
      setMonthlyUsed(totalMonthlyUsed);
      setYearlyUsed(totalYearlyUsed);
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

  const getMonthlyRemaining = () => {
    return MONTHLY_LIMIT - monthlyUsed;
  };

  const getYearlyRemaining = () => {
    return YEARLY_LIMIT - yearlyUsed;
  };

  const canRequestLeave = (days: number) => {
    const monthlyRemaining = getMonthlyRemaining();
    const yearlyRemaining = getYearlyRemaining();
    return days <= monthlyRemaining && days <= yearlyRemaining;
  };

  const hasEnoughBalance = (leaveType: string, days: number) => {
    const typeBalance = getBalance(leaveType) >= days;
    const monthlyOk = days <= getMonthlyRemaining();
    const yearlyOk = days <= getYearlyRemaining();
    return typeBalance && monthlyOk && yearlyOk;
  };

  const updateUsedDays = async (leaveType: string, daysUsed: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const balance = balances.find(b => b.leave_type === leaveType);
    if (!balance) return;

    const newUsedDays = balance.used_days + daysUsed;
    const newMonthlyUsedDays = balance.monthly_used_days + daysUsed;
    const newYearlyUsedDays = balance.yearly_used_days + daysUsed;
    
    const { error } = await supabase
      .from("leave_balances")
      .update({ 
        used_days: newUsedDays,
        monthly_used_days: newMonthlyUsedDays,
        yearly_used_days: newYearlyUsedDays,
      })
      .eq("id", balance.id);

    if (!error) {
      await fetchBalances();
    }
  };

  const isPersonalLeave = (leaveType: string) => leaveType === "Personal Leave";

  return { 
    balances, 
    loading, 
    getBalance, 
    hasEnoughBalance, 
    updateUsedDays, 
    refetch: fetchBalances,
    monthlyUsed,
    yearlyUsed,
    monthlyLimit: MONTHLY_LIMIT,
    yearlyLimit: YEARLY_LIMIT,
    getMonthlyRemaining,
    getYearlyRemaining,
    canRequestLeave,
    isPersonalLeave,
  };
}
