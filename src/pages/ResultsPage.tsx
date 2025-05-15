
import React, { useState, useEffect } from 'react';
import { BarChart2, Download, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getFromCSV, CSVFileType, exportToCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface ResultData {
  id: string;
  studentId: string;
  classId: string;
  score: string;
  startTime: string;
  endTime: string;
  [key: string]: string;
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

interface ResultWithDetails extends ResultData {
  studentName: string;
  className: string;
  examDuration: string;
}

const ResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    passRate: 0
  });

  useEffect(() => {
    fetchResults();
  }, [user?.id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Get all classes created by this user
      const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const userClasses = allClasses.filter((c: ClassData) => c.creatorId === user?.id);
      
      // Get all results
      const allResults = await getFromCSV<ResultData>(CSVFileType.RESULTS);
      
      // Filter results for user's classes
      const userResults = allResults.filter((r: ResultData) => 
        userClasses.some(c => c.id === r.classId)
      );
      
      // Get all students data for enriching results
      const classStudents: { [key: string]: StudentData[] } = {};
      for (const cls of userClasses) {
        classStudents[cls.id] = await getFromCSV<StudentData>(CSVFileType.STUDENTS, cls.id);
      }
      
      // Enrich results with student and class information
      const enrichedResults = userResults.map(result => {
        const classData = userClasses.find(c => c.id === result.classId);
        const student = classStudents[result.classId]?.find(s => s.id === result.studentId);
        
        // Calculate exam duration
        const startTime = new Date(result.startTime);
        const endTime = new Date(result.endTime);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMins = Math.floor(durationMs / 60000);
        
        return {
          ...result,
          studentName: student?.name || 'Unknown Student',
          className: classData?.name || 'Unknown Class',
          examDuration: `${durationMins} mins`
        };
      });
      
      // Calculate statistics
      const totalExams = enrichedResults.length;
      const totalScores = enrichedResults.reduce((sum, result) => sum + parseFloat(result.score), 0);
      const averageScore = totalExams > 0 ? Math.round(totalScores / totalExams) : 0;
      const passCount = enrichedResults.filter(result => parseFloat(result.score) >= 50).length;
      const passRate = totalExams > 0 ? Math.round((passCount / totalExams) * 100) : 0;
      
      setResults(enrichedResults);
      setStats({
        totalExams,
        averageScore,
        passRate
      });
      
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

  const handleExportResults = () => {
    try {
      exportToCSV(results, 'exam-results.csv');
      toast({
        title: 'Success',
        description: 'Results exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export results',
        variant: 'destructive',
      });
    }
  };

  const filteredResults = results.filter((result) => 
    result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    result.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Results</h1>
            <p className="text-muted-foreground mt-1">
              View and analyze student exam results
            </p>
          </div>
          <Button variant="outline" className="mt-4 sm:mt-0" onClick={handleExportResults}>
            <Download className="mr-2 h-4 w-4" /> Export All Results
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalExams
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${stats.averageScore}%`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  `${stats.passRate}%`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              // Fix for the TS error - using a React element instead of string
              startAdornment={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

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
                      <TableHead>Score</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>{result.className}</TableCell>
                        <TableCell>{`${result.score}%`}</TableCell>
                        <TableCell>{new Date(result.startTime).toLocaleString()}</TableCell>
                        <TableCell>{new Date(result.endTime).toLocaleString()}</TableCell>
                        <TableCell>{result.examDuration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No results match your search" : "No exams have been completed yet"}
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
