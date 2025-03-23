
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { 
  LayoutDashboard, 
  QrCode, 
  Settings, 
  ListOrdered, 
  ShoppingCart, 
  LogOut, 
  Store,
  CreditCard,
  User
} from 'lucide-react';
import { 
  Menubar, 
  MenubarMenu, 
  MenubarTrigger, 
  MenubarContent, 
  MenubarItem, 
  MenubarSeparator 
} from '@/components/ui/menubar';
import { toast } from 'sonner';
import { resetAuthState } from '@/utils/auth';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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

  // Determine active status for menu items
  const isPathActive = (path: string | string[]) => {
    const currentPath = location.pathname;
    if (Array.isArray(path)) {
      return path.some(p => currentPath.startsWith(p));
    }
    return currentPath.startsWith(path);
  };

  return (
    <Menubar className="w-full border-0 bg-transparent flex justify-between my-2">
      <div className="flex">
        {/* Dashboard */}
        <MenubarMenu>
          <MenubarTrigger 
            className={`p-2 ${isPathActive(['/dashboard', '/sac/dashboard']) ? 'bg-accent' : ''}`}
          >
            <LayoutDashboard className="h-5 w-5 mr-1" />
            <span>Dashboard</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem 
              onClick={() => navigate(user?.role === 'sac' ? '/sac/dashboard' : '/dashboard')}
              className={isPathActive(['/dashboard', '/sac/dashboard']) ? 'bg-accent/50' : ''}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span>Main Dashboard</span>
            </MenubarItem>
            {user?.role === 'sac' && (
              <MenubarItem 
                onClick={() => navigate('/sac/dashboard')}
                className={isPathActive('/sac/dashboard') ? 'bg-accent/50' : ''}
              >
                <Store className="h-4 w-4 mr-2" />
                <span>SAC Dashboard</span>
              </MenubarItem>
            )}
          </MenubarContent>
        </MenubarMenu>

        {/* Booths */}
        <MenubarMenu>
          <MenubarTrigger 
            className={`p-2 ${isPathActive('/booth') ? 'bg-accent' : ''}`}
          >
            <Store className="h-5 w-5 mr-1" />
            <span>Booths</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem 
              onClick={() => navigate('/booth/join')}
              className={isPathActive('/booth/join') ? 'bg-accent/50' : ''}
            >
              <Store className="h-4 w-4 mr-2" />
              <span>Join Booth</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Features */}
        <MenubarMenu>
          <MenubarTrigger 
            className={`p-2 ${isPathActive(['/qr-code', '/leaderboard', '/transactions']) ? 'bg-accent' : ''}`}
          >
            <QrCode className="h-5 w-5 mr-1" />
            <span>Features</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem 
              onClick={() => navigate('/qr-code')}
              className={isPathActive('/qr-code') ? 'bg-accent/50' : ''}
            >
              <QrCode className="h-4 w-4 mr-2" />
              <span>QR Code</span>
            </MenubarItem>
            <MenubarItem 
              onClick={() => navigate('/leaderboard')}
              className={isPathActive('/leaderboard') ? 'bg-accent/50' : ''}
            >
              <ListOrdered className="h-4 w-4 mr-2" />
              <span>Leaderboard</span>
            </MenubarItem>
            <MenubarItem 
              onClick={() => navigate('/transactions')}
              className={isPathActive('/transactions') ? 'bg-accent/50' : ''}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>Transactions</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </div>

      <div className="flex">
        {/* Account & Settings */}
        <MenubarMenu>
          <MenubarTrigger 
            className={`p-2 ${isPathActive('/settings') ? 'bg-accent' : ''}`}
          >
            <User className="h-5 w-5 mr-1" />
            <span>Account</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem className="text-sm opacity-70 cursor-default">
              <span>Signed in as</span>
            </MenubarItem>
            <MenubarItem className="font-medium cursor-default">
              {user?.name || 'User'}
            </MenubarItem>
            <MenubarItem className="text-xs text-muted-foreground cursor-default mb-1">
              {user?.balance !== undefined ? `Balance: $${user.balance.toFixed(2)}` : ''}
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              <span>Settings</span>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </div>
    </Menubar>
  );
};

export default Navigation;
