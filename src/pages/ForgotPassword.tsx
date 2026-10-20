import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
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
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-display font-bold text-white">
              {sent ? "Check your email" : "Reset your password"}
            </CardTitle>
            <p className="mt-2 text-sm text-slate-300">
              {sent
                ? "If an account matches that email, a password reset link will arrive shortly. Check your spam folder too."
                : "Enter the email address associated with your ApproveX account."}
            </p>
          </CardHeader>
          {!sent && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="recovery-email" className="text-slate-200">Email</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? "Sending link…" : "Send reset link"}
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
};

export default ForgotPassword;