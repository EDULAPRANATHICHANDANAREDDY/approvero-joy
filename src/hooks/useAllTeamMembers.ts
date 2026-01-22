import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TeamMember {
  user_id: string;
  email: string;
  full_name: string;
  department: string | null;
  position: string | null;
  role: string | null;
  is_on_leave: boolean;
  leave_type: string | null;
  payment_status: "paid" | "half-paid" | "unpaid" | null;
  status: "working" | "on_leave" | "inactive";
  last_activity_at: string | null;
  is_logged_in_today: boolean;
}

export interface TeamStats {
  total_members: number;
  working_today: number;
  on_leave_today: number;
  inactive_today: number;
}

export function useAllTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    total_members: 0,
    working_today: 0,
    on_leave_today: 0,
    inactive_today: 0,
  });
  const [loading, setLoading] = useState(true);

  const getPaymentStatus = (leaveType: string): "paid" | "half-paid" | "unpaid" => {
    if (leaveType === "Personal Leave") {
      return "unpaid";
    }
    return "half-paid";
  };

  const fetchAllMembers = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch ALL profiles (registered users)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    if (!profiles || profiles.length === 0) {
      setMembers([]);
      setStats({ total_members: 0, working_today: 0, on_leave_today: 0, inactive_today: 0 });
      setLoading(false);
      return;
    }

    // Fetch today's sessions
    const { data: sessions } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("session_date", today)
      .eq("is_active", true);

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
    const sessionMap = new Map(sessions?.map(s => [s.user_id, s]) || []);
    const employeeMap = new Map(employees?.map(e => [e.email?.toLowerCase(), e]) || []);
    const leaveMap = new Map(leaveRequests?.map(l => [l.user_id, l.leave_type]) || []);

    // Build team members list from ALL profiles
    const teamMembers: TeamMember[] = profiles.map(profile => {
      const session = sessionMap.get(profile.user_id);
      const employee = profile.email ? employeeMap.get(profile.email.toLowerCase()) : null;
      const leaveType = leaveMap.get(profile.user_id);
      const isOnLeave = !!leaveType;
      const isLoggedInToday = !!session;
      const paymentStatus = leaveType ? getPaymentStatus(leaveType) : null;

      // Determine status
      let status: "working" | "on_leave" | "inactive";
      if (isOnLeave) {
        status = "on_leave";
      } else if (isLoggedInToday) {
        status = "working";
      } else {
        status = "inactive";
      }

      return {
        user_id: profile.user_id,
        email: profile.email || "",
        full_name: profile.full_name || profile.email?.split("@")[0] || "Unknown",
        department: employee?.department || profile.department || null,
        position: employee?.position || null,
        role: profile.role || "employee",
        is_on_leave: isOnLeave,
        leave_type: leaveType || null,
        payment_status: paymentStatus,
        status,
        last_activity_at: session?.last_activity_at || null,
        is_logged_in_today: isLoggedInToday,
      };
    });

    // Calculate stats
    const workingCount = teamMembers.filter(m => m.status === "working").length;
    const onLeaveCount = teamMembers.filter(m => m.status === "on_leave").length;
    const inactiveCount = teamMembers.filter(m => m.status === "inactive").length;

    setMembers(teamMembers);
    setStats({
      total_members: teamMembers.length,
      working_today: workingCount,
      on_leave_today: onLeaveCount,
      inactive_today: inactiveCount,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAllMembers();

    // Subscribe to changes
    const channel = supabase
      .channel("all_team_members")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchAllMembers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_sessions" }, () => {
        fetchAllMembers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchAllMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { members, stats, loading, refetch: fetchAllMembers };
}
