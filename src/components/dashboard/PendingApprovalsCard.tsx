import { FileText, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Approval {
  id: string;
  title: string;
  type: string;
  requestId: string;
  description: string;
  requester: string;
  requesterInitials: string;
  timeAgo: string;
  status: "pending" | "approved" | "rejected";
}

const initialApprovals: Approval[] = [
  {
    id: "1",
    title: "Annual Leave - Dec 20-24",
    type: "Leave Request",
    requestId: "#REQ-001",
    description: "Requesting 5 days of annual leave for holiday travel to visit family.",
    requester: "Sarah Chen",
    requesterInitials: "SC",
    timeAgo: "2 hours ago",
    status: "pending",
  },
  {
    id: "2",
    title: "Office Supplies Purchase",
    type: "Expense Claim",
    requestId: "#REQ-002",
    description: "Purchase of office supplies including notebooks and pens for the team.",
    requester: "Mike Johnson",
    requesterInitials: "MJ",
    timeAgo: "5 hours ago",
    status: "pending",
  },
  {
    id: "3",
    title: "New Laptop Request",
    type: "Asset Request",
    requestId: "#REQ-003",
    description: "Request for a new MacBook Pro for development work.",
    requester: "Emily Davis",
    requesterInitials: "ED",
    timeAgo: "1 day ago",
    status: "pending",
  },
];

export function PendingApprovalsCard() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);

  const handleApprove = (id: string) => {
    setApprovals(approvals.map(a => 
      a.id === id ? { ...a, status: "approved" as const } : a
    ));
    toast({
      title: "Request Approved",
      description: "The request has been approved successfully.",
    });
  };

  const handleReject = (id: string) => {
    setApprovals(approvals.map(a => 
      a.id === id ? { ...a, status: "rejected" as const } : a
    ));
    toast({
      title: "Request Rejected",
      description: "The request has been rejected.",
      variant: "destructive",
    });
  };

  const pendingApprovals = approvals.filter(a => a.status === "pending");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-display">Pending Approvals</CardTitle>
          <CardDescription>Review and process requests</CardDescription>
        </div>
        <Button variant="link" className="text-primary">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending approvals
          </div>
        ) : (
          pendingApprovals.map((approval) => (
            <div
              key={approval.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-foreground">{approval.title}</h4>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {approval.type} • {approval.requestId}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {approval.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-muted">
                          {approval.requesterInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {approval.requester} • {approval.timeAgo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(approval.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleApprove(approval.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
