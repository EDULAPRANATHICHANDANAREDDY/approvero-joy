import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, Clock, Users, AlertTriangle } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [monthlyLeaveData, setMonthlyLeaveData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [approvalTimeData, setApprovalTimeData] = useState<any[]>([]);
  const [exceedingEmployees, setExceedingEmployees] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalLeaves: 0,
    avgApprovalTime: 0,
    exceedingCount: 0,
    approvalRate: 0
  });

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      if (user.email !== "edulapranathi@gmail.com") {
        navigate("/dashboard");
        return;
      }
      setIsManager(true);
      await fetchAnalytics();
    };

    checkAccess();
  }, [navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all leave requests
      const { data: leaveRequests } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch employees with department info
      const { data: employees } = await supabase
        .from("employees")
        .select("*");

      // Fetch leave balances
      const { data: balances } = await supabase
        .from("leave_balances")
        .select("*");

      if (leaveRequests) {
        // Monthly leave trends (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthEnd = endOfMonth(subMonths(new Date(), i));
          const monthLeaves = leaveRequests.filter(r => {
            const date = new Date(r.created_at);
            return date >= monthStart && date <= monthEnd;
          });
          monthlyData.push({
            month: format(monthStart, "MMM"),
            approved: monthLeaves.filter(r => r.status === "approved").length,
            rejected: monthLeaves.filter(r => r.status === "rejected").length,
            pending: monthLeaves.filter(r => r.status === "pending").length
          });
        }
        setMonthlyLeaveData(monthlyData);

        // Calculate approval times
        const approvedRequests = leaveRequests.filter(r => r.status === "approved" && r.approved_at);
        const approvalTimes = approvedRequests.map(r => {
          const created = new Date(r.created_at);
          const approved = new Date(r.approved_at!);
          return (approved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });
        const avgTime = approvalTimes.length > 0 
          ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length 
          : 0;

        // Summary stats
        const approvalRate = leaveRequests.length > 0
          ? (leaveRequests.filter(r => r.status === "approved").length / leaveRequests.length) * 100
          : 0;

        setSummaryStats({
          totalLeaves: leaveRequests.length,
          avgApprovalTime: Math.round(avgTime * 10) / 10,
          exceedingCount: balances?.filter(b => b.yearly_used_days > 60).length || 0,
          approvalRate: Math.round(approvalRate)
        });
      }

      // Department-wise distribution
      if (employees && leaveRequests) {
        const deptCounts: Record<string, number> = {};
        employees.forEach(emp => {
          const dept = emp.department || "Unknown";
          const empLeaves = leaveRequests.filter(r => r.user_id === emp.user_id);
          deptCounts[dept] = (deptCounts[dept] || 0) + empLeaves.length;
        });
        setDepartmentData(
          Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
        );
      }

      // Employees exceeding limits
      if (balances && employees) {
        const exceeding = balances
          .filter(b => b.monthly_used_days > 5 || b.yearly_used_days > 60)
          .map(b => {
            const emp = employees.find(e => e.user_id === b.user_id);
            return {
              name: emp?.full_name || "Unknown",
              department: emp?.department || "N/A",
              monthlyUsed: b.monthly_used_days,
              yearlyUsed: b.yearly_used_days,
              exceededBy: Math.max(b.monthly_used_days - 5, b.yearly_used_days - 60)
            };
          });
        setExceedingEmployees(exceeding);
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isManager) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-display font-bold text-foreground">Analytics & Insights</h1>
              <p className="text-muted-foreground">Data-driven insights for better decision making</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{summaryStats.totalLeaves}</p>
                      <p className="text-sm text-muted-foreground">Total Leave Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{summaryStats.avgApprovalTime}h</p>
                      <p className="text-sm text-muted-foreground">Avg Approval Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Users className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{summaryStats.approvalRate}%</p>
                      <p className="text-sm text-muted-foreground">Approval Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{summaryStats.exceedingCount}</p>
                      <p className="text-sm text-muted-foreground">Exceeding Limits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Leave Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Leave Trends</CardTitle>
                  <CardDescription>Leave requests over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyLeaveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="approved" fill="hsl(var(--success))" name="Approved" />
                      <Bar dataKey="rejected" fill="hsl(var(--destructive))" name="Rejected" />
                      <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department-wise Distribution</CardTitle>
                  <CardDescription>Leave requests by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Employees Exceeding Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Employees Exceeding Leave Limits
                </CardTitle>
                <CardDescription>Employees who have exceeded monthly or yearly leave quotas</CardDescription>
              </CardHeader>
              <CardContent>
                {exceedingEmployees.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No employees exceeding limits</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Employee</th>
                          <th className="text-left py-3 px-4 font-medium">Department</th>
                          <th className="text-left py-3 px-4 font-medium">Monthly Used</th>
                          <th className="text-left py-3 px-4 font-medium">Yearly Used</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exceedingEmployees.map((emp, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-3 px-4">{emp.name}</td>
                            <td className="py-3 px-4">{emp.department}</td>
                            <td className="py-3 px-4">
                              <span className={emp.monthlyUsed > 5 ? "text-destructive font-medium" : ""}>
                                {emp.monthlyUsed}/5
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={emp.yearlyUsed > 60 ? "text-destructive font-medium" : ""}>
                                {emp.yearlyUsed}/60
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive">
                                Exceeded by {emp.exceededBy} days
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
