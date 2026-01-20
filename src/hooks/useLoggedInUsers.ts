import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface LoggedInUser {
  user_id: string;
  email: string;
  full_name: string;
  department: string | null;
  position: string | null;
  is_on_leave: boolean;
  leave_type: string | null;
  payment_status: "paid" | "half-paid" | "unpaid" | null;
  status: "working" | "on_leave" | "inactive";
  last_activity_at: string;
}

export interface LoggedInStats {
  total_logged_in: number;
  working_today: number;
  on_leave_today: number;
}

export function useLoggedInUsers() {
  const [users, setUsers] = useState<LoggedInUser[]>([]);
  const [stats, setStats] = useState<LoggedInStats>({
    total_logged_in: 0,
    working_today: 0,
    on_leave_today: 0,
  });
  const [loading, setLoading] = useState(true);

  const getPaymentStatus = (leaveType: string): "paid" | "half-paid" | "unpaid" => {
    if (leaveType === "Personal Leave") {
      return "unpaid";
    }
    return "half-paid";
  };

  const fetchLoggedInUsers = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch today's sessions
    const { data: sessions, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("session_date", today)
      .eq("is_active", true);

    if (sessionError) {
      console.error("Error fetching sessions:", sessionError);
      setLoading(false);
      return;
    }

    if (!sessions || sessions.length === 0) {
      setUsers([]);
      setStats({ total_logged_in: 0, working_today: 0, on_leave_today: 0 });
      setLoading(false);
      return;
    }

    // Get profiles for user details
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, department");

    // Get employees for position info
    const { data: employees } = await supabase
      .from("employees")
      .select("email, position, department");

    // Get today's approved leave requests
    const { data: leaveRequests } = await supabase
      .from("leave_requests")
      .select("user_id, leave_type")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    // Create maps for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const employeeMap = new Map(employees?.map(e => [e.email, e]) || []);
    const leaveMap = new Map(leaveRequests?.map(l => [l.user_id, l.leave_type]) || []);

    // Build logged in users list
    const loggedInUsers: LoggedInUser[] = sessions.map(session => {
      const profile = profileMap.get(session.user_id);
      const employee = profile?.email ? employeeMap.get(profile.email) : null;
      const leaveType = leaveMap.get(session.user_id);
      const isOnLeave = !!leaveType;
      const paymentStatus = leaveType ? getPaymentStatus(leaveType) : null;

      return {
        user_id: session.user_id,
        email: session.email,
        full_name: profile?.full_name || session.email.split("@")[0],
        department: employee?.department || profile?.department || null,
        position: employee?.position || null,
        is_on_leave: isOnLeave,
        leave_type: leaveType || null,
        payment_status: paymentStatus,
        status: isOnLeave ? "on_leave" : "working",
        last_activity_at: session.last_activity_at,
      };
    });

    // Calculate stats
    const workingCount = loggedInUsers.filter(u => !u.is_on_leave).length;
    const onLeaveCount = loggedInUsers.filter(u => u.is_on_leave).length;

    setUsers(loggedInUsers);
    setStats({
      total_logged_in: loggedInUsers.length,
      working_today: workingCount,
      on_leave_today: onLeaveCount,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchLoggedInUsers();

    // Subscribe to session changes
    const channel = supabase
      .channel("logged_in_users")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_sessions" }, () => {
        fetchLoggedInUsers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchLoggedInUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { users, stats, loading, refetch: fetchLoggedInUsers };
}
