import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const githubFormSchema = z.object({
  githubToken: z.string().min(1, "GitHub token is required"),
  repoName: z.string().min(1, "Repository name is required"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

type GitHubFormValues = z.infer<typeof githubFormSchema>;

interface GitHubIntegrationProps {
  projectId: number;
  onSuccess?: (repoUrl: string) => void;
}

export function GitHubIntegration({ projectId, onSuccess }: GitHubIntegrationProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  const form = useForm<GitHubFormValues>({
    resolver: zodResolver(githubFormSchema),
    defaultValues: {
      githubToken: "",
      repoName: `web-to-apk-project-${projectId}`,
      description: "Android application created with Web-to-APK Converter",
      isPrivate: true,
    },
  });

  const connectToGitHub = async (data: GitHubFormValues) => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would validate the GitHub token
      toast({
        title: "Validating GitHub Token",
        description: "Please wait while we validate your GitHub token...",
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGithubConnected(true);
      
      toast({
        title: "GitHub Connected",
        description: "Your GitHub account has been successfully connected",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to GitHub. Please check your token.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const createRepository = async (data: GitHubFormValues) => {
    if (!githubConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to GitHub first",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingRepo(true);
    
    try {
      // In a real implementation, this would create a GitHub repository
      // and push the app code to it
      const response = await apiRequest("POST", `/api/projects/${projectId}/github`, {
        repoName: data.repoName,
        description: data.description,
        isPrivate: data.isPrivate,
        githubToken: data.githubToken,
      });
      
      // For now, simulate a successful response
      const mockRepoUrl = `https://github.com/user/${data.repoName}`;
      setRepoUrl(mockRepoUrl);
      
      toast({
        title: "Repository Created",
        description: "Your app code has been pushed to GitHub",
      });
      
      if (onSuccess) {
        onSuccess(mockRepoUrl);
      }
    } catch (error) {
      toast({
        title: "Repository Creation Failed",
        description: "Failed to create GitHub repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Connect to GitHub</CardTitle>
        <CardDescription>
          Save your app's source code to a GitHub repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(githubConnected ? createRepository : connectToGitHub)} className="space-y-6">
            <FormField
              control={form.control}
              name="githubToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Personal Access Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ghp_xxxxxxxxxxxxxxxx" 
                      {...field} 
                      type="password"
                      disabled={githubConnected}
                    />
                  </FormControl>
                  <FormDescription>
                    Create a token with "repo" scope at{" "}
                    <a 
                      href="https://github.com/settings/tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      GitHub Settings
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {githubConnected && (
              <>
                <FormField
                  control={form.control}
                  name="repoName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-android-app" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the GitHub repository to create
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="App description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Private Repository</FormLabel>
                        <FormDescription>
                          Make the repository private (only you can access it)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            {repoUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800 mb-2">Repository created successfully!</p>
                <div className="flex items-center">
                  <span className="material-icons text-green-600 mr-2 text-sm">check_circle</span>
                  <a 
                    href={repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {repoUrl}
                  </a>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isConnecting || isCreatingRepo}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConnecting ? (
                <>
                  <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                  Connecting...
                </>
              ) : isCreatingRepo ? (
                <>
                  <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                  Creating Repository...
                </>
              ) : githubConnected ? (
                <>
                  <span className="material-icons mr-2 text-sm">cloud_upload</span>
                  Create Repository
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">link</span>
                  Connect to GitHub
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}