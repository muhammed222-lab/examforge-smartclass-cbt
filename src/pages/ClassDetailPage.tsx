
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  FileQuestion, 
  Settings, 
  Share, 
  Trash2,
  Plus,
  Copy,
  Edit,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { getFromCSV, CSVFileType, deleteFromCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  duration: string;
  questionsCount: string;
  accessKey: string;
  expiryDate: string | null;
  createdAt: string;
  [key: string]: string | null;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  matricNumber?: string;
  department?: string;
  createdAt: string;
  [key: string]: string | undefined;
}

interface QuestionData {
  id: string;
  question: string;
  options: string;
  correctAnswer: string;
  createdAt: string;
  [key: string]: string;
}

const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      
      // Get class details
      const classes = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const currentClass = classes.find(c => c.id === classId);
      
      if (!currentClass) {
        toast({
          title: "Error",
          description: "Class not found",
          variant: "destructive",
        });
        navigate('/dashboard/classes');
        return;
      }
      
      if (currentClass.creatorId !== user?.id && user?.role !== 'admin') {
        toast({
          title: "Access denied",
          description: "You don't have permission to view this class",
          variant: "destructive",
        });
        navigate('/dashboard/classes');
        return;
      }
      
      setClassData(currentClass);
      
      // Get students for this class
      const classStudents = await getFromCSV<StudentData>(CSVFileType.STUDENTS, classId);
      setStudents(classStudents);
      
      // Get questions for this class
      const classQuestions = await getFromCSV<QuestionData>(CSVFileType.QUESTIONS, classId);
      setQuestions(classQuestions);
      
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load class details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccessKey = () => {
    if (classData?.accessKey) {
      navigator.clipboard.writeText(classData.accessKey);
      toast({
        title: 'Success',
        description: 'Access key copied to clipboard',
      });
    }
  };

  const handleCopyExamLink = () => {
    const examLink = `${window.location.origin}/exam/${classId}`;
    navigator.clipboard.writeText(examLink);
    toast({
      title: 'Success',
      description: 'Exam link copied to clipboard',
    });
  };

  const handleDeleteClass = async () => {
    if (!classId) return;
    
    if (confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      try {
        await deleteFromCSV(classId, CSVFileType.CLASSES);
        toast({
          title: 'Success',
          description: 'Class deleted successfully',
        });
        navigate('/dashboard/classes');
      } catch (error) {
        console.error('Error deleting class:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete class',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link to="/dashboard/classes">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Link>
            </Button>
            <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
          </div>
          
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Class not found</h1>
          <p className="text-muted-foreground mb-6">
            The class you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link to="/dashboard/classes">Back to Classes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link to="/dashboard/classes">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to={`/dashboard/classes/${classId}/edit`}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={handleCopyExamLink}>
              <Share className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteClass}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
        
        {classData.description && (
          <p className="text-muted-foreground">{classData.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Exam Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{classData.duration} minutes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" /> Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{students.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileQuestion className="h-4 w-4 mr-2" /> Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{questions.length} / {classData.questionsCount}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Access Information</CardTitle>
            <CardDescription>
              Students will need this information to access the exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
              <div>
                <p className="font-medium">Access Key</p>
                <p className="font-mono text-lg">{classData.accessKey}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopyAccessKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
              <div>
                <p className="font-medium">Exam Link</p>
                <p className="font-mono text-xs sm:text-sm truncate max-w-[250px] sm:max-w-md">
                  {window.location.origin}/exam/{classId}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopyExamLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            {classData.expiryDate && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="font-medium">Expires On</p>
                <p>{new Date(classData.expiryDate).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Tabs defaultValue="questions">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Exam Questions</CardTitle>
                  <CardDescription>
                    {questions.length > 0 
                      ? `${questions.length} questions in this exam`
                      : "No questions have been created yet"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" /> Import
                  </Button>
                  <Button asChild>
                    <Link to={`/dashboard/classes/${classId}/questions/create`}>
                      <Plus className="h-4 w-4 mr-2" /> Add Question
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length > 0 ? (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div 
                        key={question.id} 
                        className="p-4 border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium">Question {index + 1}:</p>
                        <p className="mt-1">{question.question}</p>
                        <div className="flex justify-end mt-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/dashboard/classes/${classId}/questions/${question.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" /> Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No questions have been created for this exam yet
                    </p>
                    <Button asChild>
                      <Link to={`/dashboard/classes/${classId}/questions/create`}>
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Question
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    {students.length > 0 
                      ? `${students.length} students enrolled`
                      : "No students have been added yet"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" /> Import CSV
                  </Button>
                  <Button asChild>
                    <Link to={`/dashboard/classes/${classId}/students/add`}>
                      <Plus className="h-4 w-4 mr-2" /> Add Student
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Matric Number</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Added On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.email || '-'}</TableCell>
                            <TableCell>{student.matricNumber || '-'}</TableCell>
                            <TableCell>{student.department || '-'}</TableCell>
                            <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No students have been added to this class yet
                    </p>
                    <Button asChild>
                      <Link to={`/dashboard/classes/${classId}/students/add`}>
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Student
                      </Link>
                    </Button>
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
