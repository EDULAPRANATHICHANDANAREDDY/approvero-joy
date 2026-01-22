import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamMember } from "@/hooks/useAllTeamMembers";
import { CheckCircle, XCircle, Clock, MinusCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TeamMembersTableProps {
  members: TeamMember[];
  loading: boolean;
  filter: "all" | "working" | "on_leave" | "inactive";
}

export function TeamMembersTable({ members, loading, filter }: TeamMembersTableProps) {
  const filteredMembers = filter === "all" 
    ? members 
    : members.filter(m => m.status === filter);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No team members found for the selected filter.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPaymentBadge = (member: TeamMember) => {
    if (member.status === "inactive") {
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          Inactive
        </Badge>
      );
    }
    
    if (member.status === "working") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Working
        </Badge>
      );
    }

    switch (member.payment_status) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Paid Leave
          </Badge>
        );
      case "half-paid":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Half-Paid
          </Badge>
        );
      case "unpaid":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Unpaid
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            On Leave
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_leave":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "working":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <MinusCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <MinusCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "working":
        return "Working";
      case "on_leave":
        return "On Leave";
      case "inactive":
        return "Not Logged In";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "working":
        return "text-green-600";
      case "on_leave":
        return "text-red-600";
      case "inactive":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Team Members
          <Badge variant="secondary" className="ml-2">
            {filteredMembers.length} {filter === "all" ? "total" : filter.replace("_", " ")}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow 
                key={member.user_id}
                className={member.status === "on_leave" ? "bg-red-50/30" : member.status === "inactive" ? "bg-muted/30" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <p>{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </TableCell>
                <TableCell>{member.department || "—"}</TableCell>
                <TableCell>
                  {member.leave_type ? (
                    <span className={member.payment_status === "unpaid" ? "text-red-600" : ""}>
                      {member.leave_type}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{getPaymentBadge(member)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(member.status)}
                    <span className={getStatusColor(member.status)}>
                      {getStatusText(member.status)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {member.last_activity_at ? (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(member.last_activity_at), { addSuffix: true })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
