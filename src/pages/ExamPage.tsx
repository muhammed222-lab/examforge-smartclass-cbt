/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFromCSV, CSVFileType, appendToCSV } from "@/lib/csv-utils";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Lock, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useBeforeUnload } from "@/hooks/use-before-unload";

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
  const { toggle: toggleFullscreen, isFullscreen } = useFullscreen();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationStep, setVerificationStep] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [accessKey, setAccessKey] = useState("");
  const [studentDetails, setStudentDetails] = useState<StudentDetails>({
    name: "",
    email: "",
    matricNumber: "",
    department: "",
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [warnings, setWarnings] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Block navigation during exam
  useBeforeUnload(
    examStarted,
    "Are you sure you want to leave? Your progress may be lost."
  );

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

          // Show warnings at specific intervals
          if (prev === 300) {
            // 5 minutes left
            toast({
              title: "Time Warning",
              description: "You have 5 minutes remaining!",
              variant: "default",
            });
          } else if (prev === 60) {
            // 1 minute left
            toast({
              title: "Hurry!",
              description: "Only 1 minute remaining!",
              variant: "destructive",
            });
          }

          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  // Auto-save answers periodically
  useEffect(() => {
    if (!examStarted) return;

    const saveInterval = setInterval(() => {
      saveProgressToLocalStorage();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [examStarted, answers]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);

      // Check for saved progress
      const savedProgress = localStorage.getItem(`exam_progress_${classId}`);
      if (savedProgress) {
        const {
          answers: savedAnswers,
          currentIndex,
          timeRemaining,
        } = JSON.parse(savedProgress);
        if (
          confirm(
            "You have unsaved progress. Would you like to continue where you left off?"
          )
        ) {
          setAnswers(savedAnswers);
          setCurrentQuestionIndex(currentIndex);
          setTimeLeft(timeRemaining);
        }
      }

      // Get class details
      const classes = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const currentClass = classes.find((c) => c.id === classId);

      if (!currentClass) {
        console.error("Class not found:", classId);
        toast({
          title: "Error",
          description: "Exam not found",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setClassData(currentClass);
      setTimeLeft(parseInt(currentClass.duration) * 60);

      // Get questions for this class
      const classQuestions = await getFromCSV<QuestionData>(
        CSVFileType.QUESTIONS,
        classId
      );

      if (classQuestions.length === 0) {
        toast({
          title: "Error",
          description: "This exam has no questions",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Shuffle questions
      const shuffled = [...classQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      toast({
        title: "Error",
        description: "Failed to load exam details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProgressToLocalStorage = () => {
    localStorage.setItem(
      `exam_progress_${classId}`,
      JSON.stringify({
        answers,
        currentIndex: currentQuestionIndex,
        timeRemaining: timeLeft,
      })
    );
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

    if (!studentDetails.name || !studentDetails.email) {
      toast({
        title: "Error",
        description: "Please provide your name and email to continue.",
        variant: "destructive",
      });
      return;
    }

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

        // Enter fullscreen mode
        if (!isFullscreen) {
          toggleFullscreen();
        }

        setVerificationStep(false);
        setExamStarted(true);

        toast({
          title: "Exam Started",
          description: `You have ${classData.duration} minutes to complete this exam.`,
        });
      } catch (error) {
        console.error("Error saving student:", error);
        toast({
          title: "Error",
          description: "Failed to start exam. Please try again.",
          variant: "destructive",
        });
      }
    };

    saveStudent();
  };

  const handleAnswerSelection = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!examStarted) return;

      switch (e.key) {
        case "ArrowLeft":
          prevQuestion();
          break;
        case "ArrowRight":
          nextQuestion();
          break;
        default:
          break;
      }
    },
    [examStarted, currentQuestionIndex, questions.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Detect tab switching
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((prev) => {
          const newWarnings = prev + 1;
          if (newWarnings >= 3) {
            submitExam();
            toast({
              title: "Exam Submitted",
              description:
                "Your exam was submitted due to multiple tab switches.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Warning",
              description: `Please stay on this tab. ${
                3 - newWarnings
              } warnings left.`,
              variant: "default",
            });
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [examStarted]);

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
        className: classData?.name || "",
        studentName: studentDetails.name,
        studentEmail: studentDetails.email,
        score,
        totalQuestions: questions.length,
        percentage: Math.round((score / questions.length) * 100),
        duration: classData?.duration || "0",
        submittedAt: new Date().toISOString(),
        warnings: warnings,
      };

      await appendToCSV(result, CSVFileType.RESULTS);

      // Clear saved progress
      localStorage.removeItem(`exam_progress_${classId}`);

      toast({
        title: "Exam Submitted",
        description: `Your answers have been submitted successfully.`,
      });

      navigate(`/exam-result/${result.id}`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Loading Exam...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-lg mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Exam Not Found</CardTitle>
            <CardDescription className="text-center">
              The exam you're looking for does not exist.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (verificationStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="mt-2">{classData.name}</CardTitle>
              <CardDescription>
                Please enter the access key and your details to start the exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="accessKey"
                  className="block text-sm font-medium mb-1"
                >
                  Access Key <span className="text-red-500">*</span>
                </label>
                <Input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter access key"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={studentDetails.name}
                    onChange={(e) =>
                      setStudentDetails({
                        ...studentDetails,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={studentDetails.email}
                    onChange={(e) =>
                      setStudentDetails({
                        ...studentDetails,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="matricNumber"
                    className="block text-sm font-medium mb-1"
                  >
                    Matric Number
                  </label>
                  <Input
                    id="matricNumber"
                    type="text"
                    value={studentDetails.matricNumber}
                    onChange={(e) =>
                      setStudentDetails({
                        ...studentDetails,
                        matricNumber: e.target.value,
                      })
                    }
                    placeholder="Enter your matric number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium mb-1"
                  >
                    Department
                  </label>
                  <Input
                    id="department"
                    type="text"
                    value={studentDetails.department}
                    onChange={(e) =>
                      setStudentDetails({
                        ...studentDetails,
                        department: e.target.value,
                      })
                    }
                    placeholder="Enter your department"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={verifyAccessKey} className="px-8 py-3 text-lg">
                Start Exam
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (examStarted) {
    const currentQuestion = questions[currentQuestionIndex];
    try {
      const options =
        currentQuestion && currentQuestion.options
          ? currentQuestion.options.includes("|")
            ? currentQuestion.options.split("|")
            : JSON.parse(currentQuestion.options).map((o: any) => o.text)
          : [];

      const selectedAnswer = answers[currentQuestion?.id] || "";
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Exam Header */}
            <div className="bg-white shadow-md rounded-lg p-4 sticky top-0 z-10 flex items-center justify-between border-b border-gray-200">
              <div className="font-bold text-lg">{classData.name}</div>
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span
                    className={`font-bold ${
                      timeLeft <= 60
                        ? "text-red-600 animate-pulse"
                        : "text-gray-800"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />

            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium">
                        Question {currentQuestionIndex + 1}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlagQuestion(currentQuestion.id)}
                        className={
                          flaggedQuestions.has(currentQuestion.id)
                            ? "text-yellow-500"
                            : ""
                        }
                      >
                        {flaggedQuestions.has(currentQuestion.id)
                          ? "★ Flagged"
                          : "☆ Flag"}
                      </Button>
                    </div>
                    <p className="mt-2 text-gray-800">
                      {currentQuestion?.question}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          handleAnswerSelection(currentQuestion.id, option)
                        }
                        className={`border rounded-md p-4 cursor-pointer transition-colors ${
                          selectedAnswer === option
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                              selectedAnswer === option
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedAnswer === option && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-gray-800">{option}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3"
              >
                Previous
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={nextQuestion} className="px-6 py-3">
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                >
                  Submit Exam
                </Button>
              )}
            </div>

            {/* Question Navigation Grid */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2 text-gray-600">
                Question Navigation
              </h4>
              <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                {questions.map((q, index) => (
                  <Button
                    key={index}
                    variant={
                      answers[q.id]
                        ? flaggedQuestions.has(q.id)
                          ? "destructive"
                          : "default"
                        : flaggedQuestions.has(q.id)
                        ? "outline"
                        : "outline"
                    }
                    size="sm"
                    className={`h-10 w-10 rounded-full ${
                      currentQuestionIndex === index
                        ? "ring-2 ring-offset-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Confirmation Dialog */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Confirm Submission</CardTitle>
                  <CardDescription>
                    Are you sure you want to submit your exam? You won't be able
                    to make changes after submission.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <span>
                        Answered: {Object.keys(answers).length}/
                        {questions.length}
                      </span>
                    </div>
                    {flaggedQuestions.size > 0 && (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </div>
                        <span>Flagged: {flaggedQuestions.size}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitExam}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirm Submit
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering exam:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <Card className="w-full max-w-lg mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">
                Error Loading Question
              </CardTitle>
              <CardDescription className="text-center">
                There was a problem displaying this question.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous Question
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
              >
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
