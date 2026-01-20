import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useUserSession() {
  const trackSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");

    // Check if session exists for today
    const { data: existingSession } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .single();

    if (existingSession) {
      // Update last activity
      await supabase
        .from("user_sessions")
        .update({ 
          last_activity_at: new Date().toISOString(),
          is_active: true 
        })
        .eq("id", existingSession.id);
    } else {
      // Create new session for today
      await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          email: user.email || "",
          session_date: today,
          is_active: true,
        });
    }
  }, []);

  useEffect(() => {
    trackSession();

    // Update activity every 5 minutes
    const interval = setInterval(trackSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [trackSession]);

  return { trackSession };
}
