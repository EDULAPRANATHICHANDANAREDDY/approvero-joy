import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign } from "lucide-react";

const expenses = [
  { id: 1, title: "Office Supplies", amount: 150.00, date: "Dec 18, 2024", category: "Supplies", status: "pending" },
  { id: 2, title: "Client Lunch Meeting", amount: 85.50, date: "Dec 15, 2024", category: "Meals", status: "approved" },
  { id: 3, title: "Travel - Conference", amount: 450.00, date: "Dec 10, 2024", category: "Travel", status: "approved" },
  { id: 4, title: "Software License", amount: 299.00, date: "Dec 5, 2024", category: "Software", status: "rejected" },
];

const ExpenseClaims = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login");
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-display font-semibold text-foreground">Expense Claims</h1>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Claim
            </Button>
          </header>
          <main className="flex-1 p-6">
            <div className="grid gap-4">
              {expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{expense.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {expense.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-foreground">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <Badge variant="outline" className={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ExpenseClaims;
