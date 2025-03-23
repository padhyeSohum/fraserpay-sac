
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

interface User {
  id: string;
  name: string;
  email: string;
  student_number: string;
  role: string;
  tickets: number;
  qr_code?: string;
}

export interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onUserSelect: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  searchTerm = "",
  onSearchChange = () => {},
  onUserSelect
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">All Users</h3>
        <div className="w-64">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <Table>
        <TableCaption>All users in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Student ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow 
                key={user.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onUserSelect(user)}
              >
                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>{user.student_number || 'N/A'}</TableCell>
                <TableCell className="capitalize">{user.role || 'student'}</TableCell>
                <TableCell className="text-right">
                  ${(user.tickets / 100).toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;
