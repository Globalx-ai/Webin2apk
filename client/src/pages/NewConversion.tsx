import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Stepper, { Step } from "@/components/create-app/Stepper";
import WebsiteForm from "@/components/create-app/WebsiteForm";
import CustomizeForm from "@/components/create-app/CustomizeForm";
import ConfigureForm from "@/components/create-app/ConfigureForm";
import BuildForm from "@/components/create-app/BuildForm";
import AppPreview from "@/components/create-app/AppPreview";
import AppInfo from "@/components/create-app/AppInfo";
import SupportInfo from "@/components/common/SupportInfo";
import { ResolutionSelector } from "@/components/create-app/ResolutionSelector";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WebsiteFormData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const steps: Step[] = [
  { id: "website", title: "Website", description: "Enter URL", icon: "public" },
  { id: "customize", title: "Customize", description: "Design your app", icon: "brush" },
  { id: "configure", title: "Configure", description: "Technical settings", icon: "settings" },
  { id: "build", title: "Build", description: "Generate APK", icon: "download" },
];

const NewConversion = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState("website");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [appData, setAppData] = useState({
    appName: "",
    packageName: "",
    url: "",
    status: "pending" as "pending" | "valid" | "invalid" | "building" | "completed" | "failed"
  });
  const [appConfig, setAppConfig] = useState({
    resolutionPreset: "iphone14",
    previewWidth: 390,
    previewHeight: 844
  });
  const [activeTab, setActiveTab] = useState("preview");
  const [showGithubConnect, setShowGithubConnect] = useState(false);

  // Fetch app config when project ID changes
  useEffect(() => {
    if (projectId) {
      const fetchAppConfig = async () => {
        try {
          const response = await apiRequest("GET", `/api/projects/${projectId}`);
          const result = await response.json();
          
          if (result.appConfig) {
            setAppConfig({
              resolutionPreset: result.appConfig.resolutionPreset || "iphone14",
              previewWidth: result.appConfig.previewWidth || 390,
              previewHeight: result.appConfig.previewHeight || 844
            });
          }
        } catch (error) {
          console.error("Failed to fetch app config:", error);
        }
      };
      
      fetchAppConfig();
    }
  }, [projectId]);

  const handleWebsiteFormSubmit = async (data: WebsiteFormData) => {
    try {
      // Create a new project
      const response = await apiRequest("POST", "/api/projects", data);
      const result = await response.json();
      
      // Update project ID and app data
      setProjectId(result.project.id);
      setAppData({
        appName: data.appName,
        packageName: data.packageName,
        url: data.websiteUrl,
        status: "valid"
      });
      
      toast({
        title: "Project Created",
        description: "Website information saved successfully",
      });
      
      // Move to next step
      setCurrentStep("customize");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolutionChange = (resolution: string) => {
    const presets: Record<string, {width: number, height: number}> = {
      "iphone14": { width: 390, height: 844 },
      "pixel7": { width: 412, height: 915 },
      "galaxys23": { width: 360, height: 780 },
      "ipad": { width: 820, height: 1180 },
      "galaxytab": { width: 1600, height: 2560 },
      "desktop": { width: 1920, height: 1080 }
    };
    
    const preset = presets[resolution] || presets.iphone14;
    
    setAppConfig({
      resolutionPreset: resolution,
      previewWidth: preset.width,
      previewHeight: preset.height
    });
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleGithubConnect = () => {
    if (!projectId) {
      toast({
        title: "Project Not Created",
        description: "Please complete the website form first to create a project.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "GitHub Connection",
      description: "Connecting to GitHub repository...",
    });
    
    // Show GitHub options dialog
    setShowGithubConnect(true);
  };

  return (
    <>
      <Stepper steps={steps} currentStep={currentStep} />
      
      {currentStep === "website" && (
        <WebsiteForm onNext={handleWebsiteFormSubmit} />
      )}
      
      {currentStep === "customize" && projectId && (
        <CustomizeForm 
          projectId={projectId}
          onNext={() => setCurrentStep("configure")}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "configure" && projectId && (
        <ConfigureForm 
          projectId={projectId}
          onNext={() => setCurrentStep("build")}
          onBack={handleBack}
        />
      )}
      
      {currentStep === "build" && projectId && (
        <BuildForm 
          projectId={projectId}
          onBack={handleBack}
        />
      )}
      
      {/* GitHub Connect Dialog - Visible whenever button is clicked */}
      {showGithubConnect && projectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Connect to GitHub</h3>
            <p className="text-gray-600 mb-4">
              Save your app files to a GitHub repository to manage versions and collaborate with others.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center p-3 border rounded-md">
                <span className="material-icons text-gray-700 mr-3">link</span>
                <div className="flex-1">
                  <p className="font-medium">New Repository</p>
                  <p className="text-sm text-gray-500">Create a new repository for this project</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 border rounded-md">
                <span className="material-icons text-gray-700 mr-3">folder_shared</span>
                <div className="flex-1">
                  <p className="font-medium">Existing Repository</p>
                  <p className="text-sm text-gray-500">Connect to an existing repository</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowGithubConnect(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "GitHub Connected",
                    description: "Your project has been connected to GitHub",
                  });
                  setShowGithubConnect(false);
                }}
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4 mb-8">
        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-2 justify-end mb-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleGithubConnect}
            className="flex items-center"
          >
            <span className="material-icons text-gray-700 mr-1 text-sm">code</span>
            Connect to GitHub
          </Button>
          
          {projectId && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.open(`/api/projects/${projectId}/bundle`, "_blank")}
              className="flex items-center"
            >
              <span className="material-icons text-gray-700 mr-1 text-sm">view_in_ar</span>
              View Bundle
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
            <TabsTrigger value="preview">App Preview</TabsTrigger>
            <TabsTrigger value="resolution">Resolution</TabsTrigger>
            <TabsTrigger value="info">App Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <AppPreview 
                appName={appData.appName || ""}
                url={appData.url || ""}
                packageName={appData.packageName || ""}
                previewResolution={`${appConfig.previewWidth}x${appConfig.previewHeight}`}
              />
            </div>
            <div>
              <AppInfo 
                appName={appData.appName || ""}
                packageName={appData.packageName || ""}
                url={appData.url || ""}
                status={appData.status}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="resolution">
            {projectId && (
              <ResolutionSelector 
                projectId={projectId} 
                currentResolution={appConfig.resolutionPreset}
                onResolutionChange={handleResolutionChange}
              />
            )}
          </TabsContent>
          
          <TabsContent value="info">
            <AppInfo 
              appName={appData.appName || ""}
              packageName={appData.packageName || ""}
              url={appData.url || ""}
              status={appData.status}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <SupportInfo />
    </>
  );
};

export default NewConversion;
