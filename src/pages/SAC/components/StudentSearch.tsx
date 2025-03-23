
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';

interface StudentSearchProps {
  onStudentFound: (student: any, qrCodeUrl: string) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentFound }) => {
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleStudentSearch = async () => {
    if (!studentSearchTerm.trim()) {
      toast.error('Please enter a student ID or name to search');
      return;
    }
    
    setIsSearching(true);
    
    try {
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
        
        const foundStudent = {
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          email: student.email,
          balance: student.tickets / 100,
          qrCode: student.qr_code
        };
        
        let qrCodeUrl = '';
        if (student.qr_code || student.id) {
          const userData = student.qr_code || encodeUserData(student.id);
          qrCodeUrl = generateQRCode(userData);
        }
        
        onStudentFound(foundStudent, qrCodeUrl);
      } else {
        toast.error('No student found with that ID, name, or email');
      }
    } catch (error) {
      console.error('Error in student search:', error);
      toast.error('Failed to search for student');
    } finally {
      setIsSearching(false);
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
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSearch;
