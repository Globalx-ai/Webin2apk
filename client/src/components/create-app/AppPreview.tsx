import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AppPreviewProps {
  appName: string;
  url: string | undefined;
  packageName: string;
  htmlContent?: string;
  sourceType?: "website" | "html" | "pdf";
  pdfFileName?: string;
}

// Using memo to prevent excessive re-renders
const AppPreview = memo(({ 
  appName, 
  url, 
  packageName, 
  htmlContent, 
  sourceType = "website",
  pdfFileName
}: AppPreviewProps) => {
  // Use a static time instead of a dynamic one to improve performance
  const staticTime = "9:41"; // Apple's marketing time
  const [showPreview, setShowPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset error when content changes
  useEffect(() => {
    setPreviewError(null);
  }, [url, htmlContent, pdfFileName, sourceType]);

  // Function to handle content loading simulation
  const loadPreviewContent = () => {
    setIsLoading(true);
    setPreviewError(null);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
      
      // Validation checks based on source type
      if (sourceType === "website" && !url) {
        setPreviewError("Please enter a valid website URL");
      } else if (sourceType === "html" && (!htmlContent || htmlContent.trim() === "")) {
        setPreviewError("Please enter HTML content");
      } else if (sourceType === "pdf" && !pdfFileName) {
        setPreviewError("Please upload a PDF file");
      }
    }, 1000);
  };

  // When show preview is clicked, attempt to load content
  const handleShowPreview = () => {
    setShowPreview(true);
    loadPreviewContent();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">App Preview</h3>
      <p className="text-gray-600 mb-4">See how your app will look on an Android device</p>
      
      {!showPreview ? (
        <div className="flex justify-center mt-8 mb-8">
          <Button 
            onClick={handleShowPreview}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <span className="material-icons mr-2">visibility</span>
            Show Preview
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="border-8 border-gray-800 rounded-3xl relative bg-white mb-4" style={{ width: "280px", height: "560px" }}>
            {/* Status Bar */}
            <div className="bg-gray-800 w-full p-2 flex justify-between items-center text-white text-xs">
              <div>{staticTime}</div>
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
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="animate-spin mx-auto mb-3">
                      <span className="material-icons text-blue-600 text-2xl">refresh</span>
                    </div>
                    <p className="font-medium text-gray-800">Loading Preview</p>
                    <p className="text-sm text-gray-600 mt-1 mb-3">Please wait...</p>
                    <div className="h-2 w-48 bg-gray-200 rounded-full mx-auto">
                      <div className="h-2 bg-blue-600 rounded-full w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="text-center p-4">
                    <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                      <span className="material-icons text-red-600">error_outline</span>
                    </div>
                    <p className="font-medium text-gray-800">Preview Error</p>
                    <p className="text-sm text-red-600 mt-1 mb-3">{previewError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadPreviewContent}
                    >
                      <span className="material-icons mr-1 text-sm">refresh</span>
                      Retry
                    </Button>
                  </div>
                ) : sourceType === "website" && url ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center text-xs">
                      <span className="material-icons text-gray-600 text-xs mr-1">lock</span>
                      <span className="truncate font-mono text-gray-700">{url}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <iframe 
                        src={url}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        title="Website Preview"
                        onError={() => setPreviewError("Failed to load website. This preview may not work for all sites, but your final app will render correctly.")}
                      />
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
                      Preview may be limited. Your final app will have full access to the website.
                    </div>
                  </div>
                ) : sourceType === "html" && htmlContent ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center text-xs">
                      <span className="material-icons text-green-600 text-xs mr-1">code</span>
                      <span className="font-medium text-gray-700">{appName || "HTML Preview"}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <iframe 
                        srcDoc={htmlContent}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts"
                        title="HTML Preview"
                        onError={() => setPreviewError("Failed to render HTML content.")}
                      />
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
                      Live HTML preview
                    </div>
                  </div>
                ) : sourceType === "pdf" && pdfFileName ? (
                  <div className="text-center p-4">
                    <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                      <span className="material-icons text-red-600">picture_as_pdf</span>
                    </div>
                    <p className="font-medium text-gray-800">{appName || "My App"}</p>
                    <p className="text-sm text-gray-600 mt-1 mb-3">PDF loaded</p>
                    <div className="flex items-center justify-center mb-2">
                      <span className="material-icons text-red-600 mr-1 text-sm">description</span>
                      <span className="text-xs">{pdfFileName}</span>
                    </div>
                    <div className="h-16 w-24 bg-gray-200 rounded mx-auto flex items-center justify-center">
                      <span className="material-icons text-gray-400">preview</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <p className="text-gray-500 mt-4 text-sm">
                      {sourceType === "website" 
                        ? "Enter a valid URL to see a preview" 
                        : sourceType === "html" 
                          ? "Enter HTML content to see a preview" 
                          : "Upload a PDF file to see a preview"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowPreview(false)}
              variant="outline"
              size="sm"
            >
              <span className="material-icons mr-2">visibility_off</span>
              Hide Preview
            </Button>
            
            {!isLoading && !previewError && (
              <Button 
                onClick={loadPreviewContent}
                variant="outline"
                size="sm"
              >
                <span className="material-icons mr-2">refresh</span>
                Refresh
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default AppPreview;