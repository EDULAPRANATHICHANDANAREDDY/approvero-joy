import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function DashboardStats() {
  const navigate = useNavigate();
  const { stats, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 border-2 border-border/50 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Pending Requests",
      value: stats.pending.toString(),
      change: `Leave: ${stats.pendingByCategory.leave} | Expense: ${stats.pendingByCategory.expense} | Asset: ${stats.pendingByCategory.asset}`,
      changeType: "neutral" as const,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      onClick: () => navigate("/leave-requests"),
      clickable: true
    },
    {
      title: "Approved This Week",
      value: stats.approvedThisWeek.toString(),
      change: stats.approvalTrend[6] > stats.approvalTrend[0] ? "+trending up" : "stable",
      changeType: "positive" as const,
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: stats.approvalTrend
    },
    {
      title: "Rejected",
      value: stats.rejected.toString(),
      change: stats.topRejectionReason,
      changeType: "negative" as const,
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      tooltip: `Top reason: ${stats.topRejectionReason}`
    },
    {
      title: "Total Requests",
      value: stats.total.toString(),
      change: "All time",
      changeType: "neutral" as const,
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      drilldown: stats.pendingByCategory
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Tooltip key={stat.title}>
            <TooltipTrigger asChild>
              <Card 
                className={`p-5 border-2 border-border/50 ${stat.clickable ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
                onClick={stat.onClick}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-display font-bold text-foreground mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.changeType === "positive" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                      {stat.changeType === "negative" && <TrendingDown className="h-3 w-3 text-red-500" />}
                      <p
                        className={`text-sm ${
                          stat.changeType === "positive"
                            ? "text-emerald-600"
                            : stat.changeType === "negative"
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stat.change}
                      </p>
                    </div>
                    {stat.trend && (
                      <div className="flex items-end gap-0.5 mt-2 h-8">
                        {stat.trend.map((val, i) => (
                          <div
                            key={i}
                            className="w-3 bg-emerald-200 rounded-sm"
                            style={{ height: `${Math.max(val * 8, 4)}px` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </Card>
            </TooltipTrigger>
            {stat.tooltip && (
              <TooltipContent>
                <p>{stat.tooltip}</p>
              </TooltipContent>
            )}
            {stat.drilldown && (
              <TooltipContent>
                <p>Leave: {stat.drilldown.leave} | Expense: {stat.drilldown.expense} | Asset: {stat.drilldown.asset}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
