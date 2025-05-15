
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import {
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, appendToCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  creatorId: string;
  [key: string]: string;
}

const AddStudentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(classId || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const userClasses = allClasses.filter((c: ClassData) => c.creatorId === user?.id);
      setClasses(userClasses);
      
      if (!classId && userClasses.length > 0) {
        setSelectedClass(userClasses[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !selectedClass) {
      toast({
        title: "Error",
        description: "Student name and class are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newStudent = {
        id: uuidv4(),
        name,
        email,
        matricNumber,
        department,
        classId: selectedClass,
        createdAt: new Date().toISOString()
      };
      
      await appendToCSV(newStudent, CSVFileType.STUDENTS, selectedClass);
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      
      if (classId) {
        navigate(`/dashboard/classes/${classId}`);
      } else {
        navigate('/dashboard/students');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <a href={classId ? `/dashboard/classes/${classId}` : '/dashboard/students'}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </a>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add Student</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                Enter the student's details to add them to a class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="name">Full Name *</FormLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Student's full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="matricNumber">Matriculation Number</FormLabel>
                  <Input
                    id="matricNumber"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g., 123456"
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="department">Department</FormLabel>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="class">Class *</FormLabel>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={loading || classes.length === 0 || Boolean(classId)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {classes.length === 0 && !loading && (
                  <FormDescription className="text-destructive">
                    You need to create a class first before adding students.
                  </FormDescription>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate(classId ? `/dashboard/classes/${classId}` : '/dashboard/students')}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || classes.length === 0}
              >
                {isSubmitting ? 'Adding...' : 'Add Student'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddStudentPage;
