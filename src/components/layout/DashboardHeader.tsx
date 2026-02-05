import { useState } from "react";
import { Search, Plus, Bell, X, CheckCircle, XCircle, AlertTriangle, PartyPopper, Calendar, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewRequestModal } from "@/components/modals/NewRequestModal";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (notification: Notification) => {
  if (notification.type === "holiday") {
    return <PartyPopper className="h-5 w-5 text-yellow-500" />;
  }
  if (notification.type === "leave_balance_warning") {
    return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  }
  if (notification.type === "request_approved") {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
  if (notification.type === "request_rejected") {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
  if (notification.type === "new_request") {
    if (notification.request_type === "leave") return <Calendar className="h-5 w-5 text-blue-500" />;
    if (notification.request_type === "expense") return <DollarSign className="h-5 w-5 text-emerald-500" />;
    if (notification.request_type === "asset") return <Package className="h-5 w-5 text-purple-500" />;
  }
  return <Bell className="h-5 w-5 text-primary" />;
};

const getNotificationStyle = (notification: Notification) => {
  if (notification.type === "holiday") {
    return "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200";
  }
  if (notification.type === "leave_balance_warning") {
    return "bg-orange-50 border-orange-200";
  }
  if (notification.type === "request_approved") {
    return "bg-green-50 border-green-200";
  }
  if (notification.type === "request_rejected") {
    return "bg-red-50 border-red-200";
  }
  return notification.is_read ? "bg-background" : "bg-primary/5 border-primary/20";
};

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
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
          <Button className="gap-2" onClick={() => setShowNewRequest(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Request</span>
          </Button>

          {/* Notifications */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[450px]">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      Mark all read
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-3 pr-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No notifications yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        You'll see updates here when something happens
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${getNotificationStyle(notification)}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-foreground leading-tight">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <NewRequestModal open={showNewRequest} onOpenChange={setShowNewRequest} />
    </>
  );
}
