import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  request_type: string;
  request_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useActivityLog(limit = 10) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      setActivities(data as ActivityLogEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();

    const channel = supabase
      .channel("activity_log_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, fetchActivities)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { activities, loading, refetch: fetchActivities };
}
