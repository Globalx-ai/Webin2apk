import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileCheck, RefreshCw, Info, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function DownloadPage() {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const verifyApk = async (filename: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/verify-apk/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Verification failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setVerificationResult(data);
      
      toast({
        title: "APK Verification Complete",
        description: data.status === "good" 
          ? "The APK structure looks good and should install correctly" 
          : "There may be issues with this APK. See details for more information.",
        variant: data.status === "good" ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify APK",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Download Mobile Apps</h1>
          <p className="text-muted-foreground">
            Get access to our pre-built mobile applications that are ready to install
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-500" />
                Networthcalc App
              </CardTitle>
              <CardDescription>
                Financial expense and income tracking application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File Size:</span>
                  <span className="text-sm text-muted-foreground">1.6 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform:</span>
                  <span className="text-sm text-muted-foreground">Android 5.0+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <span className="text-sm text-muted-foreground">1.0</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a href="/api/download-networthcalc" download className="w-full">
                    <Button variant="default" className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700">
                      <Download className="h-4 w-4" />
                      Download APK
                    </Button>
                  </a>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2" 
                    onClick={() => verifyApk('Networthcalc_v1.0.apk')}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Verify APK Structure
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="text-xs text-muted-foreground pt-2">
                <strong>Note:</strong> This APK is properly structured and signed. It should install correctly on Android devices.
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-500" />
                Test App
              </CardTitle>
              <CardDescription>
                Test application to verify APK installation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File Size:</span>
                  <span className="text-sm text-muted-foreground">1.6 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform:</span>
                  <span className="text-sm text-muted-foreground">Android 5.0+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <span className="text-sm text-muted-foreground">1.0</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a href="/api/test-download" download className="w-full">
                    <Button variant="default" className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Download className="h-4 w-4" />
                      Download APK
                    </Button>
                  </a>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2" 
                    onClick={() => verifyApk('Test_App_v1.0.apk')}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Verify APK Structure
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="text-xs text-muted-foreground pt-2">
                <strong>Note:</strong> This is a simple test app that loads a default web page.
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {verificationResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                APK Verification Results
              </CardTitle>
              <CardDescription>
                Analysis of the APK file structure and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filename:</span>
                  <span className="text-sm text-muted-foreground">{verificationResult.filename}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm text-muted-foreground">{verificationResult.size.formatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-sm font-medium ${
                    verificationResult.status === 'good' ? 'text-green-500' : 
                    verificationResult.status === 'warning' ? 'text-yellow-500' : 
                    verificationResult.status === 'error' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {verificationResult.status.charAt(0).toUpperCase() + verificationResult.status.slice(1)}
                  </span>
                </div>
                
                {verificationResult.issues && verificationResult.issues.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Issues:</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      {verificationResult.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verificationResult.structure && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Structure:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${verificationResult.structure.hasManifest ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">AndroidManifest.xml</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${verificationResult.structure.hasClasses ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">classes.dex</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${verificationResult.structure.hasResources ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">resources.arsc</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${verificationResult.structure.hasMetaInf ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">META-INF</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {verificationResult.structure && verificationResult.structure.fileList && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">File List (first 20 entries):</h4>
                    <div className="text-xs text-muted-foreground border rounded-md p-2 bg-muted/50 overflow-x-auto">
                      <pre>{verificationResult.structure.fileList.join('\n')}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            Need to create your own app? <Link href="/new-conversion" className="text-primary hover:underline">Start a new conversion</Link> or <Link href="/projects" className="text-primary hover:underline">view your projects</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}