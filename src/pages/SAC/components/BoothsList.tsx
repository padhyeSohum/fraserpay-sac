
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Booth } from '@/types';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTransactions } from '@/contexts/transactions';

interface BoothsListProps {
  booths: Booth[];
  isLoading?: boolean;
  onRemoveBooth?: (boothId: string) => Promise<boolean>;
  showRemoveButton?: boolean;
}

const BoothsList: React.FC<BoothsListProps> = ({ 
  booths = [],
  isLoading = false,
  onRemoveBooth,
  showRemoveButton = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [removingBoothId, setRemovingBoothId] = useState<string | null>(null);
  const { removeBoothFromUser } = useTransactions();

  const togglePinVisibility = (boothId: string) => {
    setShowPins(prev => ({
      ...prev,
      [boothId]: !prev[boothId]
    }));
  };

  const handleRemoveBooth = async (boothId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (removingBoothId) return; // Prevent multiple clicks
    
    try {
      setRemovingBoothId(boothId);
      
      if (onRemoveBooth) {
        const success = await onRemoveBooth(boothId);
        if (success) {
          toast.success("Booth removed successfully");
        } else {
          toast.error("Failed to remove booth");
        }
      } else if (removeBoothFromUser) {
        const success = await removeBoothFromUser(boothId);
        if (success) {
          toast.success("Booth removed from your dashboard");
        } else {
          toast.error("Failed to remove booth");
        }
      }
    } catch (error) {
      console.error("Error removing booth:", error);
      toast.error("Failed to remove booth");
    } finally {
      setRemovingBoothId(null);
    }
  };

  const filteredBooths = booths.filter(booth => 
    booth.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Booths</CardTitle>
        <CardDescription>All active booths with their access PINs</CardDescription>
        <div className="mt-2">
          <Input
            placeholder="Search booths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooths.length === 0 ? (
              <p className="text-muted-foreground">No booths found</p>
            ) : (
              filteredBooths.map((booth) => (
                <div 
                  key={booth.id} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{booth.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{booth.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <span className="text-sm font-medium">PIN:</span>
                      {showPins[booth.id] ? (
                        <span className="font-mono">{booth.pin}</span>
                      ) : (
                        <span className="font-mono">••••••</span>
                      )}
                    </div>
                    <button
                      onClick={() => togglePinVisibility(booth.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPins[booth.id] ? "Hide PIN" : "Show PIN"}
                    >
                      {showPins[booth.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    
                    {showRemoveButton && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleRemoveBooth(booth.id, e)}
                        disabled={removingBoothId === booth.id}
                        aria-label="Remove booth"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoothsList;
