import React, { useState } from 'react';
import { PDFViewer } from './PDFViewer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, FileType } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface PDFPreviewProps {
  projectId: number;
  pdfUrl?: string;
  pdfFile?: File;
  onBuild?: () => void;
}

export function PDFPreview({ projectId, pdfUrl, pdfFile, onBuild }: PDFPreviewProps) {
  const [pdfSource, setPdfSource] = useState<string | null>(pdfUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(pdfFile || null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  // Function to handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        // Create an object URL for preview
        const fileUrl = URL.createObjectURL(file);
        setPdfSource(fileUrl);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive"
        });
      }
    }
  };

  // Mutation for uploading PDF
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }
      
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      
      setUploadStatus('uploading');
      
      const response = await fetch(`/api/projects/${projectId}/pdf`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload PDF");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      // Update PDF source with the server URL if needed
      if (data.pdfUrl) {
        setPdfSource(data.pdfUrl);
      }
      
      toast({
        title: "PDF uploaded successfully",
        description: "Your PDF is ready for app conversion"
      });
    },
    onError: (error) => {
      setUploadStatus('error');
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive"
      });
    }
  });

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  // Handle build button click
  const handleBuild = () => {
    if (onBuild) {
      onBuild();
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">PDF Preview</TabsTrigger>
          <TabsTrigger value="upload">Upload PDF</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="space-y-4">
          {pdfSource ? (
            <PDFViewer 
              pdfUrl={pdfSource} 
              title="PDF App Preview"
              onBuild={handleBuild}
            />
          ) : (
            <Alert>
              <FileType className="h-4 w-4" />
              <AlertTitle>No PDF Selected</AlertTitle>
              <AlertDescription>
                Please upload a PDF file to preview and convert into an app.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input 
                id="pdf-upload" 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploadMutation.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Upload a PDF file to convert into a mobile app
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Upload PDF
              </Button>
              
              {selectedFile && pdfSource && (
                <Button variant="outline" onClick={handleBuild}>
                  Continue to Build
                </Button>
              )}
            </div>
            
            {uploadStatus === 'success' && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <AlertTitle>PDF Uploaded Successfully</AlertTitle>
                <AlertDescription>
                  Your PDF has been uploaded and is ready for conversion.
                </AlertDescription>
              </Alert>
            )}
            
            {uploadStatus === 'error' && (
              <Alert variant="destructive">
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>
                  There was an error uploading your PDF. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}