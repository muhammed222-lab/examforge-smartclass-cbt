
import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileProcessed: (content: string, filename: string) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileProcessed,
  allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.ppt', '.pptx', '.jpg', '.png'],
  maxSizeMB = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const processFile = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    // Validate file type
    const fileExt = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
    if (!allowedTypes.includes(fileExt) && !allowedTypes.includes('*')) {
      toast({
        title: "Invalid file type",
        description: `Please upload one of these formats: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
    setIsProcessing(true);
    
    try {
      // Handle different file types
      if (fileExt === '.csv') {
        // Parse CSV
        Papa.parse(selectedFile, {
          complete: function(results) {
            const csvContent = JSON.stringify(results.data);
            onFileProcessed(csvContent, selectedFile.name);
          },
          header: true,
          error: (error) => {
            toast({
              title: "Error parsing CSV",
              description: error.message,
              variant: "destructive",
            });
          }
        });
      } else {
        // For other file types, read as text
        const content = await selectedFile.text();
        onFileProcessed(content, selectedFile.name);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error processing file",
        description: "Please try a different file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  const removeFile = () => {
    setFile(null);
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      } transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileUpload"
        className="sr-only"
        onChange={handleFileInputChange}
        accept={allowedTypes.join(',')}
      />
      
      {!file ? (
        <label
          htmlFor="fileUpload"
          className="flex flex-col items-center justify-center p-6 cursor-pointer text-center"
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Drag and drop file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Accepted formats: {allowedTypes.join(', ')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max size: {maxSizeMB}MB
          </p>
          <Button variant="outline" className="mt-4" type="button">
            Select File
          </Button>
        </label>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
            <div className="flex items-center space-x-3">
              <div className="bg-background rounded-md p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[180px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {isProcessing && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Processing file...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
