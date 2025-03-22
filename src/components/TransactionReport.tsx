
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { CalendarIcon, Download } from 'lucide-react';
import { Transaction } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TransactionReportProps {
  transactions: Transaction[];
}

const TransactionReport: React.FC<TransactionReportProps> = ({ transactions }) => {
  const [date, setDate] = useState<Date>(new Date());

  const filterTransactionsByDate = (date: Date) => {
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      return transactionDate >= selectedDate && transactionDate < nextDay;
    });
  };

  const generatePDF = () => {
    try {
      const filteredTransactions = filterTransactionsByDate(date);
      
      if (filteredTransactions.length === 0) {
        toast.error('No transactions found for the selected date');
        return;
      }
      
      // Create a new PDF document
      const doc = new jsPDF();
      const dateStr = format(date, 'MMMM d, yyyy');
      
      // Add title
      doc.setFontSize(18);
      doc.text(`Daily Transaction Report: ${dateStr}`, 14, 22);
      
      // Add transaction summary
      let totalPurchases = 0;
      let totalFunds = 0;
      
      filteredTransactions.forEach(transaction => {
        if (transaction.type === 'purchase') {
          totalPurchases += transaction.amount;
        } else if (transaction.type === 'fund') {
          totalFunds += transaction.amount;
        }
      });
      
      doc.setFontSize(12);
      doc.text(`Total Purchases: $${totalPurchases.toFixed(2)}`, 14, 35);
      doc.text(`Total Funds Added: $${totalFunds.toFixed(2)}`, 14, 42);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 49);
      
      // Create transaction table
      const tableColumn = [
        'Time', 
        'Type', 
        'Buyer', 
        'Description',
        'Amount'
      ];
      
      const tableRows = filteredTransactions.map(transaction => {
        const time = format(new Date(transaction.timestamp), 'h:mm a');
        const type = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        let description = '';
        
        if (transaction.type === 'purchase') {
          description = `Purchase at ${transaction.boothName || 'Unknown Booth'}`;
        } else if (transaction.type === 'fund') {
          description = 'Added funds to account';
        } else {
          description = transaction.type;
        }
        
        return [
          time,
          type,
          transaction.buyerName,
          description,
          `$${transaction.amount.toFixed(2)}`
        ];
      });
      
      // @ts-ignore - jspdf-autotable is added to jsPDF prototype
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 66, 66], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Save the PDF
      doc.save(`transaction-report-${format(date, 'yyyy-MM-dd')}.pdf`);
      toast.success('Transaction report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate transaction report');
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row items-center justify-between">
            <h3 className="font-medium">Daily Transaction Report</h3>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="default" 
                size="icon"
                onClick={generatePDF}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              Generate and download a daily report of all transactions for the selected date.
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Transactions on {format(date, 'MMMM d, yyyy')}:</span>
            <span className="font-semibold">{filterTransactionsByDate(date).length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionReport;
