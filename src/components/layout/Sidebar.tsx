import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Clock,
  CreditCard,
  Package,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, badge, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
      active 
        ? "bg-sidebar-accent text-sidebar-primary" 
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    )}
  >
    <Icon className="h-5 w-5 shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {badge !== undefined && (
      <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
    {active && <ChevronRight className="h-4 w-4 opacity-50" />}
  </button>
);

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">WF</span>
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground">WorkFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            Main
          </p>
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={FileText} label="My Requests" badge={3} />
          <NavItem icon={Clock} label="Pending Approvals" badge={5} />
        </div>

        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            Request Types
          </p>
          <NavItem icon={Clock} label="Leave Requests" />
          <NavItem icon={CreditCard} label="Expense Claims" />
          <NavItem icon={Package} label="Asset Requests" />
        </div>

        <div>
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
            Admin
          </p>
          <NavItem icon={Users} label="User Management" />
          <NavItem icon={Settings} label="Settings" />
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-foreground font-semibold text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Manager</p>
          </div>
          <LogOut className="h-4 w-4 text-sidebar-foreground/50" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
