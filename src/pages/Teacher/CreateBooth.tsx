
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(2, { message: "Product name is required" }),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0" }),
  description: z.string().optional(),
});

const formSchema = z.object({
  boothName: z.string().min(2, { message: "Booth name is required" }),
  description: z.string().min(10, { message: "Please provide a brief description" }),
  products: z.array(productSchema).min(1, { message: "Add at least one product" }),
});

type FormValues = z.infer<typeof formSchema>;
type ProductValues = z.infer<typeof productSchema>;

const CreateBooth: React.FC = () => {
  const navigate = useNavigate();
  const { createBooth, addProductToBooth } = useTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [teacherName, setTeacherName] = useState<string>('');
  const [products, setProducts] = useState<Array<ProductValues & { id: string }>>([]);
  
  // Get the teacher name from session storage (from auth)
  useEffect(() => {
    const storedTeacherName = sessionStorage.getItem('teacherName');
    if (!storedTeacherName) {
      // If no teacher name is found, redirect to auth
      toast.error('Please authenticate first');
      navigate('/teacher/create');
      return;
    }
    setTeacherName(storedTeacherName);
  }, [navigate]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boothName: '',
      description: '',
      products: [],
    },
  });
  
  const productForm = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
    },
  });
  
  const addProduct = (data: ProductValues) => {
    const newProduct = {
      ...data,
      id: `temp_${Date.now()}`
    };
    
    setProducts(prev => [...prev, newProduct]);
    form.setValue('products', [...products, newProduct]);
    
    // Reset the product form
    productForm.reset({
      name: '',
      price: 0,
      description: '',
    });
    
    toast.success(`Added product: ${data.name}`);
  };
  
  const removeProduct = (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    form.setValue('products', updatedProducts);
  };
  
  const onSubmit = async (data: FormValues) => {
    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a random PIN (in a real app this would be more secure)
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Create the booth first
      const boothId = await createBooth(data.boothName, data.description, teacherName, pin);
      
      if (boothId) {
        // Add each product to the booth
        for (const product of products) {
          await addProductToBooth(boothId, {
            name: product.name,
            price: product.price,
            description: product.description
          });
        }
        
        toast.success('Booth created successfully!');
        navigate('/teacher/success');
      } else {
        throw new Error('Failed to create booth');
      }
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout 
      title="Create Your Booth" 
      showBack={true}
    >
      <div className="max-w-4xl mx-auto mt-8 space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <img 
            src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" 
            alt="Fraser Pay" 
            className="h-12 w-auto" 
          />
          <h1 className="text-2xl font-bold">Create Your Booth</h1>
          {teacherName && (
            <p className="text-muted-foreground">Welcome, {teacherName}</p>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Booth Information</CardTitle>
            <CardDescription>
              Provide details about your booth for the event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="boothName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Art Club Crafts" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booth Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what your booth offers..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Add the products your booth will offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Product List */}
              {products.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Added Products:</h3>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted p-2 text-xs font-medium">
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-4">Description</div>
                      <div className="col-span-1"></div>
                    </div>
                    {products.map((product) => (
                      <div key={product.id} className="grid grid-cols-12 p-3 text-sm items-center border-t">
                        <div className="col-span-5 font-medium">{product.name}</div>
                        <div className="col-span-2">${product.price.toFixed(2)}</div>
                        <div className="col-span-4 text-muted-foreground truncate">
                          {product.description || '—'}
                        </div>
                        <div className="col-span-1 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeProduct(product.id)}
                            className="h-7 w-7 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Add Product Form */}
              <div>
                <h3 className="text-sm font-medium mb-3">Add a New Product:</h3>
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(addProduct)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Cookies" {...field} />
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
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0.01" 
                                step="0.01" 
                                placeholder="0.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading || products.length === 0} 
            className="px-8"
            size="lg"
          >
            {isLoading ? "Creating Booth..." : "Submit Booth"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CreateBooth;
