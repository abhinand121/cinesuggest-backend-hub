import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MovieHeader } from "@/components/MovieHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Film, Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // For now, just show a message since we're using guest users
    toast({
      title: isLogin ? "Login feature coming soon" : "Signup feature coming soon",
      description: "Currently using guest authentication. You can still review movies!",
    });
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <MovieHeader showSearch={false} />

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-[0_8px_30px_hsl(var(--primary)/0.3)]">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Sign in to your Nova account" : "Join the Nova community"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 bg-secondary border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 bg-secondary border-border/50 focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold py-6 rounded-xl"
              >
                {loading ? (
                  "Loading..."
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-primary font-semibold hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or continue as guest</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/movies")}
              className="w-full border-border/50 hover:bg-secondary py-6 rounded-xl"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
