
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/form';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
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

interface Option {
  id: string;
  text: string;
}

const AddQuestionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' }
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          description: "You don't have permission to modify this class",
          variant: "destructive",
        });
        navigate('/dashboard/classes');
        return;
      }
      
      setClassData(currentClass);
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

  const addOption = () => {
    setOptions([...options, { id: uuidv4(), text: '' }]);
  };

  const removeOption = (idToRemove: string) => {
    if (options.length <= 2) {
      toast({
        title: 'Error',
        description: 'Questions must have at least 2 options',
        variant: 'destructive',
      });
      return;
    }
    
    setOptions(options.filter(option => option.id !== idToRemove));
    
    if (correctOptionId === idToRemove) {
      setCorrectOptionId('');
    }
  };

  const updateOptionText = (id: string, newText: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text: newText } : option
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionText) {
      toast({
        title: "Error",
        description: "Question text is required",
        variant: "destructive",
      });
      return;
    }
    
    // Check all options have text
    const emptyOptions = options.filter(opt => !opt.text.trim());
    if (emptyOptions.length > 0) {
      toast({
        title: "Error",
        description: "All options must have text",
        variant: "destructive",
      });
      return;
    }
    
    if (!correctOptionId) {
      toast({
        title: "Error",
        description: "Please select a correct answer",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const correctOptionText = options.find(opt => opt.id === correctOptionId)?.text || '';
      
      const newQuestion = {
        id: uuidv4(),
        question: questionText,
        options: JSON.stringify(options),
        correctAnswer: correctOptionText,
        createdAt: new Date().toISOString()
      };
      
      await appendToCSV(newQuestion, CSVFileType.QUESTIONS, classId);
      
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      
      navigate(`/dashboard/classes/${classId}`);
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question",
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
          <h1 className="text-3xl font-bold tracking-tight">Add Question</h1>
        </div>
        
        {classData && (
          <p className="text-muted-foreground">
            Adding question to class: <span className="font-medium text-foreground">{classData.name}</span>
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>
                Create a new multiple choice question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <FormLabel htmlFor="question">Question Text *</FormLabel>
                <Textarea
                  id="question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question here"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Answer Options *</FormLabel>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Option
                  </Button>
                </div>
                
                <RadioGroup value={correctOptionId} onValueChange={setCorrectOptionId}>
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value={option.id} id={option.id} className="mt-2" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center">
                          <label htmlFor={option.id} className="text-sm font-medium mr-2">
                            Option {String.fromCharCode(65 + index)}
                          </label>
                          {option.id === correctOptionId && (
                            <span className="text-xs text-primary">(Correct Answer)</span>
                          )}
                        </div>
                        <div className="flex">
                          <Input 
                            value={option.text}
                            onChange={(e) => updateOptionText(option.id, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="flex-1"
                          />
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeOption(option.id)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
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
                {isSubmitting ? 'Saving...' : 'Save Question'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddQuestionPage;
