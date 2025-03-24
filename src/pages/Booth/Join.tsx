import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Create a schema for booth creation
const createBoothSchema = z.object({
  name: z.string().min(3, "Booth name must be at least 3 characters"),
  description: z.string().optional(),
  pin: z.string().length(6, "PIN must be exactly 6 digits"),
});

// Create a schema for joining a booth
const joinBoothSchema = z.object({
  pin: z.string().length(6, "PIN must be exactly 6 digits"),
});

const JoinBooth = () => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyBoothPin, user, updateUserData } = useAuth();
  const { createBooth, fetchAllBooths, refreshUserBooths } = useTransactions();
  const navigate = useNavigate();

  const joinForm = useForm<z.infer<typeof joinBoothSchema>>({
    resolver: zodResolver(joinBoothSchema),
    defaultValues: {
      pin: "",
    },
  });

  const createForm = useForm<z.infer<typeof createBoothSchema>>({
    resolver: zodResolver(createBoothSchema),
    defaultValues: {
      name: "",
      description: "",
      pin: "",
    },
  });

  const handleJoinSubmit = async (values: z.infer<typeof joinBoothSchema>) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting to verify booth PIN:", values.pin);
      const result = await verifyBoothPin(values.pin);
      console.log("PIN verification result:", result);
      
      if (result.success) {
        // Refresh booths data after successful join
        await refreshUserBooths();
        
        // Get the latest user data to ensure booths are up to date
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && userData) {
            // Update the user data in context to reflect new booth access
            updateUserData({
              ...user,
              booths: userData.booth_access || []
            });
          }
        }
        
        toast.success("Successfully joined booth!");
        
        // Navigate to the new booth if we have its ID
        if (result.boothId) {
          navigate(`/booth/${result.boothId}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error("Failed to join booth. Invalid PIN.");
      }
    } catch (error) {
      console.error("Join booth error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to join booth");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (values: z.infer<typeof createBoothSchema>) => {
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to create a booth");
      }
      
      console.log("Creating booth with values:", values);
      const boothId = await createBooth(
        values.name,
        values.description || '',
        user.id,
        values.pin
      );
      
      console.log("Booth creation result:", boothId);
      
      if (boothId) {
        // Refresh booths data after successful creation
        await fetchAllBooths();
        
        toast.success("Booth created successfully!");
        navigate(`/booth/${boothId}`);
      } else {
        toast.error("Failed to create booth");
      }
    } catch (error) {
      console.error("Create booth error:", error);
      toast.error(error instanceof Error ? error.message : "Unable to create booth");
    } finally {
      setIsLoading(false);
    }
  };

  // Only allow SAC members to create booths
  const canCreateBooth = user?.role === 'sac';

  return (
    <Layout title={mode === 'join' ? "Join a Booth" : "Create a Booth"} showBack>
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-lg glass-card">
            <CardHeader className="space-y-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  {mode === 'join' ? "Join a Booth" : "Create a Booth"}
                </CardTitle>
              </div>
              <CardDescription>
                {mode === 'join' 
                  ? "Enter the booth PIN to join an existing booth" 
                  : "Create a new booth for your club or homeroom"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {mode === 'join' ? (
                <Form {...joinForm}>
                  <form onSubmit={joinForm.handleSubmit(handleJoinSubmit)} className="space-y-4">
                    <FormField
                      control={joinForm.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booth PIN</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter 6-digit PIN"
                              type="password"
                              maxLength={6}
                              className="text-center text-lg py-6"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-brand-600 hover:bg-brand-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Verifying PIN..." : "Join Booth"}
                    </Button>
                  </form>
                </Form>
              ) : canCreateBooth ? (
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booth Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Computer Club"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booth Description (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Tech support and gadgets"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security PIN (6 digits)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Create a 6-digit PIN"
                              type="password"
                              maxLength={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full bg-brand-600 hover:bg-brand-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Booth..." : "Create Booth"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">Only SAC members can create booths</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="text-xs text-center text-muted-foreground">
              <p className="w-full">
                {mode === 'join' 
                  ? "Don't have a PIN? Contact a booth manager or SAC member." 
                  : "Share the PIN with other booth members so they can join."}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default JoinBooth;
