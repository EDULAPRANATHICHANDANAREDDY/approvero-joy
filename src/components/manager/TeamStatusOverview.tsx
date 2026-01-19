import { Users, Briefcase, CalendarCheck, CalendarX, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamStats } from "@/hooks/useTeamLeaveStatus";

interface TeamStatusOverviewProps {
  stats: TeamStats;
  loading: boolean;
}

export function TeamStatusOverview({ stats, loading }: TeamStatusOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusCards = [
    {
      title: "Total Employees",
      value: stats.total_employees,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Working Today",
      value: stats.working_today,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Half-Paid Leave",
      value: stats.on_half_paid_leave,
      icon: CalendarCheck,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Unpaid Leave",
      value: stats.on_unpaid_leave,
      icon: CalendarX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Total On Leave",
      value: stats.on_leave_total,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statusCards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
