
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { resetAuthState } from '@/utils/auth';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLogout?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  onBackClick?: () => void;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  showBack = false,
  showLogout = false,
  showAddButton = false,
  onAddClick,
  onBackClick,
  logo,
  footer
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isLoading, user } = useAuth();

  const handleBack = () => {
    // Use custom back handler if provided, otherwise use default behavior
    if (onBackClick) {
      onBackClick();
      return;
    }
    
    if (location.pathname === '/dashboard') {
      // Don't allow going back from dashboard
      return;
    }
    // Use navigate instead of window.location to prevent full page reload
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed. Resetting authentication...");
      await resetAuthState();
    }
  };

  const defaultLogo = (
    <div className="flex items-center gap-2">
      <span className="font-bold text-lg text-primary">Fraser Pay</span>
    </div>
  );

  const defaultFooter = (
    <div className="text-center text-xs text-muted-foreground py-2">
      Made with ❤️ by the John Fraser SAC
    </div>
  );

  // Simplified loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <header className="py-4 px-6 flex justify-between items-center border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {defaultLogo}
          </div>
        </header>
        
        <main className="flex-1 px-6 py-4 max-w-md mx-auto w-full flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </main>
        
        <footer className="px-6 mt-auto">
          {footer || defaultFooter}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="py-4 px-6 flex justify-between items-center border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            {logo || defaultLogo}
            
            {title && (
              <h1 className="text-lg font-semibold">{title}</h1>
            )}
            
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showAddButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onAddClick}
              className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          )}
          
          {showLogout && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
      
      <main className="flex-1 px-6 py-4 max-w-md mx-auto w-full">
        {children}
      </main>
      
      <footer className="px-6 mt-auto">
        {footer || defaultFooter}
      </footer>
    </div>
  );
};

export default Layout;
