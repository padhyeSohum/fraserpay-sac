
import React from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';

interface ProductItemProps {
  product: Product;
  quantity?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  quantity = 0,
  onIncrement,
  onDecrement,
  onClick,
  selectable = false,
  selected = false
}) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 mb-3 ${
        selected ? 'border-2 border-brand-500 shadow-md' : 'border border-border/50'
      } ${selectable ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={selectable ? handleClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
          </div>
          
          {onIncrement && onDecrement ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement();
                }}
                disabled={quantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span className="w-6 text-center">{quantity}</span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItem;
