
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, updateInCSV } from '@/lib/csv-utils';
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
  updatedAt: string;
  [key: string]: string | null;
}

const EditClassPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [questionsCount, setQuestionsCount] = useState('10');
  const [accessKey, setAccessKey] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
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
      
      if (currentClass.creatorId !== user?.id) {
        toast({
          title: "Access denied",
          description: "You don't have permission to edit this class",
          variant: "destructive",
        });
        navigate('/dashboard/classes');
        return;
      }
      
      // Populate form with class data
      setName(currentClass.name);
      setDescription(currentClass.description);
      setDuration(currentClass.duration);
      setQuestionsCount(currentClass.questionsCount);
      setAccessKey(currentClass.accessKey);
      if (currentClass.expiryDate) {
        // Format date for input element (YYYY-MM-DD)
        const dateObj = new Date(currentClass.expiryDate);
        const formattedDate = dateObj.toISOString().split('T')[0];
        setExpiryDate(formattedDate);
      }
    } catch (error) {
      console.error('Error fetching class:', error);
      toast({
        title: 'Error',
        description: 'Failed to load class details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Error",
        description: "Class name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedClass = {
        id: classId,
        name,
        description,
        duration,
        questionsCount,
        accessKey,
        expiryDate: expiryDate || null,
        updatedAt: new Date().toISOString()
      };
      
      await updateInCSV(updatedClass, CSVFileType.CLASSES);
      
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      
      navigate(`/dashboard/classes/${classId}`);
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center">
            <Button variant="ghost" disabled className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <a href={`/dashboard/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </a>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Class</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>
                Update the information about your class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <FormLabel htmlFor="name" className="required">
                  Class Name
                </FormLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
                <FormDescription>
                  A descriptive name for your class
                </FormDescription>
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="description">
                  Description
                </FormLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about this class"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel htmlFor="duration">
                    Exam Duration (minutes)
                  </FormLabel>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="questionsCount">
                    Number of Questions
                  </FormLabel>
                  <Input
                    id="questionsCount"
                    type="number"
                    value={questionsCount}
                    onChange={(e) => setQuestionsCount(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="accessKey">
                    Access Key
                  </FormLabel>
                  <Input
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    required
                  />
                  <FormDescription>
                    Students will use this key to access the exam
                  </FormDescription>
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="expiryDate">
                    Expiry Date (Optional)
                  </FormLabel>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <FormDescription>
                    Set a date after which the exam will no longer be accessible
                  </FormDescription>
                </div>
              </div>
              
              <div>
                <FormLabel>
                  Learning Materials (Optional)
                </FormLabel>
                <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">
                    Drag and drop files or click to upload
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supported formats: PDF, DOCX, PPTX, JPG, PNG
                  </p>
                  <Button variant="outline" className="mt-4" type="button">
                    Upload Files
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/classes/${classId}`)}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditClassPage;
