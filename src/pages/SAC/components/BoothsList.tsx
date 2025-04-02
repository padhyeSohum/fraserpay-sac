
import React, { useState } from 'react';
import BoothCard from '@/components/BoothCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, School } from 'lucide-react';
import CreateBoothDialog from './CreateBoothDialog';
import PendingBoothsDialog from './PendingBoothsDialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/transactions';
import { Booth } from '@/types';

const BoothsList = () => {
  const { booths, deleteBooth } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Filter booths based on search term
  const filteredBooths = booths.filter(booth => 
    booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booth.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle booth deletion
  const handleDeleteBooth = async (boothId: string) => {
    if (window.confirm('Are you sure you want to delete this booth? This action cannot be undone.')) {
      const success = await deleteBooth(boothId);
      
      if (success) {
        toast.success('Booth deleted successfully');
      } else {
        toast.error('Failed to delete booth');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search booths..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsPendingDialogOpen(true)}
          >
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">Teacher</span> Requests
            <Badge variant="secondary" className="ml-1">
              {/* Count could be fetched from context in a real implementation */}
              New
            </Badge>
          </Button>
          
          <Button
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span> Booth
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBooths.map((booth: Booth) => (
          <BoothCard
            key={booth.id}
            booth={booth}
            onClick={() => navigate(`/booth/${booth.id}`)}
            onRemove={handleDeleteBooth}
            showProductCount={true}
          />
        ))}
        
        {filteredBooths.length === 0 && (
          <div className="col-span-full py-10 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'No booths match your search.' : 'No booths available.'}
            </p>
          </div>
        )}
      </div>
      
      <CreateBoothDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
      
      <PendingBoothsDialog
        open={isPendingDialogOpen}
        onOpenChange={setIsPendingDialogOpen}
      />
    </div>
  );
};

export default BoothsList;
