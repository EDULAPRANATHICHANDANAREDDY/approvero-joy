import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, AlertTriangle, Eye, Check, X } from "lucide-react";
import { useExpenseClaims } from "@/hooks/useExpenseClaims";
import { useAuth } from "@/hooks/useAuth";
import { NewRequestModal } from "@/components/modals/NewRequestModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ExpenseClaims = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { claims, loading, updateClaim } = useExpenseClaims();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const selected = claims.find(c => c.id === selectedClaim);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-display font-semibold text-foreground">Expense Claims</h1>
            </div>
            <Button className="gap-2" onClick={() => setShowNewRequest(true)}>
              <Plus className="h-4 w-4" />
              New Claim
            </Button>
          </header>
          <main className="flex-1 p-6">
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : claims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No expense claims yet</div>
              ) : (
                claims.map((claim) => (
                  <Card key={claim.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-emerald-100">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground">{claim.title}</h3>
                            {claim.policy_warning && (
                                <AlertTriangle className="h-4 w-4 text-amber-500" aria-label={claim.policy_warning} />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {claim.category} • {new Date(claim.created_at).toLocaleDateString()}
                            </p>
                            {claim.policy_warning && (
                              <p className="text-xs text-amber-600 mt-1">{claim.policy_warning}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-foreground">
                            ${Number(claim.amount).toFixed(2)}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedClaim(claim.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={getStatusColor(claim.status)}>
                              {claim.status}
                            </Badge>
                            {claim.status === "approved" && (
                              <Badge variant="outline" className={getPaymentStatusColor(claim.payment_status)}>
                                {claim.payment_status}
                              </Badge>
                            )}
                          </div>
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

      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Expense Claim Details</DialogTitle>
            <DialogDescription>Review the complete claim information</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{selected.title}</p></div>
                <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-medium text-xl">${Number(selected.amount).toFixed(2)}</p></div>
                <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{selected.category}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><Badge className={getStatusColor(selected.status)}>{selected.status}</Badge></div>
              </div>
              {selected.description && <div><p className="text-sm text-muted-foreground">Description</p><p>{selected.description}</p></div>}
              {selected.policy_warning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700"><AlertTriangle className="h-4 w-4 inline mr-1" />{selected.policy_warning}</p>
                </div>
              )}
              {selected.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button variant="destructive" className="flex-1" onClick={() => { updateClaim(selected.id, { status: "rejected", manager_comment: "Rejected" }); setSelectedClaim(null); }}>
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="flex-1" onClick={() => { updateClaim(selected.id, { status: "approved" }); setSelectedClaim(null); }}>
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

export default ExpenseClaims;
