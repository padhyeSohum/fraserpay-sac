
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '@/integrations/firebase/client';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Plus, Trash, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SACAdmin {
  id: string;
  username: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

const SuperAdminDashboard = () => {
  const [admins, setAdmins] = useState<SACAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New admin state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if super admin is authenticated
  useEffect(() => {
    const superAdminId = sessionStorage.getItem('superAdminId');
    if (!superAdminId) {
      navigate('/super-admin/login');
    }
  }, [navigate]);
  
  // Fetch SAC admins data
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const adminsRef = collection(firestore, 'sac_admins');
        const snapshot = await getDocs(adminsRef);
        
        const adminList: SACAdmin[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          adminList.push({
            id: doc.id,
            username: data.username,
            active: data.active,
            createdAt: data.createdAt,
            lastLogin: data.lastLogin
          });
        });
        
        setAdmins(adminList);
        setError(null);
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Failed to load administrators');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdmins();
  }, []);
  
  // Handle admin toggle (active/inactive)
  const handleToggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      const adminRef = doc(firestore, 'sac_admins', id);
      await updateDoc(adminRef, {
        active: !currentStatus
      });
      
      // Update local state
      setAdmins(admins.map(admin => 
        admin.id === id ? { ...admin, active: !currentStatus } : admin
      ));
      
      toast({
        title: "Status updated",
        description: `Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err) {
      console.error('Error toggling admin status:', err);
      toast({
        title: "Update failed",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    }
  };
  
  // Handle admin deletion
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this administrator?")) {
      return;
    }
    
    try {
      const adminRef = doc(firestore, 'sac_admins', id);
      await deleteDoc(adminRef);
      
      // Update local state
      setAdmins(admins.filter(admin => admin.id !== id));
      
      toast({
        title: "Administrator deleted",
        description: "Administrator has been removed successfully",
      });
    } catch (err) {
      console.error('Error deleting admin:', err);
      toast({
        title: "Deletion failed",
        description: "Failed to delete administrator",
        variant: "destructive"
      });
    }
  };
  
  // Handle adding new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    
    // Validate input
    if (newPassword.length < 6) {
      setAddError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setAddError('Passwords do not match');
      return;
    }
    
    try {
      // Check if username already exists
      const adminsRef = collection(firestore, 'sac_admins');
      const q = query(adminsRef, where('username', '==', newUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setAddError('Username already exists');
        return;
      }
      
      // Add new admin
      const newAdmin = {
        username: newUsername,
        password: newPassword, // In a real application, you'd hash this
        active: true,
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(firestore, 'sac_admins'), newAdmin);
      
      // Update local state
      setAdmins([...admins, {
        id: docRef.id,
        username: newUsername,
        active: true,
        createdAt: newAdmin.createdAt
      }]);
      
      // Reset form
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setAddDialogOpen(false);
      
      toast({
        title: "Administrator added",
        description: "New administrator has been created successfully",
      });
    } catch (err) {
      console.error('Error adding admin:', err);
      setAddError('Failed to create administrator');
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('superAdminId');
    navigate('/super-admin/login');
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SAC Access Management</h1>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus size={16} /> Add Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading administrators...
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No administrators found. Create one to manage SAC access.
                  </TableCell>
                </TableRow>
              ) : (
                admins.map(admin => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded ${admin.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {admin.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {admin.lastLogin 
                        ? new Date(admin.lastLogin).toLocaleDateString() 
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAdmin(admin.id, admin.active)}
                      >
                        {admin.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Administrator</DialogTitle>
            <DialogDescription>
              Create a new administrator account to grant SAC dashboard access.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddAdmin} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
            
            {addError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Administrator</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SuperAdminDashboard;
