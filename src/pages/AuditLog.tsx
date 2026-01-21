import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  request_type: string;
  request_id: string;
  details: unknown;
  created_at: string;
  user_email?: string;
}

const AuditLog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const checkAccessAndFetch = async () => {
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
      await fetchAuditLogs();
    };

    checkAccessAndFetch();
  }, [navigate]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch user emails
      const userIds = [...new Set((data || []).map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const logsWithEmail = (data || []).map(log => ({
        ...log,
        user_email: profiles?.find(p => p.user_id === log.user_id)?.email || "Unknown"
      }));

      setLogs(logsWithEmail);
      setFilteredLogs(logsWithEmail);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = logs;

    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.request_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.request_type === typeFilter);
    }

    setFilteredLogs(filtered);
  }, [searchQuery, actionFilter, typeFilter, logs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "submitted":
        return <FileText className="h-4 w-4 text-primary" />;
      case "auto-approved":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const config: Record<string, string> = {
      approved: "bg-success/10 text-success",
      rejected: "bg-destructive/10 text-destructive",
      submitted: "bg-primary/10 text-primary",
      "auto-approved": "bg-accent/10 text-accent"
    };
    return (
      <Badge className={config[action] || "bg-muted text-muted-foreground"}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      leave: "bg-blue-100 text-blue-800",
      expense: "bg-green-100 text-green-800",
      asset: "bg-purple-100 text-purple-800"
    };
    return (
      <Badge variant="outline" className={config[type] || ""}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
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
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Audit Log
              </h1>
              <p className="text-muted-foreground">Complete history of all system actions</p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user, action, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="auto-approved">Auto-Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log Table */}
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of {logs.length} entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                          <th className="text-left py-3 px-4 font-medium">User</th>
                          <th className="text-left py-3 px-4 font-medium">Action</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Request ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(new Date(log.created_at), "MMM d, yyyy HH:mm")}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{log.user_email}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {getActionIcon(log.action)}
                                {getActionBadge(log.action)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getTypeBadge(log.request_type)}
                            </td>
                            <td className="py-3 px-4">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {log.request_id.substring(0, 8)}...
                              </code>
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

export default AuditLog;
