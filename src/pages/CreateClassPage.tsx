
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from 'lucide-react';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { appendToCSV, CSVFileType } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [questionsCount, setQuestionsCount] = useState('10');
  const [accessKey, setAccessKey] = useState(generateAccessKey());
  const [expiryDate, setExpiryDate] = useState('');

  function generateAccessKey() {
    // Generate a random 6-character alphanumeric string
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

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
      const newClass = {
        id: uuidv4(),
        name,
        description,
        creatorId: user?.id,
        duration,
        questionsCount,
        accessKey,
        expiryDate: expiryDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await appendToCSV(newClass, CSVFileType.CLASSES);
      
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      
      navigate(`/dashboard/classes/${newClass.id}`);
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Class</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new class and start creating exams
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Class Details</CardTitle>
              <CardDescription>
                Enter the basic information about your class
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
                onClick={() => navigate('/dashboard/classes')}
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateClassPage;
