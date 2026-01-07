import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    title: "Pending Requests",
    value: "12",
    change: "+3 from yesterday",
    changeType: "neutral",
    icon: Clock,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Approved This Week",
    value: "28",
    change: "+12% from last week",
    changeType: "positive",
    icon: CheckCircle,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    title: "Rejected",
    value: "4",
    change: "-2 from last week",
    changeType: "negative",
    icon: XCircle,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    title: "Total Requests",
    value: "156",
    change: "This month",
    changeType: "neutral",
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="p-5 border-2 border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {stat.title}
              </p>
              <p className="text-3xl font-display font-bold text-foreground mt-2">
                {stat.value}
              </p>
              <p
                className={`text-sm mt-1 ${
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
            <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
