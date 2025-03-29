
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { User } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const BoothSettings = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, addProductToBooth, removeProductFromBooth, deleteBooth, fetchAllBooths } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('settings');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [boothManagers, setBoothManagers] = useState<User[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Function to fetch the latest booth data
  const refreshBoothData = async () => {
    if (!boothId) return;
    
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      // Force refresh booths data from Firestore
      await fetchAllBooths();
      
      // Now get the updated booth
      const updatedBooth = getBoothById(boothId);
      console.log('Refreshed booth data:', updatedBooth);
      
      if (updatedBooth) {
        setBooth(updatedBooth);
        
        const usersStr = localStorage.getItem('users');
        const users: User[] = usersStr ? JSON.parse(usersStr) : [];
        
        const managers = users.filter(u => updatedBooth.managers.includes(u.id));
        setBoothManagers(managers);
        setIsLoading(false);
      } else {
        setLoadError("Booth not found. It may have been deleted.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error refreshing booth data:', error);
      setLoadError("Failed to load booth data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (boothId) {
      refreshBoothData();
    }
  }, [boothId, getBoothById]);

  useEffect(() => {
    if (!isLoading && user && booth && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate, isLoading]);

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

  const handleAddProduct = async () => {
    if (!booth || !newProduct.name || !newProduct.price) {
      toast.error('Please enter product name and price');
      return;
    }
    
    const price = parseFloat(newProduct.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setIsAddingProduct(true);
    
    try {
      console.log('Adding product to booth:', { boothId: booth.id, product: newProduct });
      const success = await addProductToBooth(booth.id, {
        name: newProduct.name,
        price
      });
      
      if (success) {
        // Force refresh the booth data after adding a product
        await refreshBoothData();
        
        setNewProduct({ name: '', price: '' });
        setShowAddProductDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add product');
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!booth) return;
    
    try {
      const success = await removeProductFromBooth(booth.id, productId);
      
      if (success) {
        // Force refresh the booth data after removing a product
        await refreshBoothData();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove product');
    }
  };

  const handleDeleteBooth = async () => {
    if (!booth) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deleteBooth(booth.id);
      
      if (success) {
        toast.success('Booth deleted successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting booth:', error);
      toast.error('Failed to delete booth');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Loading Booth..." showBack>
        <div className="text-center py-10">
          <div className="animate-pulse">
            <p className="text-muted-foreground">Loading booth information...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout title="Error" showBack>
        <div className="text-center py-10">
          <p className="text-destructive">{loadError}</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={booth.name} 
      subtitle="Booth Management" 
      showBack
    >
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Booth Information</CardTitle>
                  <CardDescription>Basic details about your booth</CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Booth
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Booth Name</span>
                  <span className="font-medium">{booth.name}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium">{booth.description || 'No description'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">PIN</span>
                  <span className="font-medium">
                    {booth.pin?.replace(/./g, '•') || '••••••'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="font-medium">${(booth.totalEarnings || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage your booth's products</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddProductDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                {booth.products && booth.products.length > 0 ? (
                  <div className="space-y-2">
                    {booth.products.map(product => (
                      <div key={product.id} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No products added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Booth Managers</CardTitle>
                <CardDescription>Users who can manage this booth</CardDescription>
              </CardHeader>
              <CardContent>
                {boothManagers.length > 0 ? (
                  <div className="space-y-2">
                    {boothManagers.map(manager => (
                      <div key={manager.id} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                        <div>
                          <div className="font-medium">{manager.name}</div>
                          <div className="text-sm text-muted-foreground">{manager.studentNumber}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No managers assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new product to your booth
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g., Pizza Slice"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (CAD)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground">$</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddProductDialog(false)}
              disabled={isAddingProduct}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct}
              disabled={isAddingProduct}
            >
              {isAddingProduct ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booth</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booth? This action cannot be undone.
              All products and booth data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBooth}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Deleting...
                </>
              ) : (
                'Delete Booth'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default BoothSettings;
