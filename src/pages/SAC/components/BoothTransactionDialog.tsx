import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { processPurchase } from '@/contexts/transactions/transactionService';

interface BoothTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booths: any[];
  getBoothById: (id: string) => any;
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
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  
  const clearCart = () => setCart([]);
  
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
      const result = await processPurchase(
        booth.id,
        foundStudent.id,
        foundStudent.name,
        userId || '',
        userName || '',
        cart,
        booth.name
      );
      
      if (result.success) {
        // Ensure the UI refreshes with the updated balance
        // Fetch the latest user data directly from Supabase
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
        onOpenChange(false);
        setSelectedBooth('');
        setTransactionStudentNumber('');
        setFoundStudent(null);
        
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
  
  // Rest of the component...
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Process Booth Transaction</DialogTitle>
        </DialogHeader>
        
        {/* Dialog content would go here */}
        
        <DialogFooter>
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
