
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Booth, CartItem } from '@/types';

interface BoothTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  findUserByStudentNumber: (studentNumber: string) => Promise<{ id: string; name: string; balance: number } | null>;
  processPurchase: (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ) => Promise<{ success: boolean, transaction?: any }>;
  userId?: string;
  userName?: string;
}

const BoothTransactionDialog: React.FC<BoothTransactionDialogProps> = ({
  isOpen,
  onOpenChange,
  booths,
  getBoothById,
  cart,
  addToCart,
  removeFromCart,
  clearCart,
  incrementQuantity,
  decrementQuantity,
  findUserByStudentNumber,
  processPurchase,
  userId,
  userName
}) => {
  const [selectedBooth, setSelectedBooth] = useState<string>('');
  const [transactionStudentNumber, setTransactionStudentNumber] = useState('');
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);

  const handleSearchStudentForTransaction = async () => {
    if (!transactionStudentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    try {
      const student = await findUserByStudentNumber(transactionStudentNumber);
      
      if (student) {
        setFoundStudent(student);
        toast.success(`Found student: ${student.name}`);
      } else {
        toast.error('No student found with that number');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Failed to find student');
    }
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
      const transaction = await processPurchase(
        booth.id,
        foundStudent.id,
        foundStudent.name,
        userId || '',
        userName || '',
        cart,
        booth.name
      );
      
      if (transaction.success) {
        clearCart();
        onOpenChange(false);
        setSelectedBooth('');
        setTransactionStudentNumber('');
        setFoundStudent(null);
        
        toast.success('Transaction completed successfully');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleCancel = () => {
    clearCart();
    onOpenChange(false);
    setSelectedBooth('');
    setTransactionStudentNumber('');
    setFoundStudent(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Booth Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Make Transaction for Booth</DialogTitle>
          <DialogDescription>
            Process a transaction on behalf of a booth
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-11rem)] pr-4">
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Booth</Label>
                <Select value={selectedBooth} onValueChange={setSelectedBooth}>
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label>Find Student</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter student number..."
                    value={transactionStudentNumber}
                    onChange={(e) => setTransactionStudentNumber(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={handleSearchStudentForTransaction}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {foundStudent && (
              <div className="bg-muted p-3 rounded-md">
                <div className="font-medium">Student: {foundStudent.name}</div>
                <div className="text-sm">Balance: ${foundStudent.balance.toFixed(2)}</div>
              </div>
            )}
            
            {selectedBooth && getBoothById(selectedBooth) && (
              <div>
                <Label className="mb-2 block">Products</Label>
                <div className="border rounded-md divide-y">
                  {getBoothById(selectedBooth)?.products.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const cartItem = cart.find(item => item.productId === product.id);
                            if (cartItem) {
                              decrementQuantity(product.id);
                            }
                          }}
                          disabled={!cart.some(item => item.productId === product.id)}
                        >
                          -
                        </Button>
                        <span>
                          {cart.find(item => item.productId === product.id)?.quantity || 0}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const cartItem = cart.find(item => item.productId === product.id);
                            if (cartItem) {
                              incrementQuantity(product.id);
                            } else {
                              addToCart(product);
                            }
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {cart.length > 0 && (
              <div>
                <Label className="mb-2 block">Cart</Label>
                <div className="border rounded-md divide-y">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center p-3">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × ${item.product.price.toFixed(2)} = ${(item.quantity * item.product.price).toFixed(2)}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="p-3 bg-muted font-medium">
                    Total: ${cart.reduce((sum, item) => sum + (item.quantity * item.product.price), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleBoothTransaction} 
            disabled={isProcessingTransaction || !selectedBooth || !foundStudent || cart.length === 0}
          >
            {isProcessingTransaction ? 'Processing...' : 'Process Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoothTransactionDialog;
