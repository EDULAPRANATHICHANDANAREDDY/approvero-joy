import { FileText, Check, X, Eye, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useExpenseClaims } from "@/hooks/useExpenseClaims";
import { useAssetRequests } from "@/hooks/useAssetRequests";
import { formatDistanceToNow, differenceInDays } from "date-fns";

interface PendingItem {
  id: string;
  title: string;
  type: "leave" | "expense" | "asset";
  typeLabel: string;
  description: string;
  urgency: string;
  created_at: string;
  isOverdue: boolean;
}

export function PendingApprovalsCard() {
  const { toast } = useToast();
  const { requests: leaveRequests, updateRequest: updateLeave } = useLeaveRequests();
  const { claims: expenseClaims, updateClaim: updateExpense } = useExpenseClaims();
  const { requests: assetRequests, updateRequest: updateAsset } = useAssetRequests();

  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const pendingItems = useMemo(() => {
    const items: PendingItem[] = [];

    leaveRequests.filter(r => r.status === "pending").forEach(r => {
      const isOverdue = differenceInDays(new Date(r.start_date), new Date()) <= 2;
      items.push({
        id: r.id,
        title: `${r.leave_type} - ${r.start_date} to ${r.end_date}`,
        type: "leave",
        typeLabel: "Leave Request",
        description: r.reason || "No reason provided",
        urgency: r.urgency,
        created_at: r.created_at,
        isOverdue
      });
    });

    expenseClaims.filter(r => r.status === "pending").forEach(r => {
      items.push({
        id: r.id,
        title: `${r.title} - $${r.amount}`,
        type: "expense",
        typeLabel: "Expense Claim",
        description: r.description || `${r.category} expense`,
        urgency: r.urgency,
        created_at: r.created_at,
        isOverdue: false
      });
    });

    assetRequests.filter(r => r.status === "pending").forEach(r => {
      items.push({
        id: r.id,
        title: r.title,
        type: "asset",
        typeLabel: "Asset Request",
        description: r.reason,
        urgency: r.urgency,
        created_at: r.created_at,
        isOverdue: r.urgency === "high"
      });
    });

    // Sort by urgency and overdue status
    return items.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.urgency === "high" && b.urgency !== "high") return -1;
      if (a.urgency !== "high" && b.urgency === "high") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [leaveRequests, expenseClaims, assetRequests]);

  const handleApprove = async (item: PendingItem) => {
    let success = false;
    if (item.type === "leave") {
      success = await updateLeave(item.id, { status: "approved" });
    } else if (item.type === "expense") {
      success = await updateExpense(item.id, { status: "approved" });
    } else {
      success = await updateAsset(item.id, { status: "approved" });
    }

    if (success) {
      toast({ title: "Approved", description: "Request has been approved successfully." });
    }
  };

  const handleReject = (item: PendingItem) => {
    setSelectedItem(item);
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedItem || !rejectComment.trim()) {
      toast({ title: "Error", description: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }

    let success = false;
    if (selectedItem.type === "leave") {
      success = await updateLeave(selectedItem.id, { status: "rejected", manager_comment: rejectComment });
    } else if (selectedItem.type === "expense") {
      success = await updateExpense(selectedItem.id, { status: "rejected", manager_comment: rejectComment });
    } else {
      success = await updateAsset(selectedItem.id, { status: "rejected", manager_comment: rejectComment });
    }

    if (success) {
      toast({ title: "Rejected", description: "Request has been rejected.", variant: "destructive" });
      setShowRejectDialog(false);
      setRejectComment("");
      setSelectedItem(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-display">Priority Pending Approvals</CardTitle>
            <CardDescription>Sorted by urgency and due date</CardDescription>
          </div>
          <Badge variant="secondary">{pendingItems.length} pending</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending approvals
            </div>
          ) : (
            pendingItems.slice(0, 5).map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className={`p-4 rounded-lg border transition-colors ${
                  item.isOverdue 
                    ? 'border-destructive bg-destructive/5' 
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${item.isOverdue ? 'bg-destructive/10' : 'bg-muted'}`}>
                    {item.isOverdue ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{item.title}</h4>
                      {item.isOverdue && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                      {item.urgency === "high" && !item.isOverdue && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">High Priority</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.typeLabel}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleReject(item)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleApprove(item)}
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This comment will be visible to the requester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason (Required)</Label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Explain why this request is being rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectComment.trim()}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
