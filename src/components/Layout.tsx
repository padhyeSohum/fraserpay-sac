
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showLogout?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
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
  logo,
  footer
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isLoading } = useAuth();

  const handleBack = () => {
    if (location.pathname === '/dashboard') {
      // Don't allow going back from dashboard
      return;
    }
    navigate(-1);
  };

  const defaultLogo = (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/5e41cbb8-760b-43c2-8adf-34be4aaeaf15.png" 
        alt="Fraser Pay" 
        className="h-8 w-auto"
      />
    </div>
  );

  const defaultFooter = (
    <div className="text-center text-xs text-muted-foreground py-2">
      Made with ❤️ by the John Fraser SAC
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <header className="py-4 px-6 flex justify-between items-center border-b border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {defaultLogo}
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </header>
        
        <main className="flex-1 px-6 py-4 max-w-md mx-auto w-full flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
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
              onClick={logout}
              className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>
      
      <main className="flex-1 px-6 py-4 max-w-md mx-auto w-full animate-fade-in">
        {children}
      </main>
      
      <footer className="px-6 mt-auto">
        {footer || defaultFooter}
      </footer>
    </div>
  );
};

export default Layout;
