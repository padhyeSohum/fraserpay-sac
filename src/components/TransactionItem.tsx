
import React from 'react';
import { Transaction } from '@/types';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface TransactionItemProps {
  transaction: Transaction;
  showSupport?: boolean;
  showBooth?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  showSupport = false,
  showBooth = false 
}) => {
  const { timestamp, buyerName, amount, type, products, boothName } = transaction;
  
  // Ensure timestamp is valid - default to current time if invalid
  const validTimestamp = timestamp && !isNaN(timestamp) ? timestamp : Date.now();
  
  const formattedTime = formatDistance(new Date(validTimestamp), new Date(), { addSuffix: true });
  const formattedDate = new Date(validTimestamp).toLocaleString();
  
  // Use the formatCurrency utility consistently for all transaction types
  // This ensures proper formatting regardless of source
  const displayAmount = formatCurrency(amount);
  
  const renderProductList = () => {
    if (!products || products.length === 0) return null;
    
    return (
      <div className="text-sm text-muted-foreground">
        {products.map((product, index) => (
          <span key={`${product.productId}-${index}`}>
            {product.productName} {product.quantity > 1 ? `(${product.quantity})` : ''}
            {index < products.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border/50 p-4 mb-3 animate-fade-in-scale">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{buyerName || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground" title={formattedDate}>
            {formattedTime}
          </div>
          {showBooth && boothName && (
            <div className="text-xs text-muted-foreground mt-1">
              Booth: {boothName}
            </div>
          )}
          {renderProductList()}
        </div>
        
        <div className="flex flex-col items-end">
          <div className="font-semibold text-right">
            {type === 'fund' ? '+' : '-'}{displayAmount}
          </div>
          
          {showSupport && (
            <Button variant="ghost" size="sm" className="text-xs px-2 py-0 h-6 mt-1 text-muted-foreground hover:text-primary">
              <HelpCircle className="h-3 w-3 mr-1" />
              Support
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
