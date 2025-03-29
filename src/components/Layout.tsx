
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

interface LayoutProps {
  title?: string;
  subtitle?: string;
  logo?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
  showLogout?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  title,
  subtitle,
  logo,
  children,
  showBack = false,
  showLogout = false,
  showAddButton = false,
  onAddClick,
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleBack = () => {
    try {
      // Change this to always go back to dashboard instead of previous page
      navigate('/dashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home if navigation fails
      navigate('/', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to log out');
    }
  };

  // Define container class based on fullWidth prop
  const containerClass = fullWidth ? 'container-fluid px-4' : 'container';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="shadow-sm bg-white sticky top-0 z-10">
        <div className={`${containerClass} flex items-center justify-between h-16`}>
          <div className="flex items-center">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {logo ? (
              logo
            ) : (
              <div className="flex flex-col">
                {title && <h1 className="text-xl font-bold">{title}</h1>}
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {showAddButton && onAddClick && (
              <Button onClick={onAddClick} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            )}
            {showLogout && (
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className={`${containerClass} py-12 flex-1`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
