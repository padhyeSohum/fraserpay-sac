import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MinusCircle, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { processPurchase } from '@/contexts/transactions/transactionService';
import { CartItem, Product } from '@/types';

interface BoothTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booths: any[];
  getBoothById: (id: string) => any;
}

interface LocalCartItem {
  product: Product;
  quantity: number;
  productId: string;
}

const BoothTransactionDialog: React.FC<BoothTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  booths,
  getBoothById
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const userName = user?.name;
  
  const [selectedBooth, setSelectedBooth] = useState('');
  const [transactionStudentNumber, setTransactionStudentNumber] = useState('');
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    if (!isOpen) {
      setSelectedBooth('');
      setTransactionStudentNumber('');
      setFoundStudent(null);
      setCart([]);
    }
  }, [isOpen]);
  
  const clearCart = () => setCart([]);
  
  const handleBoothChange = (value: string) => {
    setSelectedBooth(value);
    
    setCart([]);
  };
  
  const findStudentByNumber = async () => {
    if (!transactionStudentNumber.trim()) {
      toast.error('Please enter a student number');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_number', transactionStudentNumber)
        .single();
      
      if (error) {
        console.error('Error finding student:', error);
        toast.error('Student not found');
        return;
      }
      
      if (data) {
        setFoundStudent({
          id: data.id,
          name: data.name,
          studentNumber: data.student_number,
          balance: data.tickets / 100
        });
        toast.success(`Found student: ${data.name}`);
      } else {
        toast.error('Student not found');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Error finding student');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        product: product,
        quantity: 1,
        productId: product.id
      }]);
    }
  };
  
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => 
      total + (item.product.price * item.quantity), 0
    );
  };
  
  const handleBoothTransaction = async () => {
    if (!selectedBooth) {
      toast.error('Please select a booth');
      return;
    }
    
    if (!foundStudent) {
      toast.error('Please find a student first');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }
    
    const booth = getBoothById(selectedBooth);
    if (!booth) {
      toast.error('Selected booth not found');
      return;
    }
    
    setIsProcessingTransaction(true);
    
    try {
      const cartItems: CartItem[] = cart.map(item => ({
        productId: item.product.id,
        product: item.product,
        quantity: item.quantity
      }));
      
      const result = await processPurchase(
        booth.id,
        foundStudent.id,
        foundStudent.name,
        userId || '',
        userName || '',
        cartItems,
        booth.name
      );
      
      if (result.success) {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', foundStudent.id)
          .single();
        
        if (!error && updatedUser) {
          setFoundStudent({
            ...foundStudent,
            balance: updatedUser.tickets / 100
          });
          
          console.log('Updated student balance after transaction:', updatedUser.tickets / 100);
        }
        
        clearCart();
        toast.success('Transaction completed successfully');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessingTransaction(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Process Booth Transaction</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="booth">Select Booth</Label>
              <Select 
                value={selectedBooth} 
                onValueChange={handleBoothChange}
              >
                <SelectTrigger id="booth">
                  <SelectValue placeholder="Select a booth" />
                </SelectTrigger>
                <SelectContent>
                  {booths.map(booth => (
                    <SelectItem key={booth.id} value={booth.id}>
                      {booth.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="studentNumber">Student Number</Label>
              <div className="flex gap-2">
                <Input
                  id="studentNumber"
                  value={transactionStudentNumber}
                  onChange={(e) => setTransactionStudentNumber(e.target.value)}
                  placeholder="Enter student number"
                  disabled={!selectedBooth}
                />
                <Button 
                  variant="outline" 
                  onClick={findStudentByNumber}
                  disabled={!selectedBooth || isSearching || !transactionStudentNumber.trim()}
                >
                  {isSearching ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {foundStudent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Student Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Name:</strong> {foundStudent.name}</p>
                  <p><strong>ID:</strong> {foundStudent.studentNumber}</p>
                  <p><strong>Balance:</strong> ${foundStudent.balance.toFixed(2)}</p>
                </CardContent>
              </Card>
            )}
            
            {selectedBooth && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {booths.find(b => b.id === selectedBooth)?.products?.length > 0 ? (
                    <div className="space-y-2">
                      {booths.find(b => b.id === selectedBooth)?.products.map((product: any) => (
                        <div key={product.id} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No products available for this booth</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cart</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length > 0 ? (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${item.product.price.toFixed(2)} × {item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusCircle className="h-3 w-3" />
                          </Button>
                          <span className="w-4 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <PlusCircle className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No items in cart</p>
                )}
              </CardContent>
            </Card>
            
            {foundStudent && cart.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Balance before:</span>
                      <span>${foundStudent.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total purchase:</span>
                      <span>-${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Remaining balance:</span>
                      <span className={foundStudent.balance < getCartTotal() ? 'text-destructive' : ''}>
                        ${(foundStudent.balance - getCartTotal()).toFixed(2)}
                      </span>
                    </div>
                    
                    {foundStudent.balance < getCartTotal() && (
                      <p className="text-destructive text-sm">
                        Warning: Student doesn't have enough balance for this purchase.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBoothTransaction}
            disabled={isProcessingTransaction || !foundStudent || cart.length === 0}
          >
            {isProcessingTransaction ? 'Processing...' : 'Complete Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoothTransactionDialog;
