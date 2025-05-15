
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCSV, CSVFileType, deleteFromCSV } from '@/lib/csv-utils';
import { toast } from '@/hooks/use-toast';

interface ClassData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdAt: string;
  [key: string]: string;
}

const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClasses();
  }, [user?.id]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const allClasses = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const userClasses = allClasses.filter((c: ClassData) => c.creatorId === user?.id);
      setClasses(userClasses);
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

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteFromCSV(classId, CSVFileType.CLASSES);
      setClasses(classes.filter(c => c.id !== classId));
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const filteredClasses = classes.filter((cls) => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cls.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your classes and learning materials
            </p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link to="/dashboard/classes/create">
              <Plus className="mr-2 h-4 w-4" /> Create New Class
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9"
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid gap-4">
            {filteredClasses.map((cls) => (
              <Card key={cls.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Link to={`/dashboard/classes/${cls.id}`} className="hover:underline">
                        <h3 className="font-medium text-lg">{cls.name}</h3>
                      </Link>
                      <p className="text-muted-foreground line-clamp-2">
                        {cls.description || "No description"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created on {new Date(cls.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/classes/${cls.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/classes/${cls.id}/edit`}>Edit Class</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete Class
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <h3 className="text-lg font-medium mb-2">No classes found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "No classes match your search" : "You haven't created any classes yet"}
            </p>
            <Button asChild>
              <Link to="/dashboard/classes/create">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Class
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassesPage;
