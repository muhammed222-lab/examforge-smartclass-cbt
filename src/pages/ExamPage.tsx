
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getFromCSV, CSVFileType, appendToCSV } from '@/lib/csv-utils';
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
}

interface QuestionData {
  id: string;
  question: string;
  options: string;
  correctAnswer: string;
  createdAt: string;
}

interface StudentDetails {
  name: string;
  email: string;
  matricNumber: string;
  department: string;
}

const ExamPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationStep, setVerificationStep] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [accessKey, setAccessKey] = useState('');
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: '',
    email: '',
    matricNumber: '',
    department: ''
  });

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
    }
  }, [classId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      
      // Get class details
      const classes = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      console.log('Classes fetched:', classes);
      console.log('Looking for classId:', classId);
      
      const currentClass = classes.find(c => c.id === classId);
      
      if (!currentClass) {
        console.error('Class not found:', classId);
        toast({
          title: "Error",
          description: "Exam not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      setClassData(currentClass);
      setTimeLeft(parseInt(currentClass.duration) * 60); // Convert minutes to seconds
      
      // Get questions for this class
      const classQuestions = await getFromCSV<QuestionData>(CSVFileType.QUESTIONS, classId);
      console.log('Questions fetched:', classQuestions.length);
      
      if (classQuestions.length === 0) {
        toast({
          title: "Error",
          description: "This exam has no questions",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      // Shuffle questions
      const shuffled = [...classQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      
    } catch (error) {
      console.error('Error fetching exam details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exam details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAccessKey = () => {
    if (!classData) return;
    
    if (accessKey !== classData.accessKey) {
      toast({
        title: "Error",
        description: "Invalid access key. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Verify student details
    if (!studentDetails.name || !studentDetails.email) {
      toast({
        title: "Error",
        description: "Please provide your name and email to continue.",
        variant: "destructive",
      });
      return;
    }
    
    // Save student details
    const saveStudent = async () => {
      try {
        const studentId = `student_${Date.now()}`;
        const student = {
          id: studentId,
          name: studentDetails.name,
          email: studentDetails.email,
          matricNumber: studentDetails.matricNumber,
          department: studentDetails.department,
          createdAt: new Date().toISOString(),
        };
        
        await appendToCSV(student, CSVFileType.STUDENTS, classId);
        
        // All good, start exam
        setVerificationStep(false);
        setExamStarted(true);
        
        toast({
          title: "Exam Started",
          description: `You have ${classData.duration} minutes to complete this exam.`,
        });
      } catch (error) {
        console.error('Error saving student:', error);
        toast({
          title: 'Error',
          description: 'Failed to start exam. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    saveStudent();
  };

  const handleAnswerSelection = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitExam = async () => {
    try {
      // Calculate score
      const score = questions.reduce((acc, question) => {
        if (answers[question.id] === question.correctAnswer) {
          return acc + 1;
        }
        return acc;
      }, 0);
      
      // Save result
      const result = {
        id: `result_${Date.now()}`,
        classId: classId,
        className: classData?.name || '',
        studentName: studentDetails.name,
        studentEmail: studentDetails.email,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        duration: classData?.duration || '0',
        submittedAt: new Date().toISOString(),
      };
      
      await appendToCSV(result, CSVFileType.RESULTS);
      
      toast({
        title: "Exam Submitted",
        description: `Your answers have been submitted successfully.`,
      });
      
      // Show results page
      navigate(`/exam-result/${result.id}`);
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit exam. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Loading Exam...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-pulse h-8 w-8 bg-blue-500 rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Exam Not Found</CardTitle>
            <CardDescription className="text-center">The exam you're looking for does not exist.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (verificationStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{classData.name}</CardTitle>
            <CardDescription className="text-center">
              Please enter the access key and your details to start the exam.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="accessKey" className="block text-sm font-medium mb-1">
                Access Key
              </label>
              <Input
                id="accessKey"
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter access key"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={studentDetails.name}
                onChange={(e) => setStudentDetails({ ...studentDetails, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={studentDetails.email}
                onChange={(e) => setStudentDetails({ ...studentDetails, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="matricNumber" className="block text-sm font-medium mb-1">
                Matric Number (Optional)
              </label>
              <Input
                id="matricNumber"
                type="text"
                value={studentDetails.matricNumber}
                onChange={(e) => setStudentDetails({ ...studentDetails, matricNumber: e.target.value })}
                placeholder="Enter your matric number"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium mb-1">
                Department (Optional)
              </label>
              <Input
                id="department"
                type="text"
                value={studentDetails.department}
                onChange={(e) => setStudentDetails({ ...studentDetails, department: e.target.value })}
                placeholder="Enter your department"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={verifyAccessKey}>Start Exam</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (examStarted) {
    const currentQuestion = questions[currentQuestionIndex];
    try {
      // Parse options - improved error handling
      const options = currentQuestion && currentQuestion.options ? 
        (currentQuestion.options.includes('|') ? 
          currentQuestion.options.split('|') : 
          JSON.parse(currentQuestion.options).map((o: any) => o.text)) : 
        [];
      
      const selectedAnswer = answers[currentQuestion?.id] || '';
      
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-md rounded-lg mb-4 p-4 sticky top-0 z-10 flex items-center justify-between">
              <div className="font-bold">
                {classData.name}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
                <div className="font-bold text-red-500">{formatTime(timeLeft)}</div>
              </div>
            </div>
            
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium">Question {currentQuestionIndex + 1}</h3>
                  <p className="mt-2">{currentQuestion?.question}</p>
                </div>
                
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleAnswerSelection(currentQuestion.id, option)}
                      className={`border rounded-md p-3 cursor-pointer ${
                        selectedAnswer === option ? 'border-primary bg-primary/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-5 w-5 rounded-full border ${
                          selectedAnswer === option ? 'bg-primary border-primary' : 'border-gray-300'
                        } mr-2`}></div>
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={nextQuestion}>Next</Button>
              ) : (
                <Button onClick={submitExam} className="bg-green-600 hover:bg-green-700">
                  Submit Exam
                </Button>
              )}
            </div>
            
            <div className="mt-6 grid grid-cols-6 md:grid-cols-10 gap-2">
              {questions.map((_, index) => (
                <Button
                  key={index}
                  variant={answers[questions[index].id] ? "default" : "outline"}
                  className={`h-10 w-10 rounded-full ${
                    currentQuestionIndex === index ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering exam:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Error Loading Question</CardTitle>
              <CardDescription className="text-center">There was a problem displaying this question.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center gap-2">
              <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                Previous Question
              </Button>
              <Button onClick={nextQuestion} disabled={currentQuestionIndex >= questions.length - 1}>
                Next Question
              </Button>
              <Button variant="destructive" onClick={submitExam}>
                Submit Exam
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  return null;
};

export default ExamPage;
