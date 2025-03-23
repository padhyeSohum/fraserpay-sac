
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Minus, Plus, Printer, QrCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    studentNumber?: string;
    email?: string;
    balance: number;
    qrCode?: string;
  } | null;
  qrCodeUrl: string;
  onAddFunds: (studentId: string) => void;
  onRefund: (studentId: string) => void;
  onPrintQRCode: () => void;
}

const StudentDetailDialog: React.FC<StudentDetailDialogProps> = ({
  isOpen,
  onOpenChange,
  student,
  qrCodeUrl,
  onAddFunds,
  onRefund,
  onPrintQRCode
}) => {
  if (!student) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              No student selected. Please search for a student.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <ScrollArea className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View and manage student account
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="text-center mb-4">
              <div className="text-xl font-bold">{student.name || 'Unnamed Student'}</div>
              <div className="text-sm text-muted-foreground">
                {student.studentNumber ? `ID: ${student.studentNumber}` : 'No ID'}
              </div>
              <div className="text-sm text-muted-foreground">
                {student.email || 'No email'}
              </div>
              <div className="mt-2 text-lg font-medium">
                Balance: ${typeof student.balance === 'number' ? student.balance.toFixed(2) : '0.00'}
              </div>
            </div>
            
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="border p-3 rounded-md bg-white"
                  dangerouslySetInnerHTML={{ __html: qrCodeUrl }} 
                />
                <Button variant="outline" onClick={onPrintQRCode}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print QR Code
                </Button>
              </div>
            )}
            
            <div className="flex gap-2 justify-center mt-4">
              <Button 
                onClick={() => student.id && onAddFunds(student.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button 
                variant="outline" 
                onClick={() => student.id && onRefund(student.id)}
              >
                <Minus className="h-4 w-4 mr-2" />
                Refund
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailDialog;
