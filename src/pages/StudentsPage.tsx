import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Download, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getFromCSV, CSVFileType } from "@/lib/csv-utils";
import { toast } from "@/hooks/use-toast";

interface StudentData {
  id: string;
  name: string;
  email: string;
  classId: string;
  matricNumber?: string;
  department?: string;
  createdAt: string;
  [key: string]: string | undefined;
}

interface ClassData {
  id: string;
  name: string;
  creatorId: string;
  [key: string]: string;
}

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all classes created by this user
        const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
        const userClasses = allClasses.filter(
          (c: ClassData) => c.creatorId === user?.id
        );
        setClasses(userClasses);

        // Get all students from all user classes
        let allStudents: StudentData[] = [];
        for (const cls of userClasses) {
          const classStudents = await getFromCSV<StudentData>(
            CSVFileType.STUDENTS,
            cls.id
          );
          allStudents = [
            ...allStudents,
            ...classStudents.map((student) => ({
              ...student,
              className: cls.name,
            })),
          ];
        }

        setStudents(allStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email &&
        student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.matricNumber &&
        student.matricNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (student.department &&
        student.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : "Unknown Class";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground mt-1">
              Manage students across all your classes
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <Button variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button asChild>
              <Link to="/dashboard/students/add">
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" className="sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-muted animate-pulse rounded"
                  ></div>
                ))}
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Matric Number</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Added On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.email || "-"}</TableCell>
                        <TableCell>{student.matricNumber || "-"}</TableCell>
                        <TableCell>{student.department || "-"}</TableCell>
                        <TableCell>{getClassName(student.classId)}</TableCell>
                        <TableCell>
                          {new Date(student.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No students found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm
                    ? "No students match your search"
                    : "You haven't added any students yet"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline">
                    <UploadCloud className="mr-2 h-4 w-4" /> Import Students
                  </Button>
                  <Button asChild>
                    <Link to="/dashboard/students/add">
                      <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
