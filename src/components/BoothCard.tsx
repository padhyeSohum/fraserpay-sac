
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface BoothCardProps {
  booth: {
    id: string;
    name: string;
    description?: string;
    totalEarnings?: number;
  };
  userRole?: 'manager' | 'admin' | 'viewer';
  earnings?: number;
  onClick?: () => void;
  onRemove?: () => void;
}

const BoothCard: React.FC<BoothCardProps> = ({
  booth,
  userRole = 'viewer',
  earnings = 0,
  onClick,
  onRemove
}) => {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Card 
      className="relative overflow-hidden border border-border/50 shadow-sm cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{booth.name}</h3>
            {booth.description && (
              <p className="text-sm text-muted-foreground truncate">{booth.description}</p>
            )}
            <p className="mt-2 text-sm font-medium">
              Total Sales: ${(booth.totalEarnings || earnings).toFixed(2)}
            </p>
          </div>
          
          {onRemove && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemoveClick}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove booth"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BoothCard;
