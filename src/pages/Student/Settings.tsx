
import React from 'react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import { Shield, Bell, HelpCircle, LogOut } from 'lucide-react';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

const Settings = () => {
  const { user, logout, verifySACPin } = useAuth();
  const { toast } = useToast();

  const handleSACAccess = () => {
    // Prompt for SAC PIN
    const pin = prompt('Enter SAC admin PIN:');
    if (pin) {
      const result = verifySACPin(pin);
      if (!result) {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is not correct",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Layout title="Account Settings" showBack>
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
            <CardDescription>Configure your notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Transaction Alerts</span>
              </div>
              <InteractiveHoverButton text="Configure" className="w-28" />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Booth Updates</span>
              </div>
              <InteractiveHoverButton text="Configure" className="w-28" />
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
              <InteractiveHoverButton text="View" className="w-28" />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>SAC Admin Access</span>
              </div>
              <InteractiveHoverButton 
                text="Verify" 
                className="w-28"
                onClick={handleSACAccess}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
