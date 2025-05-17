
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, Shield, Users, BookOpen, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface CSVData {
  id: string;
  [key: string]: any;
}

const AdminCSVPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCSVType, setSelectedCSVType] = useState<CSVFileType>(CSVFileType.USERS);
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access this page',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  const handleAuthentication = () => {
    if (password === '@muhammedA1') {
      setIsAuthenticated(true);
      setAuthError('');
      fetchCSVData(selectedCSVType);
    } else {
      setAuthError('Invalid password. Please try again.');
    }
  };
  
  const fetchCSVData = async (type: CSVFileType) => {
    try {
      setLoading(true);
      const data = await getFromCSV<CSVData>(type);
      setCsvData(data);
      setSelectedCSVType(type);
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch CSV data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportTableToCSV = () => {
    try {
      // Create CSV content with all fields
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (csvData.length === 0) {
        toast({
          title: 'No Data',
          description: 'No data available to export',
          variant: 'destructive',
        });
        return;
      }
      
      // Get all possible headers from all objects
      const allKeys = new Set<string>();
      csvData.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys);
      
      // Add headers
      csvContent += headers.join(',') + '\n';
      
      // Add data rows
      csvData.forEach(item => {
        const row = headers.map(header => {
          const value = item[header] !== undefined ? String(item[header]) : '';
          // Escape commas and quotes
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedCSVType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Complete',
        description: `${selectedCSVType} data exported successfully.`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV data.',
        variant: 'destructive',
      });
    }
  };

  const getCSVTypeName = (type: CSVFileType): string => {
    const names: Record<CSVFileType, string> = {
      [CSVFileType.USERS]: 'Users',
      [CSVFileType.CLASSES]: 'Classes',
      [CSVFileType.STUDENTS]: 'Students',
      [CSVFileType.QUESTIONS]: 'Questions',
      [CSVFileType.RESULTS]: 'Results',
      [CSVFileType.ATTEMPTS]: 'Attempts',
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="space-y-4">
            <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" />
                Admin Authentication
              </CardTitle>
              <CardDescription>
                Enter admin password to access CSV database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="Admin password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleAuthentication()}
                    />
                  </div>
                  {authError && (
                    <p className="text-sm text-destructive">{authError}</p>
                  )}
                </div>
                <Button className="w-full" onClick={handleAuthentication}>
                  Authenticate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CSV Database Management</h1>
            <p className="text-muted-foreground mt-1">
              View and download CSV data for all system files
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(true)}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" /> Export Current CSV
            </Button>
          </div>
        </div>

        <Tabs defaultValue={CSVFileType.USERS} onValueChange={(value) => fetchCSVData(value as CSVFileType)}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value={CSVFileType.USERS}>Users</TabsTrigger>
            <TabsTrigger value={CSVFileType.CLASSES}>Classes</TabsTrigger>
            <TabsTrigger value={CSVFileType.STUDENTS}>Students</TabsTrigger>
            <TabsTrigger value={CSVFileType.QUESTIONS}>Questions</TabsTrigger>
            <TabsTrigger value={CSVFileType.RESULTS}>Results</TabsTrigger>
            <TabsTrigger value={CSVFileType.ATTEMPTS}>Attempts</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedCSVType} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {selectedCSVType === CSVFileType.USERS ? (
                    <Users className="mr-2 h-5 w-5" />
                  ) : selectedCSVType === CSVFileType.CLASSES ? (
                    <BookOpen className="mr-2 h-5 w-5" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-5 w-5" />
                  )}
                  {getCSVTypeName(selectedCSVType)} Data
                </CardTitle>
                <CardDescription>
                  Viewing raw CSV data for {selectedCSVType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : csvData.length > 0 ? (
                  <div className="rounded-md border overflow-hidden overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(csvData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.entries(row).map(([key, value], j) => (
                              <TableCell key={`${i}-${j}`}>
                                {typeof value === 'string' && value.length > 50 
                                  ? `${value.substring(0, 50)}...` 
                                  : String(value)
                                }
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No data found</h3>
                    <p className="text-muted-foreground mt-2">
                      There is no data in this CSV file
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export CSV Data</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to export the current {getCSVTypeName(selectedCSVType)} CSV data.
              This file will contain sensitive information. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              exportTableToCSV();
              setConfirmDialogOpen(false);
            }}>
              Download CSV
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminCSVPage;
