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
import { EmployeeLeaveStatus } from "@/hooks/useTeamLeaveStatus";
import { CheckCircle, XCircle } from "lucide-react";

interface EmployeeStatusTableProps {
  employees: EmployeeLeaveStatus[];
  loading: boolean;
}

export function EmployeeStatusTable({ employees, loading }: EmployeeStatusTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee Status</CardTitle>
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

  const getPaymentBadge = (status: EmployeeLeaveStatus) => {
    if (!status.is_on_leave) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Working
        </Badge>
      );
    }

    switch (status.payment_status) {
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

  const getStatusIcon = (isOnLeave: boolean) => {
    if (isOnLeave) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Employee Status Today</CardTitle>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow 
                key={employee.employee_id}
                className={employee.is_on_leave ? "bg-muted/30" : ""}
              >
                <TableCell className="font-medium">
                  <div>
                    <p>{employee.full_name}</p>
                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                  </div>
                </TableCell>
                <TableCell>{employee.department || "—"}</TableCell>
                <TableCell>
                  {employee.leave_type ? (
                    <span className={employee.payment_status === "unpaid" ? "text-red-600" : ""}>
                      {employee.leave_type}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{getPaymentBadge(employee)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(employee.is_on_leave)}
                    <span className={employee.is_on_leave ? "text-red-600" : "text-green-600"}>
                      {employee.is_on_leave ? "On Leave" : "Working"}
                    </span>
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
