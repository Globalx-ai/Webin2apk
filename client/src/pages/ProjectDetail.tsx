import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, ExternalLink, ArrowLeft, RefreshCw, PlayCircle } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PDFViewer } from '@/components/pdf-viewer/PDFViewer';

// No props needed for this component since it gets the project ID from the URL
const ProjectDetail: React.FC = () => {
  const [, params] = useRoute('/projects/:id');
  const projectId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [buildStatus, setBuildStatus] = useState<string | null>(null);
  const [buildProgress, setBuildProgress] = useState<string[]>([]);

  // Fetch project details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/projects/${projectId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      return response.json();
    },
    enabled: !!projectId,
  });

  // Build mutation
  const buildMutation = useMutation({
    mutationFn: async () => {
      setBuildStatus('building');
      setBuildProgress(['Starting build process...']);
      
      const response = await apiRequest('POST', `/api/projects/${projectId}/build`, {
        buildType: 'android'
      });
      
      if (!response.ok) {
        throw new Error('Build failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setBuildStatus('completed');
      setBuildProgress(prev => [...prev, 'Build completed successfully']);
      
      toast({
        title: 'Build completed',
        description: 'Your app is ready for download',
      });
      
      refetch();
    },
    onError: (error) => {
      setBuildStatus('failed');
      setBuildProgress(prev => [...prev, `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      toast({
        title: 'Build failed',
        description: error instanceof Error ? error.message : 'Failed to build app',
        variant: 'destructive',
      });
    }
  });

  // Poll for build logs during build
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (buildStatus === 'building' && projectId) {
      interval = setInterval(async () => {
        try {
          const response = await apiRequest('GET', `/api/projects/${projectId}/build-logs`, undefined);
          if (response.ok) {
            const logs = await response.json();
            if (logs && logs.logs) {
              const logEntries = logs.logs.split('\n').filter(Boolean);
              setBuildProgress(logEntries);
              
              if (logs.status === 'completed') {
                setBuildStatus('completed');
                clearInterval(interval);
                refetch();
              } else if (logs.status === 'failed') {
                setBuildStatus('failed');
                clearInterval(interval);
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch build logs:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildStatus, projectId, refetch]);

  // If loading or error, show appropriate UI
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading project details...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load project details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { project, appConfig } = data;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-gray-500 mt-1">
            {project.packageName} • Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          {project.status === 'completed' && project.apkDownloadUrl && (
            <a href={`/api/projects/${project.id}/download`} download>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download APK
              </Button>
            </a>
          )}
          {(project.status === 'draft' || project.status === 'failed') && (
            <Button 
              disabled={buildMutation.isPending} 
              onClick={() => buildMutation.mutate()}
            >
              {buildMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Build App
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="source">Source</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="build">Build</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm">Application Name</h3>
                    <p>{project.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Package Name</h3>
                    <p>{project.packageName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Source URL</h3>
                    <p className="break-words">{project.sourceUrl || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Status</h3>
                    <div className="mt-1">
                      {project.status === "completed" && (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          Completed
                        </span>
                      )}
                      {project.status === "building" && (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          Building
                        </span>
                      )}
                      {project.status === "draft" && (
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                          Draft
                        </span>
                      )}
                      {project.status === "failed" && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {project.status === 'completed' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Download Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Android APK</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-500 mb-4">
                            Direct installation file for Android devices
                          </p>
                        </CardContent>
                        <CardFooter>
                          <a href={`/api/projects/${project.id}/download`} download>
                            <Button size="sm">
                              <Download className="mr-2 h-3 w-3" />
                              Download APK
                            </Button>
                          </a>
                        </CardFooter>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Android Bundle (AAB)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-500 mb-4">
                            App bundle for Google Play Store
                          </p>
                        </CardContent>
                        <CardFooter>
                          <a href={`/api/projects/${project.id}/bundle`} download>
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-3 w-3" />
                              Download AAB
                            </Button>
                          </a>
                        </CardFooter>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">iOS Package (IPA)</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-500 mb-4">
                            App bundle for Apple App Store
                          </p>
                        </CardContent>
                        <CardFooter>
                          <a href={`/api/projects/${project.id}/ios-bundle`} download>
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-3 w-3" />
                              Download IPA
                            </Button>
                          </a>
                        </CardFooter>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="source">
              <Card>
                <CardHeader>
                  <CardTitle>Source Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.sourceType === 'website' && project.sourceUrl && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">Website URL</h3>
                        <div className="flex items-center">
                          <p className="break-words mr-2">{project.sourceUrl}</p>
                          <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open URL</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                      <div className="border rounded p-2 bg-gray-50">
                        <iframe 
                          src={project.sourceUrl} 
                          className="w-full h-96 border rounded"
                          title="Website Preview"
                          sandbox="allow-same-origin allow-scripts"
                        />
                      </div>
                    </div>
                  )}
                  
                  {project.sourceType === 'html' && project.htmlContent && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">HTML Content</h3>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                          {project.htmlContent}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {project.sourceType === 'pdf' && project.pdfPath && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm mb-2">PDF Document</h3>
                        <PDFViewer 
                          pdfUrl={`/uploads/pdfs/${project.pdfPath}`} 
                          title={`${project.name} - PDF Preview`}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>App Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appConfig ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-sm">Orientation</h3>
                          <p>{appConfig.orientation || 'portrait'}</p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-sm">Offline Mode</h3>
                          <p>{appConfig.offlineMode || 'disabled'}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium text-sm mb-2">Features</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <li className="flex items-center">
                            <span className={`w-4 h-4 mr-2 rounded-full ${appConfig.enableJavaScript ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            JavaScript {appConfig.enableJavaScript ? 'Enabled' : 'Disabled'}
                          </li>
                          <li className="flex items-center">
                            <span className={`w-4 h-4 mr-2 rounded-full ${appConfig.enableDomStorage ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            DOM Storage {appConfig.enableDomStorage ? 'Enabled' : 'Disabled'}
                          </li>
                          <li className="flex items-center">
                            <span className={`w-4 h-4 mr-2 rounded-full ${appConfig.enableZoom ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            Zoom {appConfig.enableZoom ? 'Enabled' : 'Disabled'}
                          </li>
                          <li className="flex items-center">
                            <span className={`w-4 h-4 mr-2 rounded-full ${appConfig.enableCache ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            Cache {appConfig.enableCache ? 'Enabled' : 'Disabled'}
                          </li>
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium text-sm mb-2">Permissions</h3>
                        <div className="flex flex-wrap gap-2">
                          {appConfig.permissions?.map((permission: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>No configuration found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="build">
              <Card>
                <CardHeader>
                  <CardTitle>Build Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buildStatus === 'building' || project.status === 'building' ? (
                    <div>
                      <div className="flex items-center mb-4">
                        <Loader2 className="animate-spin h-5 w-5 mr-2 text-primary" />
                        <span>Building your app...</span>
                      </div>
                      
                      <div className="space-y-2">
                        {buildProgress.map((log, index) => (
                          <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : project.status === 'completed' ? (
                    <div>
                      <div className="flex items-center mb-4 text-green-600">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Build completed successfully</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-sm">Build Date</h3>
                          <p>{new Date(project.createdAt).toLocaleString()}</p>
                        </div>
                        
                        {project.apkDownloadUrl && (
                          <div>
                            <h3 className="font-medium text-sm">APK Download</h3>
                            <a 
                              href={`/api/projects/${project.id}/download`} 
                              download
                              className="text-blue-600 hover:underline flex items-center mt-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download APK
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : project.status === 'failed' ? (
                    <div>
                      <div className="flex items-center mb-4 text-red-600">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>Build failed</span>
                      </div>
                      
                      <Button onClick={() => buildMutation.mutate()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Build
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-4">Start a new build to generate your app.</p>
                      <Button onClick={() => buildMutation.mutate()}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Build
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>App Icon</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {project.iconPath ? (
                <img 
                  src={`/uploads/icons/${project.iconPath}/icon_playstore.png`} 
                  alt="App Icon" 
                  className="mx-auto w-32 h-32 rounded-lg border"
                />
              ) : (
                <div className="mx-auto w-32 h-32 rounded-lg border flex items-center justify-center bg-gray-100 text-gray-400">
                  No Icon
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.status === 'completed' && project.apkDownloadUrl && (
                <a href={`/api/projects/${project.id}/download`} download>
                  <Button className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download APK
                  </Button>
                </a>
              )}
              
              {project.status !== 'building' && (
                <Button 
                  className="w-full" 
                  disabled={buildMutation.isPending}
                  onClick={() => buildMutation.mutate()}
                >
                  {buildMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {project.status === 'completed' ? 'Rebuild App' : 'Build App'}
                    </>
                  )}
                </Button>
              )}
              
              {project.sourceUrl && (
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Source
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;