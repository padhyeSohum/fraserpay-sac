
import React from 'react';
import { Booth } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BoothCardProps {
  booth: Booth;
  userRole?: 'seller' | 'manager';
  earnings?: number;
  onClick?: () => void;
}

const BoothCard: React.FC<BoothCardProps> = ({ 
  booth, 
  userRole,
  earnings = 0,
  onClick 
}) => {
  const { name } = booth;
  
  return (
    <Card 
      className="border border-border/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-medium">
              {name.charAt(0)}
            </div>
            <h3 className="font-medium">{name}</h3>
          </div>
          
          {userRole && (
            <Badge variant="secondary" className="text-xs capitalize">
              {userRole}
            </Badge>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mt-2">
          ${earnings.toFixed(2)} earned
        </div>
      </CardContent>
    </Card>
  );
};

export default BoothCard;
