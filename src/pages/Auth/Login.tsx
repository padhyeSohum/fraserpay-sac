
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { AlertCircle } from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { isPWA, showInstallBanner } from '@/utils/pwa';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const {
    login,
    isAuthenticated,
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile || isPWA()) return;
    console.log("Login page: Setting up PWA install banner");
    return showInstallBanner(setShowPWAPrompt, 2000);
  }, [isMobile]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Login page: User is authenticated, redirecting", user.role);
      navigate('/dashboard', {
        replace: true
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNumber || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both student number and password",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(studentNumber, password);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logo = <div className="flex items-center justify-center mb-6">
      <img src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" alt="Fraser Pay" className="w-48 h-auto" />
    </div>;

  return <Layout hideHeader>
      <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in">
        {logo}
        
        <div className="w-full max-w-md mx-auto space-y-4">
          <Card className="border-none shadow-lg glass-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">FraserPay</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials you created to log in
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentNumber">Student Number</Label>
                  <Input id="studentNumber" type="text" placeholder="Enter your student number" value={studentNumber} onChange={e => setStudentNumber(e.target.value)} disabled={isLoading} required className="bg-white/50" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required className="bg-white/50" />
                </div>
                
                <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-center text-muted-foreground">
                <span>Don't have an account? </span>
                <Link to="/register" className="text-brand-600 hover:underline">
                  Create one
                </Link>
              </div>
              
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span className="text-center">Contact SAC if you need help signing in.</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {showPWAPrompt && <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />}
    </Layout>;
};

export default Login;
