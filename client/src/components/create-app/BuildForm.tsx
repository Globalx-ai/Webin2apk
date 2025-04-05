import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BuildFormProps {
  projectId: number;
  onBack: () => void;
}

type BuildStatus = "idle" | "building" | "completed" | "failed";

const BuildForm = ({ projectId, onBack }: BuildFormProps) => {
  const { toast } = useToast();
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (buildStatus === "building") {
      // Simulated progress
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prevProgress + 5;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildStatus]);

  const startBuild = async () => {
    setBuildStatus("building");
    setProgress(0);
    setError(null);
    
    try {
      const response = await apiRequest("POST", `/api/projects/${projectId}/build`, undefined);
      const data = await response.json();
      
      // Set download URL
      setApkUrl(data.apk.downloadUrl);
      
      setProgress(100);
      setBuildStatus("completed");
      
      toast({
        title: "Success",
        description: "APK built successfully!",
      });
    } catch (error) {
      setError((error as Error).message || "Failed to build APK");
      setBuildStatus("failed");
      
      toast({
        title: "Build Failed",
        description: (error as Error).message || "There was an error building your APK",
        variant: "destructive",
      });
    }
  };

  const downloadApk = () => {
    window.location.href = `/api/projects/${projectId}/download`;
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Step 4: Build Your App</h3>
        <p className="text-gray-600 mb-6">Generate the Android APK file for your app</p>
        
        {buildStatus === "idle" && (
          <div className="text-center py-6">
            <div className="mb-6">
              <span className="material-icons text-6xl text-blue-600">android</span>
            </div>
            <h4 className="text-lg font-medium mb-2">Ready to Build</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your app is configured and ready to be built. The build process will package your website into an Android APK file.
            </p>
            <Button 
              onClick={startBuild}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              size="lg"
            >
              <span className="material-icons mr-2">build</span>
              Start Build
            </Button>
          </div>
        )}
        
        {buildStatus === "building" && (
          <div className="max-w-md mx-auto py-6">
            <div className="text-center mb-6">
              <div className="mb-4">
                <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <h4 className="text-lg font-medium mb-2">Building Your App</h4>
              <p className="text-gray-600 mb-4">
                This may take a few minutes. Please don't close this window.
              </p>
            </div>
            
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-gray-500 text-right">{progress}%</p>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Generating Android manifest</span>
                <Badge variant={progress >= 20 ? "default" : "outline"}>
                  {progress >= 20 ? "Done" : "Pending"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Processing app icons</span>
                <Badge variant={progress >= 40 ? "default" : "outline"}>
                  {progress >= 40 ? "Done" : "Pending"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Creating signing key</span>
                <Badge variant={progress >= 60 ? "default" : "outline"}>
                  {progress >= 60 ? "Done" : "Pending"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Packaging WebView</span>
                <Badge variant={progress >= 80 ? "default" : "outline"}>
                  {progress >= 80 ? "Done" : "Pending"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Finalizing APK</span>
                <Badge variant={progress >= 100 ? "default" : "outline"}>
                  {progress >= 100 ? "Done" : "Pending"}
                </Badge>
              </div>
            </div>
          </div>
        )}
        
        {buildStatus === "completed" && (
          <div className="text-center py-6">
            <div className="mb-6">
              <span className="material-icons text-6xl text-green-500">check_circle</span>
            </div>
            <h4 className="text-lg font-medium mb-2">Build Successful!</h4>
            <p className="text-gray-600 mb-6">
              Your APK has been built successfully and is ready for download.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={downloadApk}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                size="lg"
              >
                <span className="material-icons mr-2">download</span>
                Download APK
              </Button>
              
              <div>
                <Button 
                  onClick={startBuild}
                  variant="outline"
                >
                  <span className="material-icons mr-2">replay</span>
                  Rebuild
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {buildStatus === "failed" && (
          <div className="py-6">
            <Alert variant="destructive" className="mb-6">
              <span className="material-icons mr-2">error</span>
              <AlertTitle>Build Failed</AlertTitle>
              <AlertDescription>
                {error || "There was an error building your APK. Please try again."}
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <Button 
                onClick={startBuild}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
              >
                <span className="material-icons mr-2">replay</span>
                Try Again
              </Button>
              
              <div>
                <Button 
                  onClick={onBack}
                  variant="outline"
                >
                  <span className="material-icons mr-2">arrow_backward</span>
                  Back to Configuration
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildForm;
