import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package } from "lucide-react";

const assets = [
  { id: 1, title: "MacBook Pro 16\"", category: "Laptop", reason: "Development work", status: "pending" },
  { id: 2, title: "Ergonomic Chair", category: "Furniture", reason: "Home office setup", status: "approved" },
  { id: 3, title: "External Monitor 27\"", category: "Monitor", reason: "Dual screen setup", status: "pending" },
];

const AssetRequests = () => {
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
              <h1 className="text-xl font-display font-semibold text-foreground">Asset Requests</h1>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </header>
          <main className="flex-1 p-6">
            <div className="grid gap-4">
              {assets.map((asset) => (
                <Card key={asset.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{asset.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {asset.category} • {asset.reason}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
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

export default AssetRequests;
