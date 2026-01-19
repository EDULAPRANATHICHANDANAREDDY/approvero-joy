import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface EmployeeLeaveStatus {
  employee_id: string;
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  is_on_leave: boolean;
  leave_type: string | null;
  is_paid: boolean;
  payment_status: "paid" | "half-paid" | "unpaid" | null;
  leave_start: string | null;
  leave_end: string | null;
}

export interface TeamStats {
  total_employees: number;
  working_today: number;
  on_paid_leave: number;
  on_half_paid_leave: number;
  on_unpaid_leave: number;
  on_leave_total: number;
}

export function useTeamLeaveStatus() {
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeLeaveStatus[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    total_employees: 0,
    working_today: 0,
    on_paid_leave: 0,
    on_half_paid_leave: 0,
    on_unpaid_leave: 0,
    on_leave_total: 0,
  });
  const [loading, setLoading] = useState(true);

  const getPaymentStatus = (leaveType: string): "paid" | "half-paid" | "unpaid" => {
    // Personal Leave is unpaid, others are half-paid
    if (leaveType === "Personal Leave") {
      return "unpaid";
    }
    return "half-paid";
  };

  const fetchTeamStatus = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch all active employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .order("full_name");

    if (empError) {
      console.error("Error fetching employees:", empError);
      setLoading(false);
      return;
    }

    // Fetch approved leave requests for today
    const { data: leaveRequests, error: leaveError } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today);

    if (leaveError) {
      console.error("Error fetching leave requests:", leaveError);
    }

    // Get profiles to map user_id to email
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email");

    // Create a map of email to leave request
    const emailToLeave = new Map<string, { leave_type: string; start_date: string; end_date: string }>();
    
    if (leaveRequests && profiles) {
      const userIdToEmail = new Map(profiles.map(p => [p.user_id, p.email]));
      
      leaveRequests.forEach(leave => {
        const email = userIdToEmail.get(leave.user_id);
        if (email) {
          emailToLeave.set(email, {
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
          });
        }
      });
    }

    // Build employee status list
    const statuses: EmployeeLeaveStatus[] = (employees || []).map(emp => {
      const leaveInfo = emailToLeave.get(emp.email);
      const isOnLeave = !!leaveInfo;
      const paymentStatus = leaveInfo ? getPaymentStatus(leaveInfo.leave_type) : null;

      return {
        employee_id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        is_on_leave: isOnLeave,
        leave_type: leaveInfo?.leave_type || null,
        is_paid: paymentStatus === "paid" || paymentStatus === "half-paid",
        payment_status: paymentStatus,
        leave_start: leaveInfo?.start_date || null,
        leave_end: leaveInfo?.end_date || null,
      };
    });

    // Calculate stats
    const totalEmployees = statuses.length;
    const onLeave = statuses.filter(s => s.is_on_leave);
    const onPaidLeave = onLeave.filter(s => s.payment_status === "paid").length;
    const onHalfPaidLeave = onLeave.filter(s => s.payment_status === "half-paid").length;
    const onUnpaidLeave = onLeave.filter(s => s.payment_status === "unpaid").length;

    setEmployeeStatuses(statuses);
    setTeamStats({
      total_employees: totalEmployees,
      working_today: totalEmployees - onLeave.length,
      on_paid_leave: onPaidLeave,
      on_half_paid_leave: onHalfPaidLeave,
      on_unpaid_leave: onUnpaidLeave,
      on_leave_total: onLeave.length,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchTeamStatus();

    // Subscribe to changes
    const leaveChannel = supabase
      .channel("team_leave_status")
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, () => {
        fetchTeamStatus();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        fetchTeamStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
    };
  }, []);

  return { employeeStatuses, teamStats, loading, refetch: fetchTeamStatus };
}
