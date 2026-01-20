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
import { LoggedInUser } from "@/hooks/useLoggedInUsers";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LoggedInUsersTableProps {
  users: LoggedInUser[];
  loading: boolean;
}

export function LoggedInUsersTable({ users, loading }: LoggedInUsersTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currently Logged In Users</CardTitle>
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

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Currently Logged In Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No users are currently logged in today.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPaymentBadge = (user: LoggedInUser) => {
    if (!user.is_on_leave) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Working
        </Badge>
      );
    }

    switch (user.payment_status) {
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
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "on_leave") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Currently Logged In Users
          <Badge variant="secondary" className="ml-2">
            {users.length} online
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
            {users.map((user) => (
              <TableRow 
                key={user.user_id}
                className={user.is_on_leave ? "bg-muted/30" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <p>{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>{user.department || "—"}</TableCell>
                <TableCell>
                  {user.leave_type ? (
                    <span className={user.payment_status === "unpaid" ? "text-red-600" : ""}>
                      {user.leave_type}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{getPaymentBadge(user)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(user.status)}
                    <span className={user.is_on_leave ? "text-red-600" : "text-green-600"}>
                      {user.is_on_leave ? "On Leave" : "Working"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(user.last_activity_at), { addSuffix: true })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
