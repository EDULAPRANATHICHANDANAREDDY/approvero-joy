import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("full_name");

    if (!error && data) {
      setEmployees(data as Employee[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();

    const channel = supabase
      .channel("employees_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { employees, loading, refetch: fetchEmployees };
}
