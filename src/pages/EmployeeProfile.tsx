import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface EmployeeData {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  position: string | null;
  is_active: boolean;
}

interface LeaveBalance {
  leave_type: string;
  total_days: number;
  used_days: number;
  monthly_used_days: number;
  yearly_used_days: number;
}

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [expenseClaims, setExpenseClaims] = useState<any[]>([]);
  const [assetRequests, setAssetRequests] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if manager or viewing own profile
      const isManagerUser = user.email === "edulapranathi@gmail.com";
      setIsManager(isManagerUser);

      if (!id) {
        navigate("/dashboard");
        return;
      }

      await fetchEmployeeData(id, isManagerUser, user.id);
    };

    checkAccessAndFetch();
  }, [id, navigate]);

  const fetchEmployeeData = async (employeeId: string, isManagerUser: boolean, currentUserId: string) => {
    try {
      // Fetch employee info
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (!empData) {
        navigate("/dashboard");
        return;
      }

      // Check access - managers can view anyone, users can only view themselves
      if (!isManagerUser && empData.user_id !== currentUserId) {
        navigate("/dashboard");
        return;
      }

      setEmployee(empData);

      if (empData.user_id) {
        // Fetch leave requests
        const { data: leaves } = await supabase
          .from("leave_requests")
          .select("*")
          .eq("user_id", empData.user_id)
          .order("created_at", { ascending: false });
        setLeaveRequests(leaves || []);

        // Fetch expense claims
        const { data: expenses } = await supabase
          .from("expense_claims")
          .select("*")
          .eq("user_id", empData.user_id)
          .order("created_at", { ascending: false });
        setExpenseClaims(expenses || []);

        // Fetch asset requests
        const { data: assets } = await supabase
          .from("asset_requests")
          .select("*")
          .eq("user_id", empData.user_id)
          .order("created_at", { ascending: false });
        setAssetRequests(assets || []);

        // Fetch leave balances
        const { data: balances } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("user_id", empData.user_id);
        setLeaveBalances(balances || []);
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
      approved: { className: "bg-success/10 text-success", icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { className: "bg-destructive/10 text-destructive", icon: <XCircle className="h-3 w-3" /> },
      pending: { className: "bg-warning/10 text-warning", icon: <Clock className="h-3 w-3" /> }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.className} gap-1`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate leave summary
  const paidLeaves = leaveRequests.filter(r => 
    r.status === "approved" && r.leave_type !== "Personal"
  ).reduce((sum, r) => sum + r.days, 0);

  const unpaidLeaves = leaveRequests.filter(r => 
    r.status === "approved" && r.leave_type === "Personal"
  ).reduce((sum, r) => sum + r.days, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            {/* Employee Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {employee.full_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-display font-bold">{employee.full_name}</h1>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{employee.email}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span><strong>Department:</strong> {employee.department || "N/A"}</span>
                      <span><strong>Position:</strong> {employee.position || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Leave Requests</p>
                  <p className="text-2xl font-bold">{leaveRequests.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Paid Leave Taken</p>
                  <p className="text-2xl font-bold text-success">{paidLeaves} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Unpaid Leave Taken</p>
                  <p className="text-2xl font-bold text-destructive">{unpaidLeaves} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    ${expenseClaims.filter(c => c.status === "approved").reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="leaves" className="space-y-4">
              <TabsList>
                <TabsTrigger value="leaves" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Leave History
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="assets" className="gap-2">
                  <Package className="h-4 w-4" />
                  Assets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leaves">
                <Card>
                  <CardHeader>
                    <CardTitle>Leave History Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaveRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No leave requests</p>
                    ) : (
                      <div className="space-y-4">
                        {leaveRequests.map((leave) => (
                          <div key={leave.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{leave.leave_type}</span>
                                {getStatusBadge(leave.status)}
                                {leave.leave_type === "Personal" && (
                                  <Badge variant="outline" className="text-destructive border-destructive">
                                    Unpaid
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(leave.start_date), "MMM d, yyyy")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                                <span className="mx-2">•</span>
                                {leave.days} day(s)
                              </p>
                              {leave.reason && (
                                <p className="text-sm mt-1">{leave.reason}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(leave.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Claims History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenseClaims.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No expense claims</p>
                    ) : (
                      <div className="space-y-4">
                        {expenseClaims.map((expense) => (
                          <div key={expense.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{expense.title}</span>
                                {getStatusBadge(expense.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {expense.category}
                                <span className="mx-2">•</span>
                                ${expense.amount.toFixed(2)}
                              </p>
                              {expense.description && (
                                <p className="text-sm mt-1">{expense.description}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(expense.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assets">
                <Card>
                  <CardHeader>
                    <CardTitle>Asset Requests History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assetRequests.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No asset requests</p>
                    ) : (
                      <div className="space-y-4">
                        {assetRequests.map((asset) => (
                          <div key={asset.id} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{asset.title}</span>
                                {getStatusBadge(asset.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {asset.category}
                                <span className="mx-2">•</span>
                                {asset.asset_type}
                                {asset.estimated_cost && (
                                  <>
                                    <span className="mx-2">•</span>
                                    ${asset.estimated_cost.toFixed(2)}
                                  </>
                                )}
                              </p>
                              {asset.reason && (
                                <p className="text-sm mt-1">{asset.reason}</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(asset.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeProfile;
