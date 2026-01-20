import { Card, CardContent } from "@/components/ui/card";
import { LoggedInStats } from "@/hooks/useLoggedInUsers";
import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";

interface LoggedInStatsCardsProps {
  stats: LoggedInStats;
  loading: boolean;
}

export function LoggedInStatsCards({ stats, loading }: LoggedInStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Logged In",
      value: stats.total_logged_in,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      description: "Users active today",
    },
    {
      title: "Working Now",
      value: stats.working_today,
      icon: UserCheck,
      color: "bg-green-100 text-green-600",
      description: "No leave requests",
    },
    {
      title: "On Leave Today",
      value: stats.on_leave_today,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
      description: "Logged in but on leave",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
