
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { appendToCSV, CSVFileType } from "@/lib/csv-utils";
import { toast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";

const CreateClassPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [questionsCount, setQuestionsCount] = useState("10");
  const [accessKey, setAccessKey] = useState(generateAccessKey());
  const [expiryDate, setExpiryDate] = useState("");
  const [learningMaterial, setLearningMaterial] = useState("");
  const [materialFilename, setMaterialFilename] = useState("");

  function generateAccessKey() {
    // Generate a random 6-character alphanumeric string
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const handleFileProcessed = (content: string, filename: string) => {
    setLearningMaterial(content);
    setMaterialFilename(filename);
    toast({
      title: "File uploaded",
      description: `${filename} has been processed successfully`,
    });
  };

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
        learningMaterial: learningMaterial ? materialFilename : null,
        learningMaterialContent: learningMaterial || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await appendToCSV(newClass, CSVFileType.CLASSES);

      toast({
        title: "Success",
        description: "Class created successfully",
      });

      navigate(`/dashboard/classes/${newClass.id}`);
    } catch (error) {
      console.error("Error creating class:", error);
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
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Create New Class
          </h1>
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
                <Label htmlFor="name" className="required">
                  Class Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Introduction to Computer Science"
                  required
                />
                <CardDescription>
                  A descriptive name for your class
                </CardDescription>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
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
                  <Label htmlFor="duration">Exam Duration (minutes)</Label>
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
                  <Label htmlFor="questionsCount">Number of Questions</Label>
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
                  <Label htmlFor="accessKey">Access Key</Label>
                  <Input
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    required
                  />
                  <CardDescription>
                    Students will use this key to access the exam
                  </CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <CardDescription>
                    Set a date after which the exam will no longer be accessible
                  </CardDescription>
                </div>
              </div>

              <div>
                <Label>Learning Materials (Optional)</Label>
                <div className="mt-2">
                  <FileUpload
                    onFileProcessed={handleFileProcessed}
                    allowedTypes={['.pdf', '.docx', '.pptx', '.jpg', '.png', '.txt', '.csv']}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/classes")}
                type="button"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
