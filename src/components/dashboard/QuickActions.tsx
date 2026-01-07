import { Calendar, DollarSign, Package, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "Request Leave",
    description: "Submit a new leave application",
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100",
    path: "/leave-requests",
  },
  {
    title: "Submit Expense",
    description: "File an expense claim",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    path: "/expense-claims",
  },
  {
    title: "Request Asset",
    description: "Request equipment or assets",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50 hover:bg-purple-100",
    path: "/asset-requests",
  },
  {
    title: "View Reports",
    description: "Check analytics and reports",
    icon: FileText,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100",
    path: "/dashboard",
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
        <CardDescription>Common tasks at your fingertips</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`p-4 rounded-xl text-left transition-colors ${action.bg}`}
            >
              <action.icon className={`h-6 w-6 ${action.color} mb-2`} />
              <h4 className={`text-sm font-medium ${action.color}`}>
                {action.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
