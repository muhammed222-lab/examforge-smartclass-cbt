
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, BarChart3, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ExamResult {
  id: string;
  studentId: string;
  classId: string;
  score: number;
  totalQuestions: number;
  status: "passed" | "failed";
  createdAt: string;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  matricNumber?: string;
  [key: string]: string | undefined;
}

interface ClassData {
  id: string;
  name: string;
  creatorId: string;
  [key: string]: string;
}

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all classes created by this user
      const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const userClasses = allClasses.filter((c: ClassData) => c.creatorId === user?.id);
      setClasses(userClasses);
      
      // Get all results from all user classes
      let allResults: ExamResult[] = [];
      let allStudents: StudentData[] = [];
      
      for (const cls of userClasses) {
        // Get class results
        const classResults = await getFromCSV<ExamResult>(CSVFileType.RESULTS, cls.id);
        allResults = [...allResults, ...classResults];
        
        // Get class students
        const classStudents = await getFromCSV<StudentData>(CSVFileType.STUDENTS, cls.id);
        allStudents = [...allStudents, ...classStudents];
      }
      
      setResults(allResults);
      setStudents(allStudents);
      
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load results data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedResults = [...results].sort((a, b) => {
    // First apply class filter if needed
    if (classFilter !== 'all') {
      if (a.classId === classFilter && b.classId !== classFilter) return -1;
      if (a.classId !== classFilter && b.classId === classFilter) return 1;
    }
    
    // Then sort by field
    if (sortField === 'score') {
      return sortDirection === 'asc' ? a.score - b.score : b.score - a.score;
    } else if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  const filteredResults = sortedResults.filter(result => {
    if (classFilter !== 'all' && result.classId !== classFilter) {
      return false;
    }
    
    // Get student details
    const student = students.find(s => s.id === result.studentId);
    if (!student) return false;
    
    return student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (student.matricNumber && student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };
  
  const getStatusColor = (status: string) => {
    return status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((acc, result) => acc + result.score, 0);
    return Math.round((total / results.length) * 10) / 10;
  };
  
  const getPassRate = () => {
    if (results.length === 0) return 0;
    const passed = results.filter(r => r.status === 'passed').length;
    return Math.round((passed / results.length) * 100);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Results & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              View and analyze student performance
            </p>
          </div>
          <Button variant="outline" className="mt-4 sm:mt-0">
            <Download className="mr-2 h-4 w-4" /> Export All Results
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{results.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{getAverageScore()}/100</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pass Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{getPassRate()}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{classes.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <AspectRatio ratio={16/6} className="bg-muted flex items-center justify-center">
              <div className="flex items-center justify-center">
                <BarChart3 className="h-16 w-16 opacity-50" />
                <p className="text-sm text-muted-foreground ml-2">Analytics charts will appear here</p>
              </div>
            </AspectRatio>
          </CardContent>
        </Card>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> More Filters
          </Button>
        </div>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead onClick={() => handleSort('score')} className="cursor-pointer">
                        <div className="flex items-center">
                          Score
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                        <div className="flex items-center">
                          Date
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          {getStudentName(result.studentId)}
                        </TableCell>
                        <TableCell>{getClassName(result.classId)}</TableCell>
                        <TableCell>
                          {result.score}% ({result.score * result.totalQuestions / 100}/{result.totalQuestions})
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status === 'passed' ? 'Passed' : 'Failed'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || classFilter !== 'all' ? 
                    "No results match your search criteria" : 
                    "There are no exam results yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ResultsPage;
