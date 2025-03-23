
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export interface CreateBoothDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooth: (boothData: { name: string; description: string }) => Promise<void>;
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

  const handleCreateBooth = async () => {
    if (!boothName.trim()) {
      toast.error('Please enter a booth name');
      return;
    }

    try {
      await onCreateBooth({
        name: boothName,
        description: boothDescription
      });
      
      // Reset form
      setBoothName('');
      setBoothDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
