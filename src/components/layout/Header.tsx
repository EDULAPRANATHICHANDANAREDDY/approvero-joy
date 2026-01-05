import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requests, users..."
            className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-card transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="accent" className="gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
        
        <button className="relative h-10 w-10 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
        </button>
      </div>
    </header>
  );
};

export default Header;
