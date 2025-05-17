import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, BarChart3, ArrowUpDown, FileText, FileSpreadsheet, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, updateInCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExamResult {
  id: string;
  studentId: string;
  classId: string;
  score: number;
  totalQuestions: number;
  status: "passed" | "failed";
  createdAt: string;
  showGradeToStudent?: boolean;
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
  showGradesToStudents?: string;
  [key: string]: string | undefined;
}

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showGradesDialogOpen, setShowGradesDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showGradesToStudents, setShowGradesToStudents] = useState(true);
  
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Ref for table export
  const tableRef = useRef<HTMLDivElement>(null);

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
  
  const getStudentMatric = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.matricNumber || 'N/A';
  };

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };
  
  const getStatusColor = (status: string) => {
    return status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getAverageScore = (filteredOnly = true) => {
    const resultsToAnalyze = filteredOnly ? filteredResults : results;
    if (resultsToAnalyze.length === 0) return 0;
    const total = resultsToAnalyze.reduce((acc, result) => acc + result.score, 0);
    return Math.round((total / resultsToAnalyze.length) * 10) / 10;
  };
  
  const getPassRate = (filteredOnly = true) => {
    const resultsToAnalyze = filteredOnly ? filteredResults : results;
    if (resultsToAnalyze.length === 0) return 0;
    const passed = resultsToAnalyze.filter(r => r.status === 'passed').length;
    return Math.round((passed / resultsToAnalyze.length) * 100);
  };
  
  const getResultsByScore = (filteredOnly = true) => {
    const resultsToAnalyze = filteredOnly ? filteredResults : results;
    const total = resultsToAnalyze.length;
    
    if (total === 0) return { aboveHalf: 0, belowHalf: 0 };
    
    const aboveHalf = resultsToAnalyze.filter(r => r.score >= 50).length;
    return {
      aboveHalf,
      belowHalf: total - aboveHalf
    };
  };

  const handleToggleShowGrades = (classId: string) => {
    setSelectedClassId(classId);
    const classData = classes.find(c => c.id === classId);
    setShowGradesToStudents(classData?.showGradesToStudents !== 'false');
    setShowGradesDialogOpen(true);
  };
  
  const updateShowGradesSettings = async () => {
    if (!selectedClassId) return;
    
    try {
      // Update class settings in CSV
      await updateInCSV<ClassData>(
        selectedClassId,
        { showGradesToStudents: String(showGradesToStudents) },
        CSVFileType.CLASSES
      );
      
      // Update local state
      setClasses(classes.map(c => 
        c.id === selectedClassId 
          ? { ...c, showGradesToStudents: String(showGradesToStudents) }
          : c
      ));
      
      toast({
        title: 'Settings Updated',
        description: `Grade visibility settings updated for ${getClassName(selectedClassId)}.`,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update grade visibility settings.',
        variant: 'destructive',
      });
    }
    
    setShowGradesDialogOpen(false);
  };

  const exportToCSV = () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "Student Name,Matric Number,Class,Score,Status,Date\n";
      
      // Add data rows
      filteredResults.forEach(result => {
        const student = students.find(s => s.id === result.studentId);
        const row = [
          student?.name || 'Unknown Student',
          student?.matricNumber || 'N/A',
          getClassName(result.classId),
          `${result.score}%`,
          result.status,
          new Date(result.createdAt).toLocaleDateString()
        ];
        
        // Escape commas in values and wrap in quotes if needed
        const formattedRow = row.map(value => {
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        
        csvContent += formattedRow.join(',') + "\n";
      });
      
      // Create a download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ExamResults_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Complete',
        description: 'Results exported to CSV successfully.',
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export results to CSV.',
        variant: 'destructive',
      });
    }
  };

  const exportToPDF = () => {
    try {
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Exam Results Report', 14, 20);
      
      // Add report details
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Class: ${classFilter !== 'all' ? getClassName(classFilter) : 'All Classes'}`, 14, 35);
      doc.text(`Total Results: ${filteredResults.length}`, 14, 40);
      doc.text(`Average Score: ${getAverageScore()}%`, 14, 45);
      doc.text(`Pass Rate: ${getPassRate()}%`, 14, 50);
      
      // Create table data
      const tableColumn = ["Student Name", "Matric Number", "Class", "Score", "Status", "Date"];
      const tableRows = filteredResults.map(result => [
        getStudentName(result.studentId),
        getStudentMatric(result.studentId),
        getClassName(result.classId),
        `${result.score}%`,
        result.status === 'passed' ? 'Passed' : 'Failed',
        new Date(result.createdAt).toLocaleDateString()
      ]);
      
      // Generate table
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Save PDF
      doc.save(`ExamResults_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Export Complete',
        description: 'Results exported to PDF successfully.',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export results to PDF.',
        variant: 'destructive',
      });
    }
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
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export Results
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
              <p className="text-3xl font-bold">{filteredResults.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From {students.filter(s => 
                  filteredResults.some(r => r.studentId === s.id)
                ).length} students
              </p>
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
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-primary h-full"
                  style={{ width: `${getAverageScore()}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {getResultsByScore().aboveHalf}
                  </p>
                  <p className="text-xs text-muted-foreground">Passed (≥50%)</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded-lg text-center">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {getResultsByScore().belowHalf}
                  </p>
                  <p className="text-xs text-muted-foreground">Failed (<50%)</p>
                </div>
              </div>
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
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${getPassRate() >= 70 ? 'bg-green-500' : getPassRate() >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${getPassRate()}%` }}
                ></div>
              </div>
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={classFilter === 'all'}
                  onClick={() => classFilter !== 'all' && handleToggleShowGrades(classFilter)}
                >
                  <Filter className="mr-2 h-4 w-4" /> Grade Visibility
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {classFilter === 'all' 
                  ? 'Select a specific class to manage grade visibility'
                  : 'Control whether students can see their grades'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Results Table */}
        <div ref={tableRef}>
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
                        <TableHead>Matric Number</TableHead>
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
                          <TableCell>{getStudentMatric(result.studentId)}</TableCell>
                          <TableCell>{getClassName(result.classId)}</TableCell>
                          <TableCell>
                            {result.score}% ({Math.round(result.score * result.totalQuestions / 100)}/{result.totalQuestions})
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
      </div>

      {/* Dialog for managing grade visibility */}
      <AlertDialog open={showGradesDialogOpen} onOpenChange={setShowGradesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grade Visibility Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Control whether students can see their grades immediately after completing an exam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Show grades to students</h4>
              <p className="text-sm text-muted-foreground">
                When enabled, students will see their score immediately after submitting their exam.
              </p>
            </div>
            <Switch
              checked={showGradesToStudents}
              onCheckedChange={setShowGradesToStudents}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={updateShowGradesSettings}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ResultsPage;
