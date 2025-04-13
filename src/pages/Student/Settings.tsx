
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Bell, HelpCircle, LogOut } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// SAC admin credentials
const SAC_ADMINS = [
  { username: "sacadmin", password: "codyisabum" },
  { username: "Akshat", password: "Password" },
  { username: "Cody", password: "123456" },
  { username: "Aleena", password: "654321" },
  { username: "other", password: "sac2025" }
];

const Settings = () => {
  const {
    user,
    logout,
    verifySACPin
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const handleSACAccess = () => {
    setIsOpen(true);
    setUsername('');
    setPassword('');
    setLoginError('');
  };
  
  const handleLogin = () => {
    // Check if username/password match any of the allowed admin credentials
    const isValidAdmin = SAC_ADMINS.some(
      admin => admin.username === username && admin.password === password
    );
    
    if (isValidAdmin) {
      // Use the existing verifySACPin function with the hardcoded PIN
      // This maintains the existing functionality while changing the UI
      const result = verifySACPin("123456");
      if (!result) {
        toast({
          title: "Authentication Error",
          description: "Could not authenticate with SAC admin credentials",
          variant: "destructive"
        });
      }
      setIsOpen(false);
    } else {
      setLoginError("Invalid username or password. Please contact SAC if you need assistance.");
    }
  };
  
  return <Layout title="Account Settings" showBack>
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Student Number</span>
              <span className="font-medium">{user?.studentNumber}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>These features are still in development. Check back soon to try them out :)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Transaction Alerts</span>
              </div>
              <Button variant="outline" size="sm">Coming soon</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Booth Updates</span>
              </div>
              <Button variant="outline" size="sm">Coming soon</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>Get help with FraserPay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>How to Use FraserPay</span>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>SAC Admin Access</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSACAccess}>
                Verify
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>SAC Admin Login</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your SAC admin credentials to access the SAC dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogin}>Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>;
};

export default Settings;
