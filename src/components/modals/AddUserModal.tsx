import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (user: UserData) => void;
  existingEmails: string[];
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive";
}

const roles = ["Admin", "Manager", "Developer", "Designer"];
const departments = ["Engineering", "Design", "Operations", "Marketing", "Finance", "HR"];

export function AddUserModal({ open, onOpenChange, onUserAdded, existingEmails }: AddUserModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "active" as "active" | "inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);

  const validateEmail = async (email: string): Promise<boolean> => {
    setValidatingEmail(true);
    
    // Check if email exists in profiles table (signed up users)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    setValidatingEmail(false);

    if (error) {
      console.error("Error checking email:", error);
      return false;
    }

    if (!profile) {
      setErrors(prev => ({
        ...prev,
        email: "User must sign up first before being added. This email is not registered in the system."
      }));
      return false;
    }

    // Auto-fill name if profile has one
    if (profile.full_name && !formData.name) {
      setFormData(prev => ({ ...prev, name: profile.full_name || "" }));
    }

    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    } else if (existingEmails.includes(formData.email.toLowerCase())) {
      newErrors.email = "This email is already in the users list";
    }
    
    if (!formData.role) {
      newErrors.role = "Role is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);

    // Validate that the email exists in profiles (signed up)
    const isValidEmail = await validateEmail(formData.email);
    
    if (!isValidEmail) {
      setSubmitting(false);
      return;
    }

    // Add to employees table
    const { error: empError } = await supabase
      .from("employees")
      .insert({
        full_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        department: formData.department || "General",
        position: formData.role,
        is_active: formData.status === "active",
      });

    if (empError) {
      toast({
        title: "Error",
        description: "Failed to add user. " + empError.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    
    const newUser: UserData = {
      id: Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      department: formData.department || "Not Assigned",
      status: formData.status,
    };
    
    onUserAdded(newUser);
    
    toast({
      title: "Success",
      description: `User "${newUser.name}" has been added successfully`,
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      role: "",
      department: "",
      status: "active",
    });
    setErrors({});
    setSubmitting(false);
    onOpenChange(false);
  };

  const handleEmailBlur = async () => {
    if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      if (!existingEmails.includes(formData.email.toLowerCase())) {
        await validateEmail(formData.email);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Add an existing user to your team. Users must sign up first before they can be added.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Only users who have signed up can be added. Make sure they create an account first.</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors(prev => ({ ...prev, email: "" }));
              }}
              onBlur={handleEmailBlur}
              placeholder="Enter email address"
              className={errors.email ? "border-red-500" : ""}
            />
            {validatingEmail && (
              <p className="text-xs text-muted-foreground">Checking email...</p>
            )}
            {errors.email && (
              <p className="text-xs text-red-500 flex gap-1 items-start">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "inactive" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting || validatingEmail}>
              {submitting ? "Adding..." : "Add User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
