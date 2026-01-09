import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Eye, Check, X } from "lucide-react";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useLeaveBalances } from "@/hooks/useLeaveBalances";
import { useAuth } from "@/hooks/useAuth";
import { NewRequestModal } from "@/components/modals/NewRequestModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

const LeaveRequests = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { requests, loading, updateRequest } = useLeaveRequests();
  const { balances } = useLeaveBalances();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const selected = requests.find(r => r.id === selectedRequest);

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
            <Button className="gap-2" onClick={() => setShowNewRequest(true)}>
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </header>
          <main className="flex-1 p-6">
            {/* Leave Balances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {balances.map((balance) => (
                <Card key={balance.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{balance.leave_type}</p>
                      <p className="text-2xl font-bold">{balance.total_days - balance.used_days}</p>
                      <p className="text-xs text-muted-foreground">of {balance.total_days} days remaining</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Requests List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No leave requests yet</div>
              ) : (
                requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-100">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{request.leave_type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {request.start_date} - {request.end_date} ({request.days} days)
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(request.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
      <NewRequestModal open={showNewRequest} onOpenChange={setShowNewRequest} />
      
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>Review the complete request information</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium">{selected.leave_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><Badge className={getStatusColor(selected.status)}>{selected.status}</Badge></div>
                <div><p className="text-sm text-muted-foreground">Start Date</p><p className="font-medium">{selected.start_date}</p></div>
                <div><p className="text-sm text-muted-foreground">End Date</p><p className="font-medium">{selected.end_date}</p></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Reason</p><p>{selected.reason || "No reason provided"}</p></div>
              {selected.manager_comment && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Manager Comment</p>
                  <p>{selected.manager_comment}</p>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button variant="destructive" className="flex-1" onClick={() => { updateRequest(selected.id, { status: "rejected", manager_comment: "Rejected" }); setSelectedRequest(null); }}>
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="flex-1" onClick={() => { updateRequest(selected.id, { status: "approved" }); setSelectedRequest(null); }}>
                    <Check className="h-4 w-4 mr-2" /> Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default LeaveRequests;
