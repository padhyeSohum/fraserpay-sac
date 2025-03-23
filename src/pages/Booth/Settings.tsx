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
import { User } from '@/types';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const BoothSettings = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, addProductToBooth, removeProductFromBooth } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [activeTab, setActiveTab] = useState('settings');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });
  const [boothManagers, setBoothManagers] = useState<User[]>([]);

  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
      
      if (boothData) {
        // Load booth managers
        const usersStr = localStorage.getItem('users');
        const users: User[] = usersStr ? JSON.parse(usersStr) : [];
        
        const managers = users.filter(u => boothData.managers.includes(u.id));
        setBoothManagers(managers);
      }
    }
  }, [boothId, getBoothById]);

  useEffect(() => {
    // Check if user has access to this booth
    if (user && booth && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate]);

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
    
    try {
      const success = await addProductToBooth(booth.id, {
        name: newProduct.name,
        price
      });
      
      if (success) {
        // Refresh booth data
        const boothData = getBoothById(booth.id);
        setBooth(boothData);
        
        // Reset form and close dialog
        setNewProduct({ name: '', price: '' });
        setShowAddProductDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add product');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!booth) return;
    
    try {
      const success = await removeProductFromBooth(booth.id, productId);
      
      if (success) {
        // Refresh booth data
        const boothData = getBoothById(booth.id);
        setBooth(boothData);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove product');
    }
  };

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
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
            {/* Booth Information */}
            <Card>
              <CardHeader>
                <CardTitle>Booth Information</CardTitle>
                <CardDescription>Basic details about your booth</CardDescription>
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
                    {booth.pin.replace(/./g, '•')}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Earnings</span>
                  <span className="font-medium">${booth.totalEarnings.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Products Management */}
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
                {booth.products.length > 0 ? (
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
            
            {/* Booth Managers */}
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
      
      {/* Add Product Dialog */}
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
            <Button variant="outline" onClick={() => setShowAddProductDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct}>
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default BoothSettings;
