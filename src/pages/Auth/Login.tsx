
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { isPWA, showInstallBanner } from '@/utils/pwa';

const Login = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 to-sky-100 bg-fixed">
        <div className="w-full max-w-md p-6">
          <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-xl overflow-hidden p-6">
            {/* Logo / Icon */}
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-md">
                <LogIn className="h-7 w-7 text-gray-700" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Sign in with email
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-gray-600 mb-8 px-4">
              Make a new doc to bring your words, data, and teams together. For free
            </p>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="bg-white/50 rounded-lg">
                  <Input
                    placeholder="Email"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    disabled={isLoading}
                    required
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg py-5"
                  />
                </div>
                
                <div className="bg-white/50 rounded-lg relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg py-5 pr-10"
                  />
                  <button 
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
                  Forgot password?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full py-6 bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Get Started"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/30 backdrop-blur-sm text-gray-600">Or sign in with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <button 
                  type="button" 
                  className="flex justify-center items-center py-2.5 px-4 bg-white rounded-lg shadow hover:shadow-md transition-all"
                >
                  <img 
                    src="https://www.svgrepo.com/show/475656/google-color.svg" 
                    alt="Google" 
                    className="h-5 w-5"
                  />
                </button>
                <button 
                  type="button"
                  className="flex justify-center items-center py-2.5 px-4 bg-white rounded-lg shadow hover:shadow-md transition-all"
                >
                  <img 
                    src="https://www.svgrepo.com/show/475647/facebook-color.svg" 
                    alt="Facebook"
                    className="h-5 w-5" 
                  />
                </button>
                <button 
                  type="button"
                  className="flex justify-center items-center py-2.5 px-4 bg-white rounded-lg shadow hover:shadow-md transition-all"
                >
                  <img 
                    src="https://www.svgrepo.com/show/475645/apple-color.svg" 
                    alt="Apple"
                    className="h-5 w-5" 
                  />
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="font-medium text-gray-900 hover:underline">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
      {showPWAPrompt && <PWAInstallPrompt onClose={() => setShowPWAPrompt(false)} />}
    </Layout>
  );
};

export default Login;
