
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import ProductItem from '@/components/ProductItem';
import { CartItem, Product } from '@/types';
import { Scan, X, Check } from 'lucide-react';
import { validateQRCode } from '@/utils/qrCode';
import { toast } from 'sonner';

const BoothSell = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, processPurchase } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [customer, setCustomer] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [activeTab, setActiveTab] = useState('sell');
  
  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
    }
  }, [boothId, getBoothById]);

  useEffect(() => {
    // Check if user has access to this booth
    if (user && booth && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate]);

  const handleProductSelect = (product: Product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Increment quantity
      const updatedCart = cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, { productId: product.id, product, quantity: 1 }]);
    }
  };

  const handleDecrement = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrement quantity
      const updatedCart = cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
      setCart(updatedCart);
    } else {
      // Remove item from cart
      const updatedCart = cart.filter(item => item.productId !== productId);
      setCart(updatedCart);
    }
  };

  const handleIncrement = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      // Increment quantity
      const updatedCart = cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
      setCart(updatedCart);
    }
  };

  const handleScanQR = () => {
    setScanning(true);
    
    // For demo purposes, we'll simulate scanning a QR code
    setTimeout(() => {
      // Get a random user from localStorage
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      if (users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        setCustomer({
          id: randomUser.id,
          name: randomUser.name,
          balance: randomUser.balance
        });
      } else {
        // Create a demo customer if no users found
        setCustomer({
          id: 'demo123',
          name: 'Demo Customer',
          balance: 50.0
        });
      }
      
      setScanning(false);
    }, 1500);
  };

  const handleConfirmPurchase = async () => {
    if (!customer || !booth || !user) {
      toast.error('Missing customer or booth information');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    if (customer.balance < total) {
      toast.error('Customer has insufficient balance');
      return;
    }
    
    try {
      const success = await processPurchase(
        booth.id,
        customer.id,
        customer.name,
        user.id,
        user.name,
        cart,
        booth.name
      );
      
      if (success) {
        // Clear cart and customer after successful purchase
        setCart([]);
        
        // Add a delay before clearing customer to allow them to see the success message
        setTimeout(() => {
          setCustomer(null);
        }, 5000);
        
        toast.success(`Purchase of $${total.toFixed(2)} completed successfully`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to process purchase');
    }
  };

  const handleCancelSale = () => {
    // Clear cart and customer
    setCart([]);
    setCustomer(null);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'dashboard') {
      navigate(`/booth/${boothId}`);
    } else if (value === 'transactions') {
      navigate(`/booth/${boothId}/transactions`);
    } else if (value === 'settings') {
      navigate(`/booth/${boothId}/settings`);
    }
  };

  // Calculate total
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
          <Button 
            variant="link" 
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
        
        <TabsContent value="sell" className="animate-fade-in mt-6">
          <div className="space-y-6">
            {/* Customer Info (after scanning) */}
            {customer && (
              <Card className="border-border/50 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">Student ID: {customer.id}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Balance</div>
                      <div className="text-lg font-semibold text-green-600">${customer.balance.toFixed(2)}</div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleCancelSale}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Products List or Scan QR code */}
            {!customer ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Scan className="h-10 w-10 text-muted-foreground" />
                </div>
                
                <p className="text-muted-foreground mb-6">
                  {scanning ? "Scanning..." : "Scan customer's QR code to begin"}
                </p>
                
                <Button 
                  onClick={handleScanQR} 
                  disabled={scanning}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {scanning ? "Scanning..." : "Simulate Scan"}
                </Button>
              </div>
            ) : (
              <>
                {/* Product List */}
                <div className="space-y-3">
                  <h3 className="font-medium">Select Products</h3>
                  
                  {booth.products.map(product => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      quantity={cart.find(item => item.productId === product.id)?.quantity || 0}
                      onIncrement={() => handleProductSelect(product)}
                      onDecrement={() => handleDecrement(product.id)}
                      selectable
                    />
                  ))}
                </div>
                
                {/* Cart Summary */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border/50 shadow-lg">
                  <div className="flex justify-between items-center mb-2 max-w-md mx-auto">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Items</div>
                      <div className="font-medium">{totalItems} items</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Amount</div>
                      <div className="text-xl font-bold">${totalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleConfirmPurchase}
                    disabled={cart.length === 0}
                    className="w-full max-w-md mx-auto bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Confirm Purchase
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default BoothSell;
