
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Product } from '@/types';

export interface CreateBoothDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooth: (boothData: { 
    name: string; 
    description: string; 
    pin: string;
    products: Omit<Product, 'id' | 'boothId' | 'salesCount'>[];
  }) => Promise<void>;
  isLoading: boolean;
}

const CreateBoothDialog: React.FC<CreateBoothDialogProps> = ({
  isOpen = false,
  onOpenChange = () => {},
  onCreateBooth = async () => {},
  isLoading = false
}) => {
  const [boothName, setBoothName] = useState('');
  const [boothDescription, setBoothDescription] = useState('');
  const [boothPin, setBoothPin] = useState('');
  const [products, setProducts] = useState<{ name: string; price: number; image?: string }[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setBoothPin(pin);
  };

  const handleAddProduct = () => {
    if (!productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setProducts([...products, { name: productName, price }]);
    setProductName('');
    setProductPrice('');
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleCreateBooth = async () => {
    if (!boothName.trim()) {
      toast.error('Please enter a booth name');
      return;
    }

    if (!boothPin || boothPin.length !== 6 || !/^\d+$/.test(boothPin)) {
      toast.error('Please enter a valid 6-digit PIN');
      return;
    }

    try {
      await onCreateBooth({
        name: boothName,
        description: boothDescription,
        pin: boothPin,
        products
      });
      
      // Reset form
      setBoothName('');
      setBoothDescription('');
      setBoothPin('');
      setProducts([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booth</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={boothName}
              onChange={(e) => setBoothName(e.target.value)}
              className="col-span-3"
              placeholder="Enter booth name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={boothDescription}
              onChange={(e) => setBoothDescription(e.target.value)}
              className="col-span-3"
              placeholder="Enter booth description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">
              PIN Code
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="pin"
                value={boothPin}
                onChange={(e) => setBoothPin(e.target.value)}
                className="flex-1"
                placeholder="6-digit PIN"
                maxLength={6}
              />
              <Button 
                type="button" 
                onClick={generateRandomPin}
                variant="outline"
                size="sm"
              >
                Generate
              </Button>
            </div>
          </div>
          
          <div className="border-t my-2 pt-4">
            <h3 className="font-medium mb-2">Products</h3>
            
            <div className="space-y-2">
              {products.map((product, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <div className="flex-1">
                    {product.name} - ${product.price.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveProduct(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2 mt-4">
              <Label htmlFor="productName" className="text-right">
                Name
              </Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="col-span-3"
                placeholder="Product name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2 mt-2">
              <Label htmlFor="productPrice" className="text-right">
                Price ($)
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="productPrice"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="flex-1"
                  placeholder="0.00"
                  type="number"
                  min="0.01"
                  step="0.01"
                />
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleCreateBooth} 
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Booth'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoothDialog;
