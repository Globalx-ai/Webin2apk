import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

const Projects = () => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "building":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Building</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-gray-500 mt-1">
            View and manage your app conversion projects
          </p>
        </div>
        <Link href="/new-conversion">
          <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
            <span className="material-icons mr-2">add</span>
            New Conversion
          </Button>
        </Link>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ) : projects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.packageName}</TableCell>
                    <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <span className="material-icons text-gray-400 text-4xl">folder_open</span>
              </div>
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
                You haven't created any app conversion projects yet
              </p>
              <Link href="/new-conversion">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <span className="material-icons mr-2">add</span>
                  Create First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
        {projects.length > 0 && (
          <CardFooter className="justify-between">
            <div className="text-sm text-gray-500">
              Showing {projects.length} projects
            </div>
          </CardFooter>
        )}
      </Card>

      <SupportInfo />
    </>
  );
};

export default Projects;
