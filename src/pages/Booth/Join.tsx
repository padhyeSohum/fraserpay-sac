import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { uniqueToast } from '@/utils/toastHelpers';
import { Info, Loader2 } from 'lucide-react';
const BoothJoin: React.FC = () => {
  const {
    user,
    updateUserData
  } = useAuth();
  const {
    joinBooth,
    fetchAllBooths
  } = useTransactions();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
    setError(null); // Clear error when pin is changed
  };
  const handleJoinBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter a PIN code');
      return;
    }
    if (!user || !user.id) {
      uniqueToast.error('You must be logged in to join a booth');
      return;
    }
    try {
      setIsJoining(true);
      setError(null);
      console.log(`Attempting to join booth with PIN: ${pin}`);
      const success = await joinBooth(pin, user.id);
      if (success) {
        console.log('Successfully joined booth, refreshing data...');

        // Refresh booths list to include the newly joined booth
        const updatedBooths = await fetchAllBooths();

        // Find the booth that matches the PIN
        const joinedBooth = updatedBooths.find(booth => booth.pin === pin);

        // Update user data to include the new booth
        if (user) {
          const currentBooths = user.booths || [];
          if (joinedBooth && !currentBooths.includes(joinedBooth.id)) {
            const updatedUserBooths = [...currentBooths, joinedBooth.id];
            updateUserData({
              ...user,
              booths: updatedUserBooths
            });
          }
        }

        // Trigger an event to refresh booths on the dashboard
        localStorage.setItem('boothJoined', Date.now().toString());
        if (joinedBooth) {
          uniqueToast.success('Successfully joined booth!');
          // Navigate directly to the booth page
          navigate(`/booth/${joinedBooth.id}`);
        } else {
          // If for some reason we can't find the booth, navigate to dashboard
          uniqueToast.success('Successfully joined booth!');
          navigate('/dashboard');
        }
      } else {
        setError('Invalid PIN code or unable to join booth. Please check and try again.');
        uniqueToast.error('Failed to join booth');
      }
    } catch (error) {
      console.error('Error joining booth:', error);
      setError('An unexpected error occurred. Please try again.');
      uniqueToast.error('Failed to join booth');
    } finally {
      setIsJoining(false);
    }
  };
  return <Layout title="Join a Booth" subtitle="Enter the booth PIN code" showBack>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Join Initiative</CardTitle>
            <CardDescription>Enter the PIN code provided by your staff supervisor to join an existing booth.</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleJoinBooth}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium">
                  Booth PIN Code
                </label>
                <Input id="pin" type="text" value={pin} onChange={handlePinChange} placeholder="Enter 6-digit PIN" maxLength={6} className={error ? "border-destructive" : ""} disabled={isJoining} />
                
                {error && <div className="text-destructive text-sm flex items-center gap-1.5">
                    <Info className="h-4 w-4" />
                    <span>{error}</span>
                  </div>}
              </div>
              
              <div className="bg-muted/50 rounded-md p-3">
                <h4 className="text-sm font-medium mb-2">Don't have a PIN?</h4>
                <p className="text-sm text-muted-foreground">Ask your teacher or club supervisor to provide your booth pin. If you need help with this, please visit the SAC booth. </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between flex-col sm:flex-row gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} disabled={isJoining} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={!pin.trim() || isJoining} className="w-full sm:w-auto">
                {isJoining ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </> : 'Join Booth'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Separator className="my-8" />
        
        <div className="text-center">
          <h3 className="text-base font-medium mb-2">Need to Create a New Booth?</h3>
          <p className="text-sm text-muted-foreground mb-4">Find the SAC booth and ask a SAC member there to help you out. </p>
          <Button variant="link" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </Layout>;
};
export default BoothJoin;