import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Package } from "lucide-react";
import { useLeaveRequests } from "@/hooks/useLeaveRequests";
import { useExpenseClaims } from "@/hooks/useExpenseClaims";
import { useAssetRequests } from "@/hooks/useAssetRequests";
import { useLeaveBalances } from "@/hooks/useLeaveBalances";

interface NewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RequestType = "leave" | "expense" | "asset" | null;

export function NewRequestModal({ open, onOpenChange }: NewRequestModalProps) {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<RequestType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createRequest: createLeave } = useLeaveRequests();
  const { createClaim } = useExpenseClaims();
  const { createRequest: createAsset } = useAssetRequests();
  const { hasEnoughBalance, getBalance, updateUsedDays } = useLeaveBalances();

  // Leave form state
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Office Supplies");
  const [expenseDescription, setExpenseDescription] = useState("");

  // Asset form state
  const [assetTitle, setAssetTitle] = useState("");
  const [assetType, setAssetType] = useState("Laptop");
  const [assetCategory, setAssetCategory] = useState("Equipment");
  const [assetReason, setAssetReason] = useState("");
  const [assetCost, setAssetCost] = useState("");
  const [assetUrgency, setAssetUrgency] = useState("normal");

  const resetForms = () => {
    setRequestType(null);
    setLeaveType("Annual Leave");
    setStartDate("");
    setEndDate("");
    setLeaveReason("");
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategory("Office Supplies");
    setExpenseDescription("");
    setAssetTitle("");
    setAssetType("Laptop");
    setAssetCategory("Equipment");
    setAssetReason("");
    setAssetCost("");
    setAssetUrgency("normal");
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (requestType === "leave") {
        const days = calculateDays();
        if (!hasEnoughBalance(leaveType, days)) {
          setIsSubmitting(false);
          return;
        }
        const result = await createLeave({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          days,
          reason: leaveReason,
          urgency: "normal"
        });
        if (result) {
          // Update used days after successful leave request
          await updateUsedDays(leaveType, days);
        }
        navigate("/leave-requests");
      } else if (requestType === "expense") {
        await createClaim({
          title: expenseTitle,
          amount: parseFloat(expenseAmount),
          category: expenseCategory,
          description: expenseDescription
        });
        navigate("/expense-claims");
      } else if (requestType === "asset") {
        await createAsset({
          title: assetTitle,
          asset_type: assetType,
          category: assetCategory,
          reason: assetReason,
          estimated_cost: assetCost ? parseFloat(assetCost) : undefined,
          urgency: assetUrgency
        });
        navigate("/asset-requests");
      }

      resetForms();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = calculateDays();
  const balance = getBalance(leaveType);
  const insufficientBalance = days > 0 && !hasEnoughBalance(leaveType, days);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForms(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {requestType ? `New ${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request` : "New Request"}
          </DialogTitle>
          <DialogDescription>
            {!requestType ? "Select the type of request you want to submit" : "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>

        {!requestType ? (
          <div className="grid grid-cols-3 gap-4 py-4">
            <button
              onClick={() => setRequestType("leave")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-medium text-foreground">Leave</span>
            </button>
            <button
              onClick={() => setRequestType("expense")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="font-medium text-foreground">Expense</span>
            </button>
            <button
              onClick={() => setRequestType("asset")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-purple-100">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-medium text-foreground">Asset</span>
            </button>
          </div>
        ) : requestType === "leave" ? (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <span className="font-medium">{leaveType} Balance:</span> {balance} days remaining
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {days > 0 && (
              <div className={`p-3 rounded-lg text-sm ${insufficientBalance ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                {insufficientBalance 
                  ? `Insufficient balance! You need ${days} days but only have ${balance} remaining.`
                  : `Duration: ${days} day${days > 1 ? 's' : ''}`
                }
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Describe the reason for your leave..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setRequestType(null)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !startDate || !endDate || insufficientBalance} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        ) : requestType === "expense" ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} placeholder="e.g., Office Supplies Purchase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Meals">Meals</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} placeholder="Describe the expense..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setRequestType(null)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !expenseTitle || !expenseAmount} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asset Name</Label>
              <Input value={assetTitle} onChange={(e) => setAssetTitle(e.target.value)} placeholder="e.g., MacBook Pro 16&quot;" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laptop">Laptop</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Peripheral">Peripheral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={assetCategory} onValueChange={setAssetCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Cost ($)</Label>
                <Input type="number" value={assetCost} onChange={(e) => setAssetCost(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select value={assetUrgency} onValueChange={setAssetUrgency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Justification</Label>
              <Textarea value={assetReason} onChange={(e) => setAssetReason(e.target.value)} placeholder="Explain why you need this asset..." />
            </div>
            {assetCost && parseFloat(assetCost) <= 100 && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                ✓ This request qualifies for auto-approval (cost ≤ $100)
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setRequestType(null)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !assetTitle || !assetReason} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
