
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getFromCSV, CSVFileType } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface ExamResult {
  id: string;
  classId: string;
  className: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  duration: string;
  submittedAt: string;
}

const ExamResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const results = await getFromCSV<ExamResult>(CSVFileType.RESULTS);
        const foundResult = results.find(r => r.id === resultId);
        
        if (foundResult) {
          setResult(foundResult);
        } else {
          toast({
            title: "Error",
            description: "Result not found",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching result:', error);
        toast({
          title: 'Error',
          description: 'Failed to load exam result',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Loading Result...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-pulse h-8 w-8 bg-blue-500 rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Result Not Found</CardTitle>
            <CardDescription className="text-center">The exam result you're looking for does not exist.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { letter: 'A', description: 'Excellent' };
    if (percentage >= 80) return { letter: 'B', description: 'Very Good' };
    if (percentage >= 70) return { letter: 'C', description: 'Good' };
    if (percentage >= 60) return { letter: 'D', description: 'Satisfactory' };
    if (percentage >= 50) return { letter: 'E', description: 'Pass' };
    return { letter: 'F', description: 'Fail' };
  };

  const grade = getGrade(result.percentage);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Exam Result</CardTitle>
          <CardDescription>{result.className}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`${result.percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  strokeDasharray={`${result.percentage * 3.51} 351.68`}
                  strokeDashoffset="87.92"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-3xl font-bold">{result.percentage}%</span>
                <p className="text-lg font-semibold">{grade.letter}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 divide-y">
            <div className="py-2 flex justify-between">
              <span className="text-gray-600">Student Name</span>
              <span className="font-medium">{result.studentName}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium">{result.studentEmail}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-gray-600">Grade</span>
              <span className="font-medium">{grade.letter} - {grade.description}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-gray-600">Score</span>
              <span className="font-medium">{result.score} / {result.totalQuestions}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-gray-600">Submitted</span>
              <span className="font-medium">{new Date(result.submittedAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExamResultPage;
