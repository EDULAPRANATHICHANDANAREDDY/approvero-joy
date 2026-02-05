import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "approvex_session_checked";

export function useSessionClear() {
  useEffect(() => {
    // Check if this is a fresh browser/tab open
    const wasChecked = sessionStorage.getItem(SESSION_KEY);
    
    if (!wasChecked) {
      // First load of this browser session - clear any persisted auth
      supabase.auth.signOut().then(() => {
        sessionStorage.setItem(SESSION_KEY, "true");
      });
    }
  }, []);
}
