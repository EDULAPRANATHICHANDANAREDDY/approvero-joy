import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";

interface Approval {
  id: string;
  type: string;
  requester: string;
  description: string;
  urgency: "high" | "medium" | "low";
  timeAgo: string;
}

const approvals: Approval[] = [
  {
    id: "APR-001",
    type: "Leave Request",
    requester: "Sarah Johnson",
    description: "Annual leave: Jan 15 - Jan 22, 2026",
    urgency: "high",
    timeAgo: "2 hours ago",
  },
  {
    id: "APR-002",
    type: "Expense Claim",
    requester: "Michael Chen",
    description: "Client dinner - $450.00",
    urgency: "medium",
    timeAgo: "5 hours ago",
  },
  {
    id: "APR-003",
    type: "Asset Request",
    requester: "Emily Davis",
    description: "MacBook Pro 16\" for design work",
    urgency: "low",
    timeAgo: "1 day ago",
  },
];

const urgencyColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

const PendingApprovals = () => {
  return (
    <div className="bg-card rounded-xl border border-border shadow-soft animate-slide-up">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h3 className="font-display font-semibold text-lg text-foreground">Pending Approvals</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Items awaiting your action</p>
      </div>
      
      <div className="divide-y divide-border">
        {approvals.map((approval) => (
          <div key={approval.id} className="p-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {approval.requester.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">{approval.requester}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyColors[approval.urgency]}`}>
                    {approval.urgency}
                  </span>
                </div>
                <p className="text-sm text-foreground">{approval.type}</p>
                <p className="text-sm text-muted-foreground truncate">{approval.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{approval.timeAgo}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="success" size="sm" className="gap-1.5">
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-3 border-t border-border">
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
          View all pending approvals
        </Button>
      </div>
    </div>
  );
};

export default PendingApprovals;
