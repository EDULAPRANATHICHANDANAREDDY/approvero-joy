import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    setIsRecovery(hashParams.get("type") === "recovery");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.auth.signOut();
    toast.success("Password updated. Sign in with your new password.");
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <Button asChild variant="ghost" className="text-slate-300 hover:text-foreground">
          <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" />Back to sign in</Link>
        </Button>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-white">
              {isRecovery ? "Choose a new password" : "Reset link unavailable"}
            </CardTitle>
            <p className="mt-2 text-sm text-slate-300">
              {isRecovery
                ? "Set a new password for your ApproveX account."
                : "Open the password reset link from your email, or request a new one."}
            </p>
          </CardHeader>
          <CardContent>
            {isRecovery ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-200">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-200">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    className="h-11 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? "Updating password…" : "Update password"}
                </Button>
              </form>
            ) : (
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request a new reset link</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default ResetPassword;