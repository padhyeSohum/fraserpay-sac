
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
import { LayoutGrid, Plus, Trash } from 'lucide-react';

interface ProductField {
  name: string;
  price: string;
}

interface CreateBoothDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooth: (
    name: string, 
    description: string, 
    customPin: string, 
    products: ProductField[]
  ) => void;
  isLoading: boolean;
}

const CreateBoothDialog: React.FC<CreateBoothDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreateBooth,
  isLoading
}) => {
  const [boothName, setBoothName] = useState('');
  const [boothDescription, setBoothDescription] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [initialProducts, setInitialProducts] = useState<Array<ProductField>>([]);

  const addProductField = () => {
    setInitialProducts([...initialProducts, { name: '', price: '' }]);
  };
  
  const updateProductField = (index: number, field: 'name' | 'price', value: string) => {
    const updatedProducts = [...initialProducts];
    updatedProducts[index][field] = value;
    setInitialProducts(updatedProducts);
  };
  
  const removeProductField = (index: number) => {
    const updatedProducts = [...initialProducts];
    updatedProducts.splice(index, 1);
    setInitialProducts(updatedProducts);
  };
  
  const handleCreate = () => {
    onCreateBooth(boothName, boothDescription, customPin, initialProducts);
  };
  
  const handleCancel = () => {
    setBoothName('');
    setBoothDescription('');
    setCustomPin('');
    setInitialProducts([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <LayoutGrid className="h-4 w-4 mr-2" />
          Create Booth
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Booth</DialogTitle>
          <DialogDescription>
            Create a new booth for the Fraser Pay system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="boothName" className="text-right">
              Booth Name
            </Label>
            <Input
              id="boothName"
              value={boothName}
              onChange={(e) => setBoothName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="boothDescription" className="text-right">
              Description
            </Label>
            <Input
              id="boothDescription"
              value={boothDescription}
              onChange={(e) => setBoothDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customPin" className="text-right">
              Custom PIN (6 digits)
            </Label>
            <Input
              id="customPin"
              type="text"
              maxLength={6}
              pattern="[0-9]*"
              value={customPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setCustomPin(value);
              }}
              className="col-span-3"
              placeholder="Leave empty for random PIN"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Products
            </Label>
            <div className="col-span-3 space-y-3">
              {initialProducts.map((product, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => updateProductField(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <div className="relative w-24">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">$</span>
                    </div>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={product.price}
                      onChange={(e) => updateProductField(index, 'price', e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeProductField(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={addProductField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Booth'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBoothDialog;
