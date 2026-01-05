import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";

interface Request {
  id: string;
  type: string;
  requester: string;
  department: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  amount?: string;
}

const requests: Request[] = [
  {
    id: "REQ-001",
    type: "Leave Request",
    requester: "Sarah Johnson",
    department: "Engineering",
    date: "Jan 5, 2026",
    status: "pending",
  },
  {
    id: "REQ-002",
    type: "Expense Claim",
    requester: "Michael Chen",
    department: "Marketing",
    date: "Jan 4, 2026",
    status: "approved",
    amount: "$1,250.00",
  },
  {
    id: "REQ-003",
    type: "Asset Request",
    requester: "Emily Davis",
    department: "Design",
    date: "Jan 4, 2026",
    status: "pending",
  },
  {
    id: "REQ-004",
    type: "Leave Request",
    requester: "James Wilson",
    department: "Sales",
    date: "Jan 3, 2026",
    status: "rejected",
  },
  {
    id: "REQ-005",
    type: "Expense Claim",
    requester: "Lisa Anderson",
    department: "HR",
    date: "Jan 3, 2026",
    status: "approved",
    amount: "$450.00",
  },
];

const statusVariant = {
  pending: "pending" as const,
  approved: "success" as const,
  rejected: "rejected" as const,
};

const RequestsTable = () => {
  return (
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Recent Requests</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of all workflow requests</p>
        </div>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request ID</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requester</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-muted/20 transition-colors">
                <td className="py-4 px-6">
                  <span className="font-mono text-sm font-medium text-foreground">{request.id}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-foreground">{request.type}</span>
                  {request.amount && (
                    <span className="block text-xs text-muted-foreground mt-0.5">{request.amount}</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {request.requester.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{request.requester}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-muted-foreground">{request.department}</span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm text-muted-foreground">{request.date}</span>
                </td>
                <td className="py-4 px-6">
                  <Badge variant={statusVariant[request.status]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestsTable;
