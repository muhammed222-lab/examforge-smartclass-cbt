import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFromCSV,
  CSVFileType,
  updateInCSV,
  deleteFromCSV,
} from "@/lib/csv-utils";
import { toast } from "@/hooks/use-toast";

interface ClassData {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdAt: string;
  [key: string]: string;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Class name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

const EditClassPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const classes = await getFromCSV<ClassData>(CSVFileType.CLASSES);
      const currentClass = classes.find((c) => c.id === classId);

      if (!currentClass) {
        toast({
          title: "Error",
          description: "Class not found",
          variant: "destructive",
        });
        navigate("/dashboard/classes");
        return;
      }

      if (currentClass.creatorId !== user?.id) {
        toast({
          title: "Access denied",
          description: "You don't have permission to modify this class",
          variant: "destructive",
        });
        navigate("/dashboard/classes");
        return;
      }

      setClassData(currentClass);
      form.reset({
        name: currentClass.name,
        description: currentClass.description,
      });
    } catch (error) {
      console.error("Error fetching class:", error);
      toast({
        title: "Error",
        description: "Failed to load class details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!classData) return;

    setIsSubmitting(true);

    try {
      const updatedClass = {
        id: classData.id,
        name: values.name,
        description: values.description || "",
      };

      await updateInCSV(classData.id, updatedClass, CSVFileType.CLASSES);

      toast({
        title: "Success",
        description: "Class updated successfully",
      });

      navigate(`/dashboard/classes/${classId}`);
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!classData) return;

    if (
      !confirm(
        "Are you sure you want to delete this class? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteFromCSV(classData.id, CSVFileType.CLASSES);

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });

      navigate("/dashboard/classes");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
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

        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
            <CardDescription>Update your class information</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter class name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is the name that will be displayed to students.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter class description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of what this class is about.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  onClick={handleDelete}
                  type="button"
                  variant="destructive"
                >
                  Delete Class
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/dashboard/classes/${classId}`)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditClassPage;
