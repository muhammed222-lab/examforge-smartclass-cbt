
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Plus, 
  FileText,
  Download,
  Trash2, 
  Pencil,
  ChevronRight,
  Users,
  GraduationCap,
  ClipboardList,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, deleteFromCSV, updateInCSV } from '@/lib/csv-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  createdAt: string;
  showGradesToStudents?: string;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  matricNumber?: string;
  classId?: string;
}

interface QuestionData {
  id: string;
  classId: string;
  text: string;
  options: string[];
  correctOption: number;
  createdAt: string;
}

interface ExamResult {
  id: string;
  studentId: string;
  classId: string;
  score: number;
  totalQuestions: number;
  status: "passed" | "failed";
  createdAt: string;
  answers?: string;
  timeSpent?: string;
}

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showGradesDialogOpen, setShowGradesDialogOpen] = useState(false);
  const [showGradesToStudents, setShowGradesToStudents] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (!classId) return;
    
    const fetchClassData = async () => {
      try {
        setLoading(true);
        
        // Fetch class details
        const classesData = await getFromCSV<ClassDetails>(CSVFileType.CLASSES);
        console.log("Fetched classes:", classesData.length, "User ID:", user?.id);
        
        const foundClass = classesData.find(c => c.id === classId);
        if (!foundClass) {
          toast({
            title: 'Class Not Found',
            description: 'The requested class could not be found.',
            variant: 'destructive',
          });
          navigate('/dashboard/classes');
          return;
        }
        
        // Check if user has permission to view this class
        console.log("Class creator ID:", foundClass.creatorId, "Current user ID:", user?.id);
        if (foundClass.creatorId !== user?.id && user?.role !== 'admin') {
          toast({
            title: 'Access Denied',
            description: "You don't have permission to view this class.",
            variant: 'destructive',
          });
          navigate('/dashboard/classes');
          return;
        }
        
        setClassDetails(foundClass);
        setShowGradesToStudents(foundClass.showGradesToStudents !== 'false');
        
        // Fetch students in this class
        const studentsData = await getFromCSV<StudentData>(CSVFileType.STUDENTS, classId);
        setStudents(studentsData);
        
        // Fetch questions for this class
        const questionsData = await getFromCSV<QuestionData>(CSVFileType.QUESTIONS, classId);
        setQuestions(questionsData);

        // Fetch results for this class
        const resultsData = await getFromCSV<ExamResult>(CSVFileType.RESULTS, classId);
        setResults(resultsData);
        
      } catch (error) {
        console.error('Error fetching class data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassData();
  }, [classId, navigate, user?.id, user?.role]);

  const handleDeleteClass = async () => {
    if (!classId || !classDetails) return;
    
    try {
      // Delete class from CSV
      await deleteFromCSV(classId, CSVFileType.CLASSES);
      
      // Optionally, delete associated students and questions (if needed)
      // await deleteFromCSV(classId, CSVFileType.STUDENTS);
      // await deleteFromCSV(classId, CSVFileType.QUESTIONS);
      
      toast({
        title: 'Class Deleted',
        description: `${classDetails.name} has been successfully deleted.`,
      });
      navigate('/dashboard/classes');
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleGradeVisibility = async () => {
    if (!classId || !classDetails) return;
    
    try {
      // Update class settings in CSV
      await updateInCSV<ClassDetails>(
        classId,
        { showGradesToStudents: String(!showGradesToStudents) },
        CSVFileType.CLASSES
      );
      
      setShowGradesToStudents(!showGradesToStudents);
      
      toast({
        title: 'Settings Updated',
        description: `Grade visibility has been ${!showGradesToStudents ? 'enabled' : 'disabled'} for students.`,
      });
    } catch (error) {
      console.error('Error updating grade visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update grade visibility settings.',
        variant: 'destructive',
      });
    } finally {
      setShowGradesDialogOpen(false);
    }
  };

  const exportResultsToCSV = () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add headers
      csvContent += "Student Name,Email,Matric Number,Score,Status,Time Spent,Date\n";
      
      // Add data rows
      results.forEach(result => {
        const student = students.find(s => s.id === result.studentId);
        if (!student) return;
        
        const row = [
          student.name,
          student.email,
          student.matricNumber || 'N/A',
          `${result.score}%`,
          result.status === 'passed' ? 'Passed' : 'Failed',
          result.timeSpent || 'N/A',
          new Date(result.createdAt).toLocaleDateString()
        ];
        
        // Properly escape double quotes in values
        const formattedRow = row.map(value => {
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
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
      link.setAttribute("download", `${classDetails?.name}_Results_${new Date().toISOString().split('T')[0]}.csv`);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p>Loading class details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!classDetails) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <p>Class not found.</p>
          <Link to="/dashboard/classes" className="text-blue-500">
            Go back to classes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Link to="/dashboard/classes" className="text-muted-foreground hover:text-foreground transition-colors">
            Classes
          </Link>
          <ChevronRight className="h-4 w-4" />
          <h1 className="text-2xl font-bold">{classDetails.name}</h1>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
                <CardDescription>
                  Manage and view details about this class
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Description</h3>
                  <p className="text-muted-foreground">
                    {classDetails.description || 'No description provided.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Created At</h3>
                  <p className="text-muted-foreground">
                    {new Date(classDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Show Grades to Students</h3>
                    <p className="text-sm text-muted-foreground">
                      {showGradesToStudents 
                        ? 'Students can see their grades after completing exams' 
                        : 'Students cannot see their grades after completing exams'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGradesDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    {showGradesToStudents ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {showGradesToStudents ? 'Visible' : 'Hidden'}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Link to={`/dashboard/classes/${classId}/edit`}>
                  <Button variant="secondary">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Class
                  </Button>
                </Link>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Class
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the class and remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteClass}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
            
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
                  <AlertDialogAction onClick={handleToggleGradeVisibility}>Save Changes</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Manage students enrolled in this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="grid gap-4">
                    {students.map(student => (
                      <div key={student.id} className="border rounded-md p-4">
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.matricNumber && (
                          <p className="text-sm text-muted-foreground">Matric: {student.matricNumber}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-lg mb-1">No students enrolled</h3>
                    <p>Add students to this class to start managing them</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link to={`/dashboard/classes/${classId}/students/add`}>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Manage questions for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="grid gap-4">
                    {questions.map(question => (
                      <div key={question.id} className="border rounded-md p-4">
                        <h4 className="font-medium">{question.text}</h4>
                        <p className="text-sm text-muted-foreground">
                          {question.options.length} options
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-lg mb-1">No questions added</h3>
                    <p>Add questions to this class to start creating exams</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Link to={`/dashboard/classes/${classId}/questions/create`}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    View exam results for this class
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Button onClick={exportResultsToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Results (CSV)
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Results</p>
                        <p className="text-2xl font-bold">{results.length}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Passed</p>
                        <p className="text-2xl font-bold">
                          {results.filter(r => r.status === 'passed').length}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold">
                          {results.filter(r => r.status === 'failed').length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4">Student</th>
                            <th className="text-left py-3 px-4">Matric Number</th>
                            <th className="text-left py-3 px-4">Score</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Time Spent</th>
                            <th className="text-left py-3 px-4">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map(result => {
                            const student = students.find(s => s.id === result.studentId);
                            return (
                              <tr key={result.id} className="border-b">
                                <td className="py-3 px-4">{student?.name || 'Unknown Student'}</td>
                                <td className="py-3 px-4">{student?.matricNumber || 'N/A'}</td>
                                <td className="py-3 px-4">{result.score}%</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    result.status === 'passed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {result.status === 'passed' ? 'Passed' : 'Failed'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">{result.timeSpent || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  {new Date(result.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-lg mb-1">No results available</h3>
                    <p>Exam results for this class will appear here.</p>
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

export default ClassDetailPage;
