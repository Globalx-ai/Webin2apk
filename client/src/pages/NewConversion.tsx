import { useState } from "react";
import { useLocation } from "wouter";
import Stepper, { Step } from "@/components/create-app/Stepper";
import WebsiteForm from "@/components/create-app/WebsiteForm";
import CustomizeForm from "@/components/create-app/CustomizeForm";
import ConfigureForm from "@/components/create-app/ConfigureForm";
import BuildForm from "@/components/create-app/BuildForm";
import AppPreview from "@/components/create-app/AppPreview";
import AppInfo from "@/components/create-app/AppInfo";
import SupportInfo from "@/components/common/SupportInfo";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WebsiteFormData } from "@shared/schema";

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

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="col-span-2">
          <AppPreview 
            appName={appData.appName}
            url={appData.url}
            packageName={appData.packageName}
          />
        </div>
        <div>
          <AppInfo 
            appName={appData.appName}
            packageName={appData.packageName}
            url={appData.url}
            status={appData.status}
          />
        </div>
      </div>
      
      <SupportInfo />
    </>
  );
};

export default NewConversion;
