
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType } from '@/lib/csv-utils';

interface ClassSummary {
  id: string;
  name: string;
  description: string;
  studentsCount: number;
  questionsCount: number;
  createdAt: string;
}

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalExams: number;
  recentClasses: ClassSummary[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    totalStudents: 0,
    totalExams: 0,
    recentClasses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get classes created by this user
        const classes = await getFromCSV(CSVFileType.CLASSES);
        const userClasses = classes.filter((c: any) => c.creatorId === user?.id);
        
        // Get total number of students from all classes
        let totalStudents = 0;
        let recentClasses: ClassSummary[] = [];

        // Process each class to get students and questions
        for (const cls of userClasses) {
          const students = await getFromCSV(CSVFileType.STUDENTS, cls.id);
          const questions = await getFromCSV(CSVFileType.QUESTIONS, cls.id);
          
          totalStudents += students.length;
          
          recentClasses.push({
            id: cls.id,
            name: cls.name,
            description: cls.description,
            studentsCount: students.length,
            questionsCount: questions.length,
            createdAt: cls.createdAt,
          });
        }
        
        // Sort by creation date (newest first) and take only the 5 most recent
        recentClasses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        recentClasses = recentClasses.slice(0, 5);
        
        // Get results data (completed exams)
        const results = await getFromCSV(CSVFileType.RESULTS);
        const userResults = results.filter((r: any) => userClasses.some((c: any) => c.id === r.classId));
        
        setStats({
          totalClasses: userClasses.length,
          totalStudents,
          totalExams: userResults.length,
          recentClasses,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your classes and exams.
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0" size="sm">
            <Link to="/dashboard/classes/create">
              <Plus className="mr-2 h-4 w-4" /> Create New Class
            </Link>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalClasses
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Classes you've created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalStudents
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all your classes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Exams Completed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                ) : (
                  stats.totalExams
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total exams taken by students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent classes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
            <CardDescription>
              Your most recently created classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : stats.recentClasses.length > 0 ? (
              <div className="space-y-4">
                {stats.recentClasses.map((cls) => (
                  <Link 
                    key={cls.id} 
                    to={`/dashboard/classes/${cls.id}`}
                    className="block"
                  >
                    <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{cls.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {cls.description || "No description"}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <div><span className="font-medium">{cls.studentsCount}</span> students</div>
                          <div><span className="font-medium">{cls.questionsCount}</span> questions</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">You haven't created any classes yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/dashboard/classes/create">
                    <Plus className="mr-2 h-4 w-4" /> Create Your First Class
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade card - shown only if on basic plan */}
        {user?.paymentPlan === 'basic' && (
          <Card className="bg-primary/5 border border-primary/20">
            <CardHeader>
              <CardTitle>Upgrade to Premium</CardTitle>
              <CardDescription>
                You're currently on the Basic plan with {user.examsRemaining} exams remaining today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                  <p className="font-medium">Unlock unlimited exams and advanced features</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get detailed analytics, priority support, and more
                  </p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/upgrade">Upgrade Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
