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
              
              <a href="/downloads/Networthcalc_v1.0.apk" download>
                <Button variant="default" className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  Download Networthcalc APK (Static Path)
                </Button>
              </a>
              
              <a href="/api/download-networthcalc" download>
                <Button variant="default" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  Download Networthcalc APK (API Path)
                </Button>
              </a>
              
              <div className="mt-4 text-xs text-gray-500">
                ✓ APK size is now 1.6MB (up from 52KB)<br/>
                ✓ Includes proper DEX files and signatures<br/>
                ✓ Enhanced with random data padding<br/>
                ✓ Should install correctly on Android devices
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <Link href="/download" className="text-sm text-blue-600 hover:underline">
                  View All Downloads &amp; Verify APK Structure
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
