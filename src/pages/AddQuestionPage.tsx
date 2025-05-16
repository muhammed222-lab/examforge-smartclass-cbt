
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Trash2, FileText, Upload } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, appendToCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';
import FileUpload from '@/components/FileUpload';

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
  
  // Manual question creation
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' }
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('');
  
  // AI question generation
  const [documentContent, setDocumentContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [questionsCount, setQuestionsCount] = useState('10');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

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

  // Manual Question Creation Functions
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

  // AI Generation Functions
  const handleFileProcessed = (content: string, filename: string) => {
    setDocumentContent(content);
    setDocumentName(filename);
    toast({
      title: "Document uploaded",
      description: `${filename} has been processed successfully`,
    });
  };

  const generateQuestions = async () => {
    if (!documentContent) {
      toast({
        title: "Error",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }
    
    setIsBulkGenerating(true);
    
    try {
      // In a real implementation, this would call an AI service
      // For demonstration, we'll simulate generating questions
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockGeneratedQuestions = Array.from({ length: parseInt(questionsCount) }, (_, i) => ({
        id: uuidv4(),
        question: `Sample Question ${i + 1} from ${documentName}?`,
        options: JSON.stringify([
          { id: uuidv4(), text: `Option A for question ${i + 1}` },
          { id: uuidv4(), text: `Option B for question ${i + 1}` },
          { id: uuidv4(), text: `Option C for question ${i + 1}` },
          { id: uuidv4(), text: `Option D for question ${i + 1}` },
        ]),
        correctAnswer: `Option A for question ${i + 1}`,
        createdAt: new Date().toISOString()
      }));
      
      setGeneratedQuestions(mockGeneratedQuestions);
      
      toast({
        title: "Success",
        description: `Generated ${questionsCount} questions successfully`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions",
        variant: "destructive",
      });
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const saveGeneratedQuestions = async () => {
    setIsSubmitting(true);
    
    try {
      for (const question of generatedQuestions) {
        await appendToCSV(question, CSVFileType.QUESTIONS, classId);
      }
      
      toast({
        title: "Success",
        description: `${generatedQuestions.length} questions added successfully`,
      });
      
      navigate(`/dashboard/classes/${classId}`);
    } catch (error) {
      console.error('Error saving questions:', error);
      toast({
        title: "Error",
        description: "Failed to save questions",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Save Function
  const handleSubmitManual = async (e: React.FormEvent) => {
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
      
      // Clear form for next question
      setQuestionText('');
      setOptions([
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' }
      ]);
      setCorrectOptionId('');
      
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
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" asChild className="self-start">
            <a href={`/dashboard/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </a>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Questions</h1>
            {classData && (
              <p className="text-muted-foreground">
                Adding questions to class: <span className="font-medium text-foreground">{classData.name}</span>
              </p>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full sm:w-[400px]">
            <TabsTrigger value="manual">Manual Creation</TabsTrigger>
            <TabsTrigger value="ai">AI Generation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmitManual}>
              <Card>
                <CardHeader>
                  <CardTitle>Create Question Manually</CardTitle>
                  <CardDescription>
                    Enter question details and options
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
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/dashboard/classes/${classId}`)}
                    type="button"
                    className="w-full sm:w-auto"
                  >
                    Done
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Add Another'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
          
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>Generate Questions with AI</CardTitle>
                <CardDescription>
                  Upload a document and AI will generate questions based on its content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel>Upload Learning Material</FormLabel>
                  <div className="mt-2">
                    <FileUpload
                      onFileProcessed={handleFileProcessed}
                      allowedTypes={['.pdf', '.docx', '.txt', '.csv']}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="questionType">Question Type</FormLabel>
                    <Select value={questionType} onValueChange={setQuestionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="theory">Theory/Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel htmlFor="questionsCount">Number of Questions</FormLabel>
                    <Input
                      id="questionsCount"
                      type="number"
                      value={questionsCount}
                      onChange={(e) => setQuestionsCount(e.target.value)}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={generateQuestions} 
                  disabled={isBulkGenerating || !documentContent}
                  className="w-full sm:w-auto"
                >
                  {isBulkGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating Questions...
                    </>
                  ) : (
                    'Generate Questions'
                  )}
                </Button>
                
                {generatedQuestions.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Generated Questions Preview</h3>
                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                      {generatedQuestions.map((question, index) => (
                        <div key={question.id} className={`p-4 ${index !== 0 ? 'border-t' : ''}`}>
                          <p className="font-medium">{index + 1}. {question.question}</p>
                          <div className="ml-4 mt-2 space-y-1">
                            {JSON.parse(question.options).map((opt: any, i: number) => (
                              <div key={opt.id} className="flex items-start">
                                <span className={`mr-2 ${opt.text === question.correctAnswer ? 'text-primary font-medium' : ''}`}>
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                <span className={opt.text === question.correctAnswer ? 'text-primary font-medium' : ''}>
                                  {opt.text}
                                </span>
                                {opt.text === question.correctAnswer && (
                                  <span className="ml-2 text-xs text-primary">(Correct)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={saveGeneratedQuestions}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? 'Saving...' : `Save All ${generatedQuestions.length} Questions`}
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

export default AddQuestionPage;
