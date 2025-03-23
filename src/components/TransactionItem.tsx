
import React from 'react';
import { Transaction } from '@/types';
import { formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { HelpCircle, User } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  showSupport?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showSupport = false }) => {
  const { timestamp, buyerName, studentNumber, amount, type, products } = transaction;
  
  const formattedTime = formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
  const formattedDate = new Date(timestamp).toLocaleString();
  
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
          <div className="font-medium flex items-center gap-1">
            {buyerName}
          </div>
          {studentNumber && (
            <div className="text-xs text-muted-foreground flex items-center">
              <User className="h-3 w-3 mr-1" />
              Student #: {studentNumber}
            </div>
          )}
          <div className="text-xs text-muted-foreground" title={formattedDate}>
            {formattedTime}
          </div>
          {renderProductList()}
        </div>
        
        <div className="flex flex-col items-end">
          <div className={`font-semibold text-right ${type === 'fund' ? 'text-green-600' : type === 'refund' ? 'text-red-600' : ''}`}>
            {type === 'fund' ? '+' : '-'}${amount.toFixed(2)}
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
