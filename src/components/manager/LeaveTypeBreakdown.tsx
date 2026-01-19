import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeLeaveStatus } from "@/hooks/useTeamLeaveStatus";

interface LeaveTypeBreakdownProps {
  employees: EmployeeLeaveStatus[];
}

export function LeaveTypeBreakdown({ employees }: LeaveTypeBreakdownProps) {
  const onLeave = employees.filter(e => e.is_on_leave);
  const halfPaid = onLeave.filter(e => e.payment_status === "half-paid");
  const unpaid = onLeave.filter(e => e.payment_status === "unpaid");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Half-Paid Leave */}
      <Card className="border-t-4 border-t-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            Half-Paid Leave ({halfPaid.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {halfPaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees on half-paid leave today</p>
          ) : (
            <div className="space-y-2">
              {halfPaid.map(emp => (
                <div key={emp.employee_id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.leave_type}</p>
                  </div>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    50% Pay
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Leave */}
      <Card className="border-t-4 border-t-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Unpaid Leave ({unpaid.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unpaid.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees on unpaid leave today</p>
          ) : (
            <div className="space-y-2">
              {unpaid.map(emp => (
                <div key={emp.employee_id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">{emp.leave_type}</p>
                  </div>
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    No Pay
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
