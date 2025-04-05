import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SupportInfo from "@/components/common/SupportInfo";

interface Project {
  id: number;
  name: string;
  packageName: string;
  sourceUrl: string;
  description?: string;
  createdAt: string;
  status: string;
  apkDownloadUrl?: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/projects", undefined);
        const projectsData = await response.json();
        setProjects(projectsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome to Web2APK - Convert websites to Android apps
          </p>
        </div>
        <Link href="/new-conversion">
          <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
            <span className="material-icons mr-2">add</span>
            New Conversion
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {projects.length}
            </CardTitle>
            <CardDescription>Total Projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Apps you've created so far
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {projects.filter(p => p.status === "completed").length}
            </CardTitle>
            <CardDescription>Completed Apps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Apps ready for download
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">
              {projects.filter(p => p.status === "building").length}
            </CardTitle>
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Apps currently building
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.packageName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Source URL</div>
                  <div className="text-sm truncate">{project.sourceUrl}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Status</div>
                  <div>
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
              <CardFooter className="justify-between">
                <div className="text-xs text-gray-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {project.status === "completed" && project.apkDownloadUrl && (
                    <Link href={`/api/projects/${project.id}/download`}>
                      <Button size="sm" variant="outline">
                        <span className="material-icons text-sm mr-1">download</span>
                        Download
                      </Button>
                    </Link>
                  )}
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-4">
              <span className="material-icons text-gray-400 text-4xl">android</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first app to get started
            </p>
            <Link href="/new-conversion">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <span className="material-icons mr-2">add</span>
                Create First App
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <SupportInfo />
    </>
  );
};

export default Dashboard;
