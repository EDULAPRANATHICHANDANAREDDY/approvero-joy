import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddUserModal, UserData } from "@/components/modals/AddUserModal";
import { useToast } from "@/hooks/use-toast";

interface ProfileUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean;
}

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login");
        return;
      }
      fetchUsers();
    });
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles (registered users)
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (error) throw error;

      // Fetch employees for additional info
      const { data: employees } = await supabase
        .from("employees")
        .select("email, is_active, position, department");

      const employeeMap = new Map(employees?.map(e => [e.email?.toLowerCase(), e]) || []);

      // Map profiles to users
      const mappedUsers: ProfileUser[] = (profiles || []).map(profile => {
        const employee = profile.email ? employeeMap.get(profile.email.toLowerCase()) : null;
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || profile.email?.split("@")[0] || "Unknown",
          role: profile.role || "Employee",
          department: employee?.department || profile.department || "General",
          is_active: employee?.is_active ?? true, // Default to active
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    // Find the user's email
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      // Update or insert into employees table
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("email", user.email)
        .single();

      if (existingEmployee) {
        await supabase
          .from("employees")
          .update({ is_active: !currentStatus })
          .eq("id", existingEmployee.id);
      } else {
        await supabase
          .from("employees")
          .insert({
            email: user.email,
            full_name: user.full_name || user.email.split("@")[0],
            is_active: !currentStatus,
            user_id: user.user_id,
          });
      }

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );

      toast({
        title: "Status Updated",
        description: `User is now ${!currentStatus ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleUserAdded = (newUser: UserData) => {
    // Refresh the users list from database
    fetchUsers();
  };

  const existingEmails = users.map(u => u.email.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-xl font-display font-semibold text-foreground">Users</h1>
              <Badge variant="secondary">{users.length} registered</Badge>
            </div>
            <Button className="gap-2" onClick={() => setShowAddUser(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </header>
          <main className="flex-1 p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No registered users found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {(user.full_name || user.email).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-foreground">{user.full_name || user.email.split("@")[0]}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground capitalize">{user.role}</p>
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                          </div>
                          <Badge 
                            variant={user.is_active ? "default" : "secondary"}
                            className={`cursor-pointer ${user.is_active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-400 hover:bg-gray-500"}`}
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? "active" : "inactive"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.is_active)}>
                                {user.is_active ? "Set Inactive" : "Set Active"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      
      <AddUserModal 
        open={showAddUser} 
        onOpenChange={setShowAddUser} 
        onUserAdded={handleUserAdded}
        existingEmails={existingEmails}
      />
    </SidebarProvider>
  );
};

export default Users;
