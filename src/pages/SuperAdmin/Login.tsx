
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Query Firestore for admin with this username
      const adminsRef = collection(firestore, 'sac_admins');
      const q = query(adminsRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Invalid username or password');
        return;
      }
      
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      
      // Check if admin is active
      if (!adminData.active) {
        setError('This account has been deactivated');
        return;
      }
      
      // Check password (in a real application, you'd use bcrypt to compare hashed passwords)
      if (adminData.password !== password) {
        setError('Invalid username or password');
        return;
      }
      
      // Login successful
      toast({
        title: "Login successful",
        description: "Welcome to the super admin dashboard"
      });
      
      // Store admin ID in session storage (not local storage, for security)
      sessionStorage.setItem('superAdminId', adminDoc.id);
      
      // Navigate to super admin dashboard
      navigate('/super-admin/dashboard');
    } catch (error) {
      console.error('Super admin login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logo = <div className="flex items-center justify-center mb-6">
    <img src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" alt="Fraser Pay" className="w-48 h-auto" />
  </div>;

  return (
    <Layout hideHeader={true}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        {logo}
        
        <div className="w-full max-w-md mx-auto space-y-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Super Admin Access</CardTitle>
              <CardDescription className="text-center">
                Restricted area. Authorized personnel only.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Enter your username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    disabled={isLoading} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    disabled={isLoading} 
                    required 
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-xs text-center text-muted-foreground">
                <span>This area is for system administrators only.</span>
              </div>
              
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span className="text-center">Unauthorized access attempts will be logged.</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminLogin;
