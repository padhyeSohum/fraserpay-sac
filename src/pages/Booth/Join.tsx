
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';

const JoinBooth = () => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyBoothPin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length < 6) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a valid booth PIN",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await verifyBoothPin(pin);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Unable to verify booth PIN",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Booth Access" showBack>
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-lg glass-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Manage Your Booth</CardTitle>
              <CardDescription className="text-center">
                Part of a club or homeroom booth? Enter your booth PIN to access management features
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Booth PIN</label>
                  <Input
                    type="password"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
                    maxLength={6}
                    className="text-center text-lg py-6"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying PIN..." : "Verify PIN"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="text-xs text-center text-muted-foreground">
              <p className="w-full">
                Don't have a PIN? Skip this step or talk to your booth coordinator.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default JoinBooth;
