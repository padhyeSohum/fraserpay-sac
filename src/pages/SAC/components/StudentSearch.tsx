
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { encodeUserData, generateQRCode, getUserFromQRData } from '@/utils/qrCode';
import QRCodeScanner from '@/components/QRCodeScanner';

interface StudentSearchProps {
  onStudentFound: (student: any, qrCodeUrl: string) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentFound }) => {
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Add state to prevent duplicate processing

  const handleStudentSearch = async () => {
    if (!studentSearchTerm.trim()) {
      toast.error('Please enter a student ID or name to search');
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('Searching for student:', studentSearchTerm);
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .or(`student_number.ilike.%${studentSearchTerm}%,name.ilike.%${studentSearchTerm}%,email.ilike.%${studentSearchTerm}%`)
        .limit(1);
      
      if (error) {
        console.error('Error searching for student:', error);
        toast.error('Error searching for student');
        setIsSearching(false);
        return;
      }
      
      if (userData && userData.length > 0) {
        const student = userData[0];
        console.log('Found student:', student);
        
        const foundStudent = {
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          email: student.email,
          balance: student.tickets / 100,
          qrCode: student.qr_code
        };
        
        // Generate QR code
        let qrCodeData = student.qr_code || encodeUserData(student.id);
        console.log('Generating QR code with data:', qrCodeData);
        let qrCodeSvg = generateQRCode(qrCodeData);
        
        // Update the user's QR code if needed
        if (!student.qr_code) {
          console.log('Updating user QR code in Supabase');
          await supabase
            .from('users')
            .update({ qr_code: qrCodeData })
            .eq('id', student.id);
        }
        
        onStudentFound(foundStudent, qrCodeSvg);
      } else {
        console.log('No student found with search term:', studentSearchTerm);
        toast.error('No student found with that ID, name, or email');
      }
    } catch (error) {
      console.error('Error in student search:', error);
      toast.error('Failed to search for student');
    } finally {
      setIsSearching(false);
    }
  };

  const handleScanQRCode = () => {
    setIsScanning(true);
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    console.log('QR code scanned with data:', decodedText);
    
    // Prevent duplicate processing
    if (isProcessing) {
      console.log('Already processing a QR code, ignoring duplicate scan');
      return;
    }
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      const userData = await getUserFromQRData(decodedText);
      
      if (userData) {
        const foundStudent = {
          id: userData.id,
          name: userData.name,
          studentNumber: userData.student_number,
          email: userData.email,
          balance: userData.tickets / 100,
          qrCode: userData.qr_code || decodedText
        };
        
        // Generate QR code SVG
        let qrCodeSvg = generateQRCode(decodedText);
        
        // If user doesn't have a QR code saved, update it
        if (!userData.qr_code) {
          await supabase
            .from('users')
            .update({ qr_code: decodedText })
            .eq('id', userData.id);
        }
        
        toast.success(`Found student: ${userData.name}`);
        onStudentFound(foundStudent, qrCodeSvg);
      } else {
        toast.error('Invalid QR code or student not found');
      }
    } catch (error) {
      console.error('Error processing scanned QR code:', error);
      toast.error('Error processing QR code');
    } finally {
      // Reset processing state after a short delay
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Student Search</CardTitle>
        <CardDescription>
          Find a student to view their details or manage their account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <QRCodeScanner 
            onScan={handleQRCodeScanned} 
            onClose={() => setIsScanning(false)}
          />
        ) : (
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by student ID, name, or email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
              />
            </div>
            <Button onClick={handleStudentSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleScanQRCode} disabled={isScanning || isProcessing}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentSearch;
