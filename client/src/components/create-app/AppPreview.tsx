import { useState, useEffect } from "react";

interface AppPreviewProps {
  appName: string;
  url: string | undefined;
  packageName: string;
}

const AppPreview = ({ appName, url, packageName }: AppPreviewProps) => {
  const [time, setTime] = useState("9:41");
  
  // Use static time to avoid potential re-render issues
  useEffect(() => {
    // Set time once when component mounts
    const now = new Date();
    setTime(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    // No interval to avoid potential update loops
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">Real-time Preview</h3>
      <p className="text-gray-600 mb-4">This is how your app will look on an Android device</p>
      
      {/* Device Frame Preview */}
      <div className="flex justify-center items-center">
        <div className="border-8 border-gray-800 rounded-3xl relative bg-white" style={{ width: "280px", height: "560px" }}>
          {/* Status Bar */}
          <div className="bg-gray-800 w-full p-2 flex justify-between items-center text-white text-xs">
            <div>{time}</div>
            <div className="flex space-x-1">
              <span className="material-icons text-sm">signal_cellular_alt</span>
              <span className="material-icons text-sm">wifi</span>
              <span className="material-icons text-sm">battery_full</span>
            </div>
          </div>
          
          {/* Notch */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black h-5 w-32 rounded-b-lg"></div>
          
          {/* App Content */}
          <div className="bg-gray-100 h-full flex flex-col overflow-hidden">
            {/* App Bar */}
            <div className="p-3 bg-blue-600 text-white flex items-center">
              <span className="material-icons mr-2">arrow_back</span>
              <span className="font-medium">{appName || "My App"}</span>
            </div>
            
            {/* App Content */}
            <div className="flex-1 flex items-center justify-center bg-white">
              {url ? (
                <div className="text-center p-4">
                  <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                    <span className="material-icons text-blue-600">public</span>
                  </div>
                  <p className="font-medium text-gray-800">{appName || "My App"}</p>
                  <p className="text-sm text-gray-600 mt-1 mb-3">Webview loading</p>
                  <div className="h-2 w-48 bg-gray-200 rounded-full mx-auto">
                    <div className="h-2 bg-blue-600 rounded-full w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <p className="text-gray-500 mt-4 text-sm">Enter a valid URL to see a preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreview;
