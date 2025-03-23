
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format';

export interface TransactionsTableProps {
  transactions: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions = [],
  searchTerm = "",
  onSearchChange = () => {},
  isLoading = false
}) => {
  // Format date helper that handles strings or Date objects
  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'N/A';
    
    try {
      // If it's a string date, convert to Date object
      const date = typeof dateValue === 'string' 
        ? new Date(dateValue) 
        : dateValue;
      
      // Verify it's a valid date before formatting
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="max-w-xs w-full">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      ) : !transactions || transactions.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Booth</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell>{transaction.student_name || 'N/A'}</TableCell>
                  <TableCell>{transaction.booth_name || 'System'}</TableCell>
                  <TableCell>
                    {transaction.type === 'purchase' ? 'Purchase' : 
                     transaction.type === 'fund' ? 'Add Funds' : 
                     transaction.type === 'refund' ? 'Refund' :
                     transaction.type}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(transaction.amount / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
