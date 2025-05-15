
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, deleteFromCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  paymentPlan: string;
  createdAt: string;
  [key: string]: string;
}

interface ClassData {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  [key: string]: string;
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalClasses: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchAdminData();
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const allUsers = await getFromCSV<UserData>(CSVFileType.USERS);
      setUsers(allUsers);
      
      // Fetch all classes
      const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      setClasses(allClasses);
      
      // Calculate stats
      const premiumUsers = allUsers.filter(u => u.paymentPlan === 'premium').length;
      
      // Simple revenue calculation (just for demo)
      const basicRevenue = (allUsers.length - premiumUsers) * 30000; // ₦30,000 per basic user
      const premiumRevenue = premiumUsers * 50000; // ₦50,000 per premium user
      
      setStats({
        totalUsers: allUsers.length,
        premiumUsers,
        totalClasses: allClasses.length,
        totalRevenue: basicRevenue + premiumRevenue
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: 'Error',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await deleteFromCSV(userId, CSVFileType.USERS);
      setUsers(users.filter(u => u.id !== userId));
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteFromCSV(classId, CSVFileType.CLASSES);
      setClasses(classes.filter(c => c.id !== classId));
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, classes, and system settings
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalUsers
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.premiumUsers
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalClasses
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  formatCurrency(stats.totalRevenue)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user accounts in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell className="capitalize">{user.paymentPlan}</TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle>All Classes</CardTitle>
                <CardDescription>
                  View and manage all classes in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class Name</TableHead>
                          <TableHead>Creator ID</TableHead>
                          <TableHead>Created On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classes.map((cls) => (
                          <TableRow key={cls.id}>
                            <TableCell className="font-medium">{cls.name}</TableCell>
                            <TableCell>{cls.creatorId}</TableCell>
                            <TableCell>{new Date(cls.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClass(cls.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPage;
