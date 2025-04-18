
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { firestore } from '@/integrations/firebase/client';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

interface AuthorizedUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthorizedUsersDialog: React.FC<AuthorizedUsersDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [email, setEmail] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<{ id: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  const loadAuthorizedUsers = async () => {
    try {
      const authUsersRef = collection(firestore, 'sac_authorized_users');
      const snapshot = await getDocs(authUsersRef);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email
      }));
      setAuthorizedUsers(users);
    } catch (error) {
      console.error('Error loading authorized users:', error);
      toast.error('Failed to load authorized users');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAuthorizedUsers();
    }
  }, [isOpen]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith('@pdsb.net')) {
      toast.error('Only @pdsb.net email addresses are allowed');
      return;
    }

    setIsLoading(true);
    try {
      const authUsersRef = collection(firestore, 'sac_authorized_users');
      
      // Check if email already exists
      const q = query(authUsersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error('This email is already authorized');
        return;
      }

      await addDoc(authUsersRef, {
        email: email.toLowerCase(),
        added_at: new Date().toISOString()
      });

      toast.success('User authorized successfully');
      setEmail('');
      loadAuthorizedUsers();
    } catch (error) {
      console.error('Error adding authorized user:', error);
      toast.error('Failed to add authorized user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    setRemoveLoading(userId);
    try {
      // Remove user from the sac_authorized_users collection
      await deleteDoc(doc(firestore, 'sac_authorized_users', userId));
      
      // Verify the user was actually deleted
      const userRef = doc(firestore, 'sac_authorized_users', userId);
      const q = query(collection(firestore, 'sac_authorized_users'), where('email', '==', userEmail));
      const verifySnapshot = await getDocs(q);
      
      if (verifySnapshot.empty) {
        // User was successfully removed
        toast.success('Access for user has been revoked');
        
        // Update local state to reflect the change
        setAuthorizedUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      } else {
        // Something went wrong, try again
        toast.error('Failed to revoke access, please try again');
        console.error('User still exists after deletion attempt');
      }
    } catch (error) {
      console.error('Error removing authorized user:', error);
      toast.error('Failed to revoke access');
    } finally {
      setRemoveLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage SAC Access</DialogTitle>
          <DialogDescription>
            Add or remove users who can access the SAC dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="user@pdsb.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="self-end">
              Add User
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorizedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id, user.email)}
                      className="h-8 w-8 text-destructive"
                      disabled={removeLoading === user.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorizedUsersDialog;
