import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "approvex_session_active";

const Index = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      // Check if this is a fresh browser session
      const wasActive = sessionStorage.getItem(SESSION_KEY);
      
      if (!wasActive) {
        // Fresh browser session - clear any persisted auth and show login
        await supabase.auth.signOut();
        sessionStorage.setItem(SESSION_KEY, "true");
        setCheckingAuth(false);
        return;
      }

      // Session exists - check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate("/dashboard");
      }
      setCheckingAuth(false);
    };

    handleAuth();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-secondary/20 rounded-full blur-2xl" />
      </div>

      <div className="text-center space-y-8 max-w-md relative z-10">
        {/* Logo/Title */}
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-primary animate-fade-in">
          ApproveX
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground font-light animate-slide-up">
          Modern approval management for your enterprise
        </p>

        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up">
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-medium border-2 bg-card/80 backdrop-blur-sm hover:bg-card"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-medium shadow-elevated"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
