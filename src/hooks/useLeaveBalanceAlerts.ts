import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOW_BALANCE_THRESHOLD = 3; // Alert when less than 3 days remaining

export function useLeaveBalanceAlerts() {
  useEffect(() => {
    const checkLeaveBalances = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get leave balances
      const { data: balances } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", user.id);

      if (!balances || balances.length === 0) return;

      const today = new Date().toISOString().split("T")[0];

      for (const balance of balances) {
        const remaining = balance.total_days - balance.used_days;
        
        if (remaining <= LOW_BALANCE_THRESHOLD && remaining >= 0) {
          // Check if alert was already sent today
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("type", "leave_balance_warning")
            .ilike("title", `%${balance.leave_type}%`)
            .gte("created_at", today)
            .maybeSingle();

          if (!existing) {
            const emoji = remaining === 0 ? "🚨" : "⚠️";
            const urgency = remaining === 0 ? "exhausted" : "running low";
            
            await supabase.from("notifications").insert({
              user_id: user.id,
              title: `${emoji} ${balance.leave_type} Balance Alert`,
              message: remaining === 0 
                ? `Your ${balance.leave_type} leave balance is exhausted. You have 0 days remaining.`
                : `Your ${balance.leave_type} leave balance is ${urgency}. Only ${remaining} day${remaining === 1 ? '' : 's'} remaining out of ${balance.total_days} days.`,
              type: "leave_balance_warning",
            });
          }
        }
      }
    };

    checkLeaveBalances();
  }, []);
}
