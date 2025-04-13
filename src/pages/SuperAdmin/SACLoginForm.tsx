
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/integrations/firebase/client';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SACLoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSACLogin = async (e: React.FormEvent) => {
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
      
      // Update last login time
      const adminRef = doc(firestore, 'sac_admins', adminDoc.id);
      await updateDoc(adminRef, {
        lastLogin: new Date().toISOString()
      });
      
      // Login successful
      toast({
        title: "SAC access granted",
        description: "Welcome to the SAC dashboard"
      });
      
      // Grant SAC access temporarily in session
      sessionStorage.setItem('sacAdminId', adminDoc.id);
      
      // Navigate to SAC dashboard
      navigate('/sac/dashboard');
    } catch (error) {
      console.error('SAC login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSACLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sac-username">Username</Label>
        <Input 
          id="sac-username" 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Enter your username" 
          disabled={isLoading} 
          required 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="sac-password">Password</Label>
        <Input 
          id="sac-password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter your password" 
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
        {isLoading ? "Signing In..." : "Access SAC Dashboard"}
      </Button>
    </form>
  );
};

export default SACLoginForm;
