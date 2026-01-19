import { Calendar, CalendarDays, Users, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TeamStats } from "@/hooks/useTeamLeaveStatus";

interface LeaveSummaryCardsProps {
  stats: TeamStats;
  monthlyUsed: number;
  yearlyUsed: number;
  loading: boolean;
}

export function LeaveSummaryCards({ stats, monthlyUsed, yearlyUsed, loading }: LeaveSummaryCardsProps) {
  const MONTHLY_LIMIT = 5;
  const YEARLY_LIMIT = 60;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const monthlyPercentage = (monthlyUsed / MONTHLY_LIMIT) * 100;
  const yearlyPercentage = (yearlyUsed / YEARLY_LIMIT) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Monthly Leave Balance */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{MONTHLY_LIMIT - monthlyUsed}</span>
              <span className="text-sm text-muted-foreground">of {MONTHLY_LIMIT} days</span>
            </div>
            <Progress 
              value={100 - monthlyPercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {monthlyUsed} days used this month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Leave Balance */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Yearly Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{YEARLY_LIMIT - yearlyUsed}</span>
              <span className="text-sm text-muted-foreground">of {YEARLY_LIMIT} days</span>
            </div>
            <Progress 
              value={100 - yearlyPercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {yearlyUsed} days used this year
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Employees on Leave */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            On Leave Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <span className="text-3xl font-bold">{stats.on_leave_total}</span>
            <p className="text-sm text-muted-foreground">employees</p>
            <div className="flex gap-2 text-xs">
              <span className="text-yellow-600">{stats.on_half_paid_leave} half-paid</span>
              <span className="text-red-600">{stats.on_unpaid_leave} unpaid</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Today */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Working Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <span className="text-3xl font-bold text-green-600">{stats.working_today}</span>
            <p className="text-sm text-muted-foreground">
              of {stats.total_employees} employees
            </p>
            <Progress 
              value={(stats.working_today / stats.total_employees) * 100} 
              className="h-2 bg-green-100"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
