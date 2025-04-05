import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitHubIntegration } from "@/components/github/GitHubIntegration";

interface BuildFormProps {
  projectId: number;
  onBack: () => void;
}

type BuildStatus = "idle" | "building" | "completed" | "failed";

interface FeatureOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDefault?: boolean;
  appStoreCompat?: string[];
}

// List of supported app stores
const APP_STORES = [
  { id: "google_play", name: "Google Play Store", icon: "store" },
  { id: "amazon", name: "Amazon App Store", icon: "shopping_cart" },
  { id: "samsung", name: "Samsung Galaxy Store", icon: "smartphone" },
  { id: "huawei", name: "Huawei AppGallery", icon: "apps" },
  { id: "xiaomi", name: "Xiaomi GetApps", icon: "apps" },
  { id: "oppo", name: "OPPO App Market", icon: "apps" },
  { id: "vivo", name: "Vivo App Store", icon: "apps" },
  { id: "fdroid", name: "F-Droid", icon: "android" },
  { id: "independent", name: "Direct Distribution", icon: "language" },
];

// App features list
const FEATURES: FeatureOption[] = [
  {
    id: "offline_support",
    name: "Offline Support",
    description: "Enable the app to work without an internet connection by caching content locally",
    icon: "offline_bolt",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "push_notifications",
    name: "Push Notifications",
    description: "Allow your app to receive notifications even when it's not running",
    icon: "notifications_active",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo"]
  },
  {
    id: "app_sharing",
    name: "App Sharing",
    description: "Enable users to share content from your app to other apps",
    icon: "share",
    isDefault: true,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "location_services",
    name: "Location Services",
    description: "Access device's location data for geo-specific features",
    icon: "location_on",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "camera_access",
    name: "Camera Access",
    description: "Allow the app to use the device's camera for photos/videos",
    icon: "camera_alt",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "file_downloads",
    name: "File Downloads",
    description: "Enable users to download files to their device",
    icon: "download",
    isDefault: true,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "dark_mode",
    name: "Dark Mode",
    description: "Provide a dark color scheme for your app",
    icon: "dark_mode",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo", "fdroid", "independent"]
  },
  {
    id: "auto_translation",
    name: "Auto Translation",
    description: "Automatically translate app content to the user's device language",
    icon: "translate",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo"]
  },
  {
    id: "analytics",
    name: "Analytics Integration",
    description: "Track app usage and behavior to improve user experience",
    icon: "insights",
    isDefault: false,
    appStoreCompat: ["google_play", "amazon", "samsung", "huawei", "xiaomi", "oppo", "vivo"]
  }
];

const BuildForm = ({ projectId, onBack }: BuildFormProps) => {
  const { toast } = useToast();
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("features");
  const [targetStores, setTargetStores] = useState<string[]>(["google_play", "amazon"]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(FEATURES.filter(f => f.isDefault).map(f => f.id));

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

  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId) 
        : [...prev, featureId]
    );
  };
  
  // Toggle app store selection
  const toggleStore = (storeId: string) => {
    setTargetStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId) 
        : [...prev, storeId]
    );
    
    // Update features based on compatibility with selected stores
    if (!targetStores.includes(storeId)) {
      // Store was added, no need to check compatibility
      return;
    }
    
    // Store was removed, need to check if any features are incompatible with remaining stores
    const remainingStores = targetStores.filter(id => id !== storeId);
    if (remainingStores.length === 0) {
      return; // Don't disable features if no stores are selected
    }
    
    // Filter out features that aren't compatible with any of the remaining stores
    setSelectedFeatures(prev => {
      return prev.filter(featureId => {
        const feature = FEATURES.find(f => f.id === featureId);
        if (!feature || !feature.appStoreCompat) return true; // Keep if no compat info
        return feature.appStoreCompat.some(id => remainingStores.includes(id));
      });
    });
  };
  
  const startBuild = async () => {
    setBuildStatus("building");
    setProgress(0);
    setError(null);
    
    try {
      // Include selected features and target stores in the build request
      const response = await apiRequest("POST", `/api/projects/${projectId}/build`, {
        features: selectedFeatures,
        targetStores: targetStores
      });
      
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
  
  const downloadAab = () => {
    window.location.href = `/api/projects/${projectId}/bundle`;
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Step 4: Build Your App</h3>
        <p className="text-gray-600 mb-6">Generate the Android APK file for your app</p>
        
        {buildStatus === "idle" && (
          <div>
            <Tabs 
              defaultValue="features" 
              value={selectedTab} 
              onValueChange={setSelectedTab}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-2 mb-6 w-full max-w-md mx-auto">
                <TabsTrigger value="features">
                  <span className="material-icons mr-2 text-sm">extension</span>
                  App Features
                </TabsTrigger>
                <TabsTrigger value="stores">
                  <span className="material-icons mr-2 text-sm">store</span>
                  App Stores
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="features">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {FEATURES.map(feature => (
                    <Card 
                      key={feature.id} 
                      className={selectedFeatures.includes(feature.id) ? 
                        "border-2 border-blue-500 shadow-md" : 
                        "hover:border-gray-300"
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="material-icons text-blue-600">{feature.icon}</span>
                          </div>
                          <CardTitle className="text-base font-medium">{feature.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-xs">{feature.description}</CardDescription>
                        <div className="pt-3 flex justify-between items-center">
                          <div className="text-xs">
                            {feature.isDefault && (
                              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div>
                            <Checkbox 
                              id={`feature-${feature.id}`}
                              checked={selectedFeatures.includes(feature.id)}
                              onCheckedChange={() => toggleFeature(feature.id)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="stores">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {APP_STORES.map(store => (
                    <Card 
                      key={store.id} 
                      className={targetStores.includes(store.id) ? 
                        "border-2 border-blue-500 shadow-md" : 
                        "hover:border-gray-300"
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="material-icons text-blue-600">{store.icon}</span>
                          </div>
                          <CardTitle className="text-base font-medium">{store.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex justify-end">
                          <Checkbox 
                            id={`store-${store.id}`}
                            checked={targetStores.includes(store.id)}
                            onCheckedChange={() => toggleStore(store.id)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="text-center py-6">
              <div className="mb-6">
                <span className="material-icons text-6xl text-blue-600">android</span>
              </div>
              <h4 className="text-lg font-medium mb-2">Ready to Build</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your app is configured and ready to be built with {selectedFeatures.length} features
                for {targetStores.length} app store{targetStores.length !== 1 ? 's' : ''}.
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
              Your app has been built successfully and is ready for download.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={downloadApk}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  size="lg"
                >
                  <span className="material-icons mr-2">android</span>
                  Download APK
                </Button>
                
                {targetStores.includes("google_play") && (
                  <Button 
                    onClick={downloadAab}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    size="lg"
                  >
                    <span className="material-icons mr-2">store</span>
                    Download AAB Bundle
                  </Button>
                )}
              </div>
              
              <div className="pt-2 px-4 text-xs text-gray-500 max-w-md mx-auto">
                <p className="mb-2">• APK file: Direct installation on Android devices</p>
                {targetStores.includes("google_play") && (
                  <p>• AAB bundle: For publishing on Google Play Store</p>
                )}
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={startBuild}
                  variant="outline"
                >
                  <span className="material-icons mr-2">replay</span>
                  Rebuild with Different Settings
                </Button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h5 className="text-lg font-medium mb-4">Save to GitHub</h5>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                  Save your app source code to GitHub and share it with others or continue development.
                </p>
                <div className="max-w-md mx-auto">
                  <GitHubIntegration 
                    projectId={projectId} 
                    onSuccess={(repoUrl) => {
                      toast({
                        title: "GitHub Repository Created",
                        description: `Your app has been successfully pushed to GitHub`,
                      });
                    }}
                  />
                </div>
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
