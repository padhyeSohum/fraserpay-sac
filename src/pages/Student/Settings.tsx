
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
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const {
    user,
    logout,
    verifySACPin,
    loginWithGoogle
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const handleSACAccess = async () => {
    try {
      // Directly trigger Google Sign-In for SAC access
      const googleUser = await loginWithGoogle();
      
      if (googleUser) {
        // If the user has the correct role after sign-in, navigate to SAC dashboard
        if (googleUser.role === 'sac') {
          navigate('/sac/dashboard');
          toast({
            title: "SAC Access Granted",
            description: "SAC access granted",
          });
        } else {
          toast({
            title: "Access Denied",
            description: "Your email is not authorized for SAC access.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "SAC Access",
          description: "Could not verify SAC access. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during SAC access:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
    </Layout>;
};

export default Settings;
