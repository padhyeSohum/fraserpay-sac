
import React from 'react';
import { Booth } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/format';

interface BoothCardProps {
  booth: Booth;
  userRole?: 'seller' | 'manager';
  earnings?: number;
  onClick?: () => void;
  showProductCount?: boolean;
}

const BoothCard: React.FC<BoothCardProps> = ({ 
  booth, 
  userRole,
  earnings = 0,
  onClick,
  showProductCount = false
}) => {
  const { name, description, products = [] } = booth;
  
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
        
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{description}</p>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-muted-foreground">
            {showProductCount ? `${products.length} products` : `${formatCurrency(earnings)} earned`}
          </div>
          
          {showProductCount && products.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Top: {products.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))[0].name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BoothCard;
