
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
import { AlertCircle, Copy, Trash, Plus, Package } from 'lucide-react';
import { Product } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import ProductItem from '@/components/ProductItem';

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
    deleteBooth,
    addProductToBooth,
    removeProductFromBooth,
  } = useTransactions();
  const navigate = useNavigate();
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [activeTab, setActiveTab] = useState('settings');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productForm = useForm({
    defaultValues: {
      name: '',
      price: '',
      description: '',
    }
  });

  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
      if (boothData && boothData.products) {
        setProducts(boothData.products);
      }
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

  const handleAddProduct = async (data: { name: string; price: string; description: string }) => {
    setIsSubmitting(true);
    
    try {
      if (!boothId) {
        toast.error('Booth ID is missing');
        return;
      }
      
      const priceValue = parseFloat(data.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Please enter a valid price');
        return;
      }
      
      const newProduct = {
        name: data.name,
        price: priceValue,
        description: data.description || '',
      };
      
      const success = await addProductToBooth(boothId, newProduct);
      
      if (success) {
        toast.success('Product added successfully');
        productForm.reset();
        
        // Refresh booth data to get updated products
        const updatedBooth = getBoothById(boothId);
        setBooth(updatedBooth);
        if (updatedBooth && updatedBooth.products) {
          setProducts(updatedBooth.products);
        }
        
        setAddProductDialogOpen(false);
      } else {
        toast.error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('An error occurred while adding the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      if (!boothId) {
        toast.error('Booth ID is missing');
        return;
      }
      
      const success = await removeProductFromBooth(boothId, productId);
      
      if (success) {
        toast.success('Product removed successfully');
        
        // Refresh booth data to get updated products
        const updatedBooth = getBoothById(boothId);
        setBooth(updatedBooth);
        if (updatedBooth && updatedBooth.products) {
          setProducts(updatedBooth.products);
        }
      } else {
        toast.error('Failed to remove product');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('An error occurred while removing the product');
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Products</CardTitle>
                  <CardDescription>Manage products for this booth.</CardDescription>
                </div>
                <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="ml-auto">
                      <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new product.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...productForm}>
                      <form onSubmit={productForm.handleSubmit(handleAddProduct)} className="space-y-4">
                        <FormField
                          control={productForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter product name" required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01" 
                                  min="0.01" 
                                  placeholder="0.00" 
                                  required 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter product description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setAddProductDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Product'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              
              <CardContent>
                {products && products.length > 0 ? (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-500" />
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">
                              ${product.price.toFixed(2)}
                              {product.description && ` - ${product.description}`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Remove product"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No products added yet</p>
                    <p className="text-sm">Add products to start selling</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Separator />
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash className="mr-2 h-4 w-4" /> Delete Booth
                </Button>
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
