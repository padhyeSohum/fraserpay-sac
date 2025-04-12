
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { AlertCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { isPWA, showInstallBanner } from '@/utils/pwa';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Login = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const logo = (
    <div className="flex items-center justify-center mb-6 floating-animation">
      <img 
        src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" 
        alt="Fraser Pay" 
        className="w-48 h-auto drop-shadow-xl" 
      />
    </div>
  );

  return (
    <Layout hideHeader={true}>
      <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in bg-gradient-to-br from-blue-400 to-blue-100">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDEzNSkiPjxyZWN0IGlkPSJwYXR0ZXJuLWJhY2tncm91bmQiIHdpZHRoPSI0MDAlIiBoZWlnaHQ9IjQwMCUiIGZpbGw9InRyYW5zcGFyZW50Ij48L3JlY3Q+IDxjaXJjbGUgZmlsbD0iI2ZmZmZmZiIgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIgb3BhY2l0eT0iMC4xNSI+PC9jaXJjbGU+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI3BhdHRlcm4pIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIj48L3JlY3Q+PC9zdmc+')] opacity-50"></div>
        
        {logo}
        
        <div className="w-full max-w-md mx-auto space-y-4 relative z-10">
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-300 rounded-full opacity-30 blur-xl animate-pulse"></div>
          
          <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-lg rounded-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-brand-800 to-brand-600 bg-clip-text text-transparent">FraserPay</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Use your Student Number and FraserPay Password to log in
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="studentNumber" className="text-gray-700">Student Number</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      id="studentNumber" 
                      type="text" 
                      placeholder="Enter your student number" 
                      value={studentNumber} 
                      onChange={e => setStudentNumber(e.target.value)} 
                      disabled={isLoading} 
                      required 
                      className="pl-10 bg-white/50 border-gray-200 focus:border-brand-500 transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-800 hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      disabled={isLoading} 
                      required 
                      className="pl-10 pr-10 bg-white/50 border-gray-200 focus:border-brand-500 transition-all duration-300" 
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-brand-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-medium py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <div className="text-sm text-center text-muted-foreground">
                <span>Don't have an account? </span>
                <Link to="/register" className="text-brand-600 hover:text-brand-800 hover:underline font-medium transition-colors">
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
    </Layout>
  );
};

export default Login;
