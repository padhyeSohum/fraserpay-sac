
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Minus, Plus, Printer } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export interface StudentDetailDialogProps {
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
  onPrintQRCode?: () => void;
}

const StudentDetailDialog: React.FC<StudentDetailDialogProps> = ({
  isOpen,
  onOpenChange,
  student,
  qrCodeUrl,
  onAddFunds,
  onRefund,
  onPrintQRCode = () => toast.info("Print QR code functionality not implemented")
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

  const handlePrintQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window. Please check your popup blocker settings.');
      return;
    }

    const studentInfo = student.name || 'Student';
    const studentId = student.studentNumber || '';
    
    // Create content for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${studentInfo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 400px;
          }
          .student-info {
            margin-bottom: 20px;
          }
          .qr-code {
            margin: 20px 0;
          }
          h1 {
            margin-bottom: 5px;
          }
          @media print {
            body {
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="student-info">
            <h1>${studentInfo}</h1>
            ${studentId ? `<p>Student ID: ${studentId}</p>` : ''}
            <p>Balance: $${typeof student.balance === 'number' ? student.balance.toFixed(2) : '0.00'}</p>
          </div>
          <div class="qr-code">
            ${student.qrCode ? 
              `<div id="qrcode"></div>` : 
              `<p>No QR code available</p>`
            }
          </div>
          <button onclick="window.print(); window.close();">Print QR Code</button>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <script>
          if (document.getElementById('qrcode')) {
            QRCode.toCanvas(
              document.getElementById('qrcode'), 
              "${student.qrCode || ''}",
              { width: 300, margin: 2 },
              function(error) {
                if (error) console.error(error);
              }
            );
          }
          setTimeout(() => {
            window.print();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

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
                {qrCodeUrl.startsWith('http') ? (
                  <div className="border p-3 rounded-md bg-white">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      width={200} 
                      height={200} 
                      className="max-w-full" 
                    />
                  </div>
                ) : (
                  <div className="border p-3 rounded-md bg-white">
                    <QRCodeSVG 
                      value={student.qrCode || student.id} 
                      size={200} 
                    />
                  </div>
                )}
                <Button variant="outline" onClick={handlePrintQRCode}>
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
