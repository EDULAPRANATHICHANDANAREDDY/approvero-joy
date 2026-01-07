import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar } from "lucide-react";

const leaveRequests = [
  { id: 1, type: "Annual Leave", startDate: "Dec 20, 2024", endDate: "Dec 24, 2024", days: 5, status: "pending", reason: "Holiday travel" },
  { id: 2, type: "Sick Leave", startDate: "Dec 15, 2024", endDate: "Dec 15, 2024", days: 1, status: "approved", reason: "Medical appointment" },
  { id: 3, type: "Personal Leave", startDate: "Dec 10, 2024", endDate: "Dec 10, 2024", days: 1, status: "rejected", reason: "Personal matters" },
];

const LeaveRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login");
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-display font-semibold text-foreground">Leave Requests</h1>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </header>
          <main className="flex-1 p-6">
            <div className="grid gap-4">
              {leaveRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{request.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {request.startDate} - {request.endDate} ({request.days} days)
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LeaveRequests;
