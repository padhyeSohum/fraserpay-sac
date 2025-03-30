import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10; // Number of transactions per page
  
  // Filter transactions based on search term and selected type
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.student_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.booth_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Sort transactions by date
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
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

  // Format currency properly - ensuring we get dollars not cents
  const formatCurrency = (amount: number) => {
    return (amount / 100).toFixed(2);
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };
  
  // Export transactions to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Student', 'Booth', 'Type', 'Amount'];
    
    const csvRows = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toISOString(),
        t.student_name || 'N/A',
        t.booth_name || 'System',
        t.type,
        formatCurrency(t.amount)
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full rounded-lg border bg-card shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <p className="text-sm text-muted-foreground">View all transactions on the platform</p>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-60"
            />
            
            <Select 
              value={selectedType} 
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="fund">Add Funds</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortDirection}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        ) : !paginatedTransactions || paginatedTransactions.length === 0 ? (
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
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell>{transaction.student_name || 'N/A'}</TableCell>
                    <TableCell>{transaction.booth_name || 'System'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 
                        transaction.type === 'fund' ? 'bg-green-100 text-green-700' : 
                        transaction.type === 'refund' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transaction.type === 'purchase' ? 'Purchase' : 
                         transaction.type === 'fund' ? 'Add Funds' : 
                         transaction.type === 'refund' ? 'Refund' :
                         transaction.type}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'fund' ? 'text-green-600' : 
                      transaction.type === 'refund' ? 'text-red-600' : 
                      'text-slate-900'
                    }`}>
                      ${formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
