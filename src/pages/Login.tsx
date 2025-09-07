import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, isAuthenticated, loading, toast } = useAuth();

  // Fetch company settings for logo
  const { data: settings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      return data;
    }
  });

  // Redirect if already authenticated
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast?.({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        throw error;
      }

      toast?.({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
      });

      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast?.({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        {/* Company Logo */}
        <div className="flex justify-center">
          {settings?.logo_url ? (
            <div className="relative group">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 shadow-2xl border border-primary/20 hover-scale">
                <img 
                  src={settings.logo_url} 
                  alt="Company Logo" 
                  className="h-20 w-auto object-contain filter brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl blur-xl opacity-30 -z-10 group-hover:opacity-40 transition-opacity"></div>
            </div>
          ) : (
            <div className="relative group">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 shadow-2xl border border-primary/20 hover-scale">
                <span className="text-primary-foreground font-bold text-3xl">CI</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl blur-xl opacity-30 -z-10 group-hover:opacity-40 transition-opacity"></div>
            </div>
          )}
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          
          <CardHeader className="space-y-2 relative">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 relative">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover-scale" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Need help?</span>
              </div>
            </div>
            
            <div className="text-center">
              <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors story-link"
                  >
                    Forgot your password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md backdrop-blur-sm bg-card/95 border border-border/50">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Enter your email address and we'll send you a secure link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@company.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowForgotPassword(false)}
                      disabled={isResetLoading}
                      className="border-border/50 hover:bg-muted/50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleForgotPassword}
                      disabled={isResetLoading}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                    >
                      {isResetLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Secure access to your business platform</p>
        </div>
      </div>
    </div>
  );
}