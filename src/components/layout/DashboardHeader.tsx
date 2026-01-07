import { useState } from "react";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <h1 className="text-xl font-display font-semibold text-foreground">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64 bg-background"
          />
        </div>

        {/* New Request Button */}
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Request</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
            4
          </Badge>
        </Button>
      </div>
    </header>
  );
}
