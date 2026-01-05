import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-8 max-w-md">
        {/* Logo/Title */}
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Authera
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground font-light">
          A modern enterprise authorization engine
        </p>

        {/* Auth Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-medium"
          >
            Login
          </Button>
          <Button
            onClick={() => navigate("/signup")}
            size="lg"
            className="w-full sm:w-auto min-w-[140px] h-12 text-base font-medium"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
