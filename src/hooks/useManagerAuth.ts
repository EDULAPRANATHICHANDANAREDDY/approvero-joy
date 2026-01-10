import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const MANAGER_EMAIL = "edulapranathi@gmail.com";

export function useManagerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsManager(currentUser?.email === MANAGER_EMAIL);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsManager(currentUser?.email === MANAGER_EMAIL);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isManager };
}
