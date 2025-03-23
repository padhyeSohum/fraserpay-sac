import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, Store as StoreIcon, Users as UsersIcon, FileText as FileTextIcon, Settings as SettingsIcon, Home as HomeIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CreateBoothDialog from './components/CreateBoothDialog';
import FundsDialog from './components/FundsDialog';
import StudentDetailDialog from './components/StudentDetailDialog';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { Settings } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [createBoothOpen, setCreateBoothOpen] = useState(false);
  const [fundsDialogOpen, setFundsDialogOpen] = useState(false);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState('');
  const [studentId, setStudentId] = useState('');

  const { data: students, refetch: refetchStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students')
      .then(res => res.data)
      .catch(err => {
        toast.error('Failed to fetch students.');
        return [];
      })
  });

  const { data: booths, refetch: refetchBooths } = useQuery({
    queryKey: ['booths'],
    queryFn: () => api.get('/booths')
      .then(res => res.data)
      .catch(err => {
        toast.error('Failed to fetch booths.');
        return [];
      })
  });

  useEffect(() => {
    refetchStudents();
    refetchBooths();
  }, []);

  const handleAddFunds = async (studentId: string) => {
    setFundsDialogOpen(true);
    setSelectedStudent(students?.find(student => student.id === studentId) || null);
  };

  const handleRefund = async (studentId: string) => {
    try {
      await api.post(`/students/${studentId}/refund`, { amount: 10 });
      toast.success('Refund processed successfully!');
      refetchStudents();
    } catch (error) {
      toast.error('Failed to process refund.');
    }
  };

  const handlePrintQRCode = () => {
    if (qrCodeUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 50%; max-height: 50%; }
              </style>
            </head>
            <body>
              <img src="${qrCodeUrl}" alt="QR Code"/>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } else {
        toast.error('Failed to open print window. Please check your browser settings.');
      }
    } else {
      toast.error('QR Code URL is not available.');
    }
  };

  const handleSearchStudent = async () => {
    try {
      const response = await api.get(`/students/${studentId}`);
      const student = response.data;
      setSelectedStudent(student);
      setQrCodeUrl(student.qrCode);
      setStudentDetailOpen(true);
    } catch (error) {
      toast.error('Failed to fetch student details.');
    }
  };

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dashboardTabs = [
    { title: "Overview", icon: HomeIcon },
    { title: "Booths", icon: StoreIcon },
    { type: "separator" },
    { title: "Students", icon: UsersIcon },
    { title: "Transactions", icon: FileTextIcon },
    { title: "Settings", icon: SettingsIcon },
  ];

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    
    switch(index) {
      case 0:
        setActiveTab("dashboard");
        break;
      case 1:
        setActiveTab("booths");
        break;
      case 2:
        break; // Separator
      case 3:
        setActiveTab("users");
        break;
      case 4:
        setActiveTab("transactions");
        break;
      case 5:
        setActiveTab("settings");
        break;
      default:
        break;
    }
  };

  return (
    <div className="container mx-auto py-4 animate-fade-in">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-2">
            <ExpandableTabs 
              tabs={dashboardTabs} 
              className="border-brand-200 dark:border-brand-800" 
              activeColor="text-brand-600"
              onChange={handleTabChange}
            />
            <Button onClick={() => setCreateBoothOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Booth
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2">
          <div className="flex flex-col space-y-4 pr-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setCreateBoothOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Booth
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => setFundsDialogOpen(true)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input 
                      id="studentId" 
                      placeholder="Enter student ID" 
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSearchStudent}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === "dashboard" && (
                  <p>Dashboard activity will be displayed here.</p>
                )}
                {activeTab === "booths" && (
                  <p>Booth management activity will be displayed here.</p>
                )}
                 {activeTab === "users" && (
                  <div className="space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search students</Label>
                      <Input
                        id="search"
                        placeholder="Search by name..."
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Separator />
                    <ScrollArea className="h-[400px] w-full rounded-md border">
                      <Table>
                        <TableCaption>A list of your students.</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Name</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents?.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>${student.balance.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleAddFunds(student.id)}>
                                  Add Funds
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
                {activeTab === "transactions" && (
                  <p>Transaction history will be displayed here.</p>
                )}
                {activeTab === "settings" && (
                  <p>Settings and configurations will be displayed here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <CreateBoothDialog open={createBoothOpen} onOpenChange={setCreateBoothOpen} refetchBooths={refetchBooths} />
        <FundsDialog 
          open={fundsDialogOpen} 
          onOpenChange={setFundsDialogOpen} 
          student={selectedStudent}
          refetchStudents={refetchStudents}
        />
        <StudentDetailDialog 
          isOpen={studentDetailOpen}
          onOpenChange={setStudentDetailOpen}
          student={selectedStudent}
          qrCodeUrl={qrCodeUrl}
          onAddFunds={handleAddFunds}
          onRefund={handleRefund}
          onPrintQRCode={handlePrintQRCode}
        />
      </div>
    </div>
  );
};

export default Dashboard;
