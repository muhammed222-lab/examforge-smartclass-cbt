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
  ClipboardList
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
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, deleteFromCSV } from '@/lib/csv-utils';
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

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
        
        // Fetch students in this class
        const studentsData = await getFromCSV<StudentData>(CSVFileType.STUDENTS, classId);
        setStudents(studentsData);
        
        // Fetch questions for this class
        const questionsData = await getFromCSV<QuestionData>(CSVFileType.QUESTIONS, classId);
        setQuestions(questionsData);
        
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
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Link to={`/dashboard/classes/${classId}/edit`}>
                  <Button variant="secondary">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Class
                  </Button>
                </Link>
                <AlertDialog>
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
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  View exam results for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium text-lg mb-1">No results available</h3>
                  <p>Exam results for this class will appear here.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Download Results
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClassDetailPage;
