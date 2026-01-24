import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useManagerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const checkManagerRole = async (userId: string) => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['manager', 'admin']);
      
      if (error) {
        console.error('Error checking manager role:', error);
        return false;
      }
      
      return data && data.length > 0;
    };

    const handleAuthChange = async (currentUser: User | null) => {
      setUser(currentUser);
      
      if (currentUser) {
        const hasManagerRole = await checkManagerRole(currentUser.id);
        setIsManager(hasManagerRole);
      } else {
        setIsManager(false);
      }
      
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isManager };
}
