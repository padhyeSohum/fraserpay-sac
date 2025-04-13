
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, Lock, Trash, UserPlus } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  studentNumber: z.string().min(5, 'Student number must be at least 5 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const superAdminFormSchema = z.object({
  superAdminPassword: z.string().min(1, 'Password is required'),
});

const sacAdminFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof formSchema>;
type SuperAdminFormValues = z.infer<typeof superAdminFormSchema>;
type SacAdminFormValues = z.infer<typeof sacAdminFormSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded?: () => void;
}

interface SACAdmin {
  id: string;
  username: string;
  password: string;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({
  isOpen,
  onOpenChange,
  onUserAdded
}) => {
  const [activeTab, setActiveTab] = useState("add-student");
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [sacAdmins, setSacAdmins] = useState<SACAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      studentNumber: '',
      password: ''
    }
  });

  const superAdminForm = useForm<SuperAdminFormValues>({
    resolver: zodResolver(superAdminFormSchema),
    defaultValues: {
      superAdminPassword: ''
    }
  });

  const sacAdminForm = useForm<SacAdminFormValues>({
    resolver: zodResolver(sacAdminFormSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const isSubmitting = form.formState.isSubmitting;
  const isSuperAdminSubmitting = superAdminForm.formState.isSubmitting;
  const isSacAdminSubmitting = sacAdminForm.formState.isSubmitting;

  const onSubmit = async (values: FormValues) => {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            student_number: values.studentNumber,
            name: values.name
          }
        }
      });
      
      if (authError || !authData.user) {
        throw authError || new Error('Failed to create user account');
      }

      // Then create the user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: values.name,
          email: values.email,
          student_number: values.studentNumber,
          role: 'student',
          tickets: 0,
          qr_code: `USER:${authData.user.id}`
        });
      
      if (profileError) {
        throw profileError;
      }

      toast.success('User created successfully');
      form.reset();
      onOpenChange(false);
      if (onUserAdded) onUserAdded();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleSuperAdminSubmit = async (values: SuperAdminFormValues) => {
    try {
      // Check if the password is correct - hardcoded for now
      // In production, this should be securely stored and validated
      if (values.superAdminPassword === 'superadmin123') {
        setShowSuperAdminForm(false);
        await loadSACAdmins();
      } else {
        toast.error('Incorrect super admin password');
      }
    } catch (error) {
      console.error('Error validating super admin:', error);
      toast.error('Failed to validate super admin credentials');
    }
  };

  const loadSACAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const adminsCollection = collection(firestore, 'sac_admins');
      const snapshot = await getDocs(adminsCollection);
      
      const admins: SACAdmin[] = [];
      snapshot.forEach(doc => {
        admins.push({
          id: doc.id,
          username: doc.data().username,
          password: doc.data().password
        });
      });
      
      setSacAdmins(admins);
    } catch (error) {
      console.error('Error loading SAC admins:', error);
      toast.error('Failed to load admin accounts');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleCreateSacAdmin = async (values: SacAdminFormValues) => {
    try {
      const adminId = `sac_${Date.now()}`;
      
      await setDoc(doc(firestore, 'sac_admins', adminId), {
        username: values.username,
        password: values.password,
        created_at: new Date(),
        status: 'active'
      });
      
      toast.success('SAC admin account created successfully');
      await loadSACAdmins();
      sacAdminForm.reset();
    } catch (error) {
      console.error('Error creating SAC admin:', error);
      toast.error('Failed to create admin account');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteDoc(doc(firestore, 'sac_admins', adminId));
      toast.success('Admin account deleted successfully');
      await loadSACAdmins();
    } catch (error) {
      console.error('Error deleting admin account:', error);
      toast.error('Failed to delete admin account');
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset super admin form when switching to manage tab
    if (value === "manage-sac") {
      setShowSuperAdminForm(true);
      superAdminForm.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Add new users or manage SAC admin accounts
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="add-student" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </TabsTrigger>
            <TabsTrigger value="manage-sac" className="flex items-center">
              <Key className="h-4 w-4 mr-2" />
              Manage SAC Access
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-student" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Number</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="manage-sac" className="space-y-4 mt-4">
            {showSuperAdminForm ? (
              <div className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Enter the super admin password to manage SAC dashboard accounts
                  </AlertDescription>
                </Alert>
                <Form {...superAdminForm}>
                  <form onSubmit={superAdminForm.handleSubmit(handleSuperAdminSubmit)} className="space-y-4">
                    <FormField
                      control={superAdminForm.control}
                      name="superAdminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Super Admin Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSuperAdminSubmitting}>
                      {isSuperAdminSubmitting ? 'Verifying...' : 'Access Admin Management'}
                    </Button>
                  </form>
                </Form>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Current SAC Admin Accounts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These accounts can access the SAC dashboard
                  </p>
                  
                  {isLoadingAdmins ? (
                    <div className="text-center py-4">Loading admin accounts...</div>
                  ) : sacAdmins.length > 0 ? (
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-2 text-left">Username</th>
                            <th className="px-4 py-2 text-center">Password</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sacAdmins.map(admin => (
                            <tr key={admin.id} className="border-b last:border-0">
                              <td className="px-4 py-2">{admin.username}</td>
                              <td className="px-4 py-2 text-center">••••••</td>
                              <td className="px-4 py-2 text-right">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleDeleteAdmin(admin.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-muted/20">
                      No SAC admin accounts found
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Add New SAC Admin</h3>
                  <Form {...sacAdminForm}>
                    <form onSubmit={sacAdminForm.handleSubmit(handleCreateSacAdmin)} className="space-y-4">
                      <FormField
                        control={sacAdminForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sacAdminForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder="Enter password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isSacAdminSubmitting}>
                        {isSacAdminSubmitting ? 'Creating...' : 'Create SAC Admin'}
                      </Button>
                    </form>
                  </Form>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSuperAdminForm(true)}
                  >
                    Back to Password Entry
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
