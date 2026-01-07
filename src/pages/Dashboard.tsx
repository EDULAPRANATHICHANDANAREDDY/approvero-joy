import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { PendingApprovalsCard } from "@/components/dashboard/PendingApprovalsCard";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) {
          navigate("/login");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-2xl font-display font-bold text-foreground">
                Welcome back, {userName}
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your team today.
              </p>
            </div>

            {/* Stats Cards */}
            <DashboardStats />

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <PendingApprovalsCard />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
