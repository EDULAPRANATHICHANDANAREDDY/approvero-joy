import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Eye, Check, X } from "lucide-react";
import { useAssetRequests } from "@/hooks/useAssetRequests";
import { useManagerAuth } from "@/hooks/useManagerAuth";
import { NewRequestModal } from "@/components/modals/NewRequestModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AssetRequests = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isManager } = useManagerAuth();
  const { requests, loading, updateRequest } = useAssetRequests();
  const { toast } = useToast();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      case "assigned": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "low": return "bg-gray-50 text-gray-600 border-gray-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const handleApprove = async (id: string) => {
    if (!isManager) {
      toast({ title: "Access Denied", description: "Only managers can approve requests", variant: "destructive" });
      return;
    }
    setProcessingId(id);
    await updateRequest(id, { status: "approved" });
    setProcessingId(null);
    setSelectedRequest(null);
    toast({ title: "Success", description: "Asset request approved" });
  };

  const handleReject = async (id: string) => {
    if (!isManager) {
      toast({ title: "Access Denied", description: "Only managers can reject requests", variant: "destructive" });
      return;
    }
    if (!rejectComment.trim()) {
      toast({ title: "Error", description: "Rejection comment is required", variant: "destructive" });
      return;
    }
    setProcessingId(id);
    await updateRequest(id, { status: "rejected", manager_comment: rejectComment });
    setProcessingId(null);
    setShowRejectDialog(false);
    setSelectedRequest(null);
    setRejectComment("");
    toast({ title: "Success", description: "Asset request rejected" });
  };

  const openRejectDialog = (id: string) => {
    setSelectedRequest(id);
    setShowRejectDialog(true);
  };

  const selected = requests.find(r => r.id === selectedRequest);
  const pendingRequests = requests.filter(r => r.status === "pending");
  const otherRequests = requests.filter(r => r.status !== "pending");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-display font-semibold text-foreground">Asset Requests</h1>
            </div>
            <Button className="gap-2" onClick={() => setShowNewRequest(true)}>
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </header>
          <main className="flex-1 p-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Pending Requests</h2>
                <div className="grid gap-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                              <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{request.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {request.category} • {request.asset_type}
                                {request.estimated_cost && ` • $${Number(request.estimated_cost).toFixed(2)}`}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                              {request.urgency}
                            </Badge>
                            {isManager && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => openRejectDialog(request.id)}
                                  disabled={processingId === request.id}
                                >
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleApprove(request.id)}
                                  disabled={processingId === request.id}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                              </>
                            )}
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
                  ))}
                </div>
              </div>
            )}

            {/* Processed Requests */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Processed Requests</h2>
                <div className="grid gap-4">
                  {otherRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-100">
                              <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">{request.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {request.category} • {request.asset_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                              {request.urgency}
                            </Badge>
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
                  ))}
                </div>
              </div>
            )}

            {requests.length === 0 && !loading && (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No requests submitted yet</h3>
                <p className="text-muted-foreground mb-4">You haven't submitted any asset requests.</p>
                <Button onClick={() => setShowNewRequest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      <NewRequestModal open={showNewRequest} onOpenChange={setShowNewRequest} />

      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest && !showRejectDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asset Request Details</DialogTitle>
            <DialogDescription>Review the complete request information</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Asset</p><p className="font-medium">{selected.title}</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium">{selected.asset_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{selected.category}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><Badge className={getStatusColor(selected.status)}>{selected.status}</Badge></div>
                {selected.estimated_cost && <div><p className="text-sm text-muted-foreground">Estimated Cost</p><p className="font-medium">${Number(selected.estimated_cost).toFixed(2)}</p></div>}
                <div><p className="text-sm text-muted-foreground">Urgency</p><Badge className={getUrgencyColor(selected.urgency)}>{selected.urgency}</Badge></div>
              </div>
              <div><p className="text-sm text-muted-foreground">Business Justification</p><p>{selected.reason}</p></div>
              {selected.manager_comment && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Manager Comment</p>
                  <p>{selected.manager_comment}</p>
                </div>
              )}
              {selected.status === "pending" && isManager && (
                <div className="flex gap-2 pt-4">
                  <Button variant="destructive" className="flex-1" onClick={() => openRejectDialog(selected.id)}>
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="flex-1" onClick={() => handleApprove(selected.id)}>
                    <Check className="h-4 w-4 mr-2" /> Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Comment */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Asset Request</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Rejection Comment *</Label>
              <Textarea
                id="comment"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowRejectDialog(false); setRejectComment(""); }}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1" 
                onClick={() => selectedRequest && handleReject(selectedRequest)}
                disabled={!rejectComment.trim() || processingId !== null}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AssetRequests;
