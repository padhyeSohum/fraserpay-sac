
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/utils/format';

interface Transaction {
  id: string;
  timestamp: string;
  buyerName: string;
  boothName?: string;
  type: string;
  amount: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  searchTerm,
  onSearchChange
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">All Transactions</h3>
        <div className="w-64">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableCaption>All transactions in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Booth</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {formatDate(transaction.timestamp)}
                </TableCell>
                <TableCell>{transaction.buyerName || 'N/A'}</TableCell>
                <TableCell>{transaction.boothName || 'SAC Funds'}</TableCell>
                <TableCell>
                  {transaction.type === 'funds' ? 'Add Funds' : 'Purchase'}
                </TableCell>
                <TableCell className="text-right">
                  <span className={transaction.type === 'funds' ? 'text-green-600' : ''}>
                    ${transaction.amount.toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
