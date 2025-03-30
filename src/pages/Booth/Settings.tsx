import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { AlertCircle, Copy, Trash } from 'lucide-react';
const BoothSettings = () => {
  const {
    boothId
  } = useParams<{
    boothId: string;
  }>();
  const {
    user
  } = useAuth();
  const {
    getBoothById,
    deleteBooth
  } = useTransactions();
  const navigate = useNavigate();
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [activeTab, setActiveTab] = useState('settings');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
    }
  }, [boothId, getBoothById]);

  // Remove role-based restriction, just check if booth exists
  useEffect(() => {
    if (!booth) {
      console.log("Booth not found or user doesn't have access");
      // We'll handle this in the render method below
    }
  }, [booth]);
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'dashboard') {
      navigate(`/booth/${boothId}`);
    } else if (value === 'sell') {
      navigate(`/booth/${boothId}/sell`);
    } else if (value === 'transactions') {
      navigate(`/booth/${boothId}/transactions`);
    }
  };
  const handleCopyPin = () => {
    if (booth) {
      navigator.clipboard.writeText(booth.pin);
      toast.success('PIN code copied to clipboard');
    }
  };
  const handleDeleteBooth = async () => {
    setIsDeleting(true);
    if (boothId) {
      try {
        const success = await deleteBooth(boothId);
        if (success) {
          toast.success('Booth deleted successfully');
          navigate('/dashboard');
        } else {
          toast.error('Failed to delete booth');
        }
      } catch (error) {
        console.error('Error deleting booth:', error);
        toast.error('Failed to delete booth');
      } finally {
        setIsDeleting(false);
        setDeleteDialogOpen(false);
      }
    }
  };
  if (!booth) {
    return <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
        </div>
      </Layout>;
  }
  return <Layout title={booth.name} subtitle="Booth Management" showBack>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className="tab-button">Dashboard</TabsTrigger>
          <TabsTrigger value="sell" className="tab-button">Sell</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">History</TabsTrigger>
          <TabsTrigger value="settings" className="tab-button">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booth Information</CardTitle>
                <CardDescription>View and manage your booth details.</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Booth Name</Label>
                  <Input id="name" value={booth.name} readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={booth.description || 'N/A'} readOnly />
                </div>
                
                <Separator />
                
                
              </CardContent>
            </Card>
            
            <Separator />
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                
              </AlertDialogTrigger>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your booth and all related data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteBooth} disabled={isDeleting}>
                    {isDeleting ? <>
                        Deleting...
                      </> : <>
                        Delete
                      </>}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>;
};
export default BoothSettings;