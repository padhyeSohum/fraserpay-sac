
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { 
  LayoutDashboard, 
  QrCode, 
  Settings, 
  ListOrdered, 
  ShoppingCart, 
  LogOut, 
  Store
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

  return (
    <Menubar className="w-full border-0 bg-transparent flex justify-between mb-4">
      <div className="flex">
        {/* Dashboard */}
        <MenubarMenu>
          <MenubarTrigger className="p-2">
            <LayoutDashboard className="h-5 w-5 mr-1" />
            <span>Dashboard</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => navigate(user?.role === 'sac' ? '/sac/dashboard' : '/dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span>Main Dashboard</span>
            </MenubarItem>
            {user?.role === 'sac' && (
              <MenubarItem onClick={() => navigate('/sac/dashboard')}>
                <Store className="h-4 w-4 mr-2" />
                <span>SAC Dashboard</span>
              </MenubarItem>
            )}
          </MenubarContent>
        </MenubarMenu>

        {/* Booths */}
        <MenubarMenu>
          <MenubarTrigger className="p-2">
            <Store className="h-5 w-5 mr-1" />
            <span>Booths</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => navigate('/booth/join')}>
              <Store className="h-4 w-4 mr-2" />
              <span>Join Booth</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Features */}
        <MenubarMenu>
          <MenubarTrigger className="p-2">
            <QrCode className="h-5 w-5 mr-1" />
            <span>Features</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => navigate('/qr-code')}>
              <QrCode className="h-4 w-4 mr-2" />
              <span>QR Code</span>
            </MenubarItem>
            <MenubarItem onClick={() => navigate('/leaderboard')}>
              <ListOrdered className="h-4 w-4 mr-2" />
              <span>Leaderboard</span>
            </MenubarItem>
            <MenubarItem onClick={() => navigate('/transactions')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>Transactions</span>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </div>

      <div className="flex">
        {/* Settings & Logout */}
        <MenubarMenu>
          <MenubarTrigger className="p-2">
            <Settings className="h-5 w-5 mr-1" />
            <span>Account</span>
          </MenubarTrigger>
          <MenubarContent>
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
