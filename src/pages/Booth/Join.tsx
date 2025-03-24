
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const BoothJoin = () => {
  const { user, verifyBoothPin } = useAuth();
  const { refreshUserBooths } = useTransactions();
  const navigate = useNavigate();
  
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [booths, setBooths] = useState<any[]>([]);
  
  // Load existing user booths
  useEffect(() => {
    if (!user) return;
    
    async function loadUserBooths() {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('booth_access')
          .eq('id', user.id)
          .single();
          
        if (userError) {
          console.error('Error loading user booths:', userError);
          return;
        }
        
        if (userData && userData.booth_access && userData.booth_access.length > 0) {
          const { data: boothsData, error: boothsError } = await supabase
            .from('booths')
            .select('id, name, description')
            .in('id', userData.booth_access);
            
          if (boothsError) {
            console.error('Error loading booth details:', boothsError);
            return;
          }
          
          if (boothsData) {
            setBooths(boothsData);
          }
        }
      } catch (error) {
        console.error('Error loading booths:', error);
      }
    }
    
    loadUserBooths();
  }, [user]);
  
  const handleVerifyPin = async () => {
    if (!pin.trim()) {
      toast.error('Please enter a PIN');
      return;
    }
    
    if (!user) {
      toast.error('You need to be logged in to join a booth');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await verifyBoothPin(pin.trim());
      console.log('Booth verification result:', result);
      
      if (result.success) {
        toast.success('Booth joined successfully');
        
        // Refresh booths in transaction context
        await refreshUserBooths();
        
        // Navigate to the booth if we have a boothId
        if (result.boothId) {
          navigate(`/booth/${result.boothId}`);
        } else {
          // Fallback to dashboard if for some reason we don't have a boothId
          navigate('/dashboard');
        }
      } else {
        toast.error('Failed to join booth. Please check the PIN and try again.');
      }
    } catch (error) {
      console.error('Error joining booth:', error);
      toast.error('An error occurred while joining the booth');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBoothClick = (boothId: string) => {
    navigate(`/booth/${boothId}`);
  };
  
  return (
    <Layout title="Join a Booth" showBack>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Join Booth</CardTitle>
            <CardDescription>
              Enter the booth PIN to join as a booth manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium">Booth PIN</label>
                <Input
                  id="pin"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleVerifyPin}
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Booth'}
            </Button>
          </CardFooter>
        </Card>
        
        {booths.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Your Booths</h2>
            <div className="space-y-3">
              {booths.map(booth => (
                <Card 
                  key={booth.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleBoothClick(booth.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{booth.name}</h3>
                    {booth.description && (
                      <p className="text-sm text-muted-foreground mt-1">{booth.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BoothJoin;
