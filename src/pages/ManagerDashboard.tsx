import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeamMembersTable } from "@/components/manager/TeamMembersTable";
import { TeamStatsCards } from "@/components/manager/TeamStatsCards";
import { LeaveSummaryCards } from "@/components/manager/LeaveSummaryCards";
import { LeaveTypeBreakdown } from "@/components/manager/LeaveTypeBreakdown";
import { useAllTeamMembers } from "@/hooks/useAllTeamMembers";
import { useTeamLeaveStatus } from "@/hooks/useTeamLeaveStatus";
import { format } from "date-fns";
import { CalendarDays, Shield, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyUsed, setMonthlyUsed] = useState(0);
  const [yearlyUsed, setYearlyUsed] = useState(0);

  const { members, stats, loading: membersLoading } = useAllTeamMembers();
  const { employeeStatuses, teamStats, loading: teamLoading } = useTeamLeaveStatus();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/login");
        return;
      }

      // Check if user is manager
      if (session.user.email !== "edulapranathi@gmail.com") {
        toast({
          title: "Access Denied",
          description: "Only managers can access this dashboard",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Calculate total leaves used this month and year
  useEffect(() => {
    const fetchLeaveStats = async () => {
      const currentDate = new Date();
      const startOfMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), "yyyy-MM-dd");
      const startOfYear = format(new Date(currentDate.getFullYear(), 0, 1), "yyyy-MM-dd");
      const today = format(currentDate, "yyyy-MM-dd");

      // Monthly approved leaves
      const { data: monthlyLeaves } = await supabase
        .from("leave_requests")
        .select("days")
        .eq("status", "approved")
        .gte("start_date", startOfMonth)
        .lte("start_date", today);

      const monthlyTotal = monthlyLeaves?.reduce((sum, l) => sum + l.days, 0) || 0;
      setMonthlyUsed(monthlyTotal);

      // Yearly approved leaves
      const { data: yearlyLeaves } = await supabase
        .from("leave_requests")
        .select("days")
        .eq("status", "approved")
        .gte("start_date", startOfYear)
        .lte("start_date", today);

      const yearlyTotal = yearlyLeaves?.reduce((sum, l) => sum + l.days, 0) || 0;
      setYearlyUsed(yearlyTotal);
    };

    fetchLeaveStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter members by status
  const workingMembers = members.filter(m => m.status === "working");
  const onLeaveMembers = members.filter(m => m.status === "on_leave");
  const inactiveMembers = members.filter(m => m.status === "inactive");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    Manager Dashboard
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Team Overview</h2>
              <TeamStatsCards stats={stats} loading={membersLoading} />
            </section>

            {/* Leave Summary Cards */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Leave Summary</h2>
              <LeaveSummaryCards 
                stats={teamStats} 
                monthlyUsed={monthlyUsed}
                yearlyUsed={yearlyUsed}
                loading={teamLoading} 
              />
            </section>

            {/* Leave Type Breakdown - Paid vs Unpaid */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Leave Payment Status</h2>
              <LeaveTypeBreakdown employees={employeeStatuses} />
            </section>

            {/* Team Members Table with Filters */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">All Team Members</h2>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    All ({members.length})
                  </TabsTrigger>
                  <TabsTrigger value="working">
                    Working ({workingMembers.length})
                  </TabsTrigger>
                  <TabsTrigger value="on_leave">
                    On Leave ({onLeaveMembers.length})
                  </TabsTrigger>
                  <TabsTrigger value="inactive">
                    Inactive ({inactiveMembers.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <TeamMembersTable members={members} loading={membersLoading} filter="all" />
                </TabsContent>
                
                <TabsContent value="working">
                  <TeamMembersTable members={members} loading={membersLoading} filter="working" />
                </TabsContent>
                
                <TabsContent value="on_leave">
                  <TeamMembersTable members={members} loading={membersLoading} filter="on_leave" />
                </TabsContent>

                <TabsContent value="inactive">
                  <TeamMembersTable members={members} loading={membersLoading} filter="inactive" />
                </TabsContent>
              </Tabs>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ManagerDashboard;
