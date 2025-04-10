import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Test Downloads</h2>
            <div className="flex flex-col gap-2">
              <a href="/downloads/Test_App_v1.0.apk" download>
                <Button className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Test APK (Static Path)
                </Button>
              </a>
              
              <a href="/api/test-download" download>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Test APK (API Path)
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
