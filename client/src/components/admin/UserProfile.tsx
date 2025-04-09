import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserProfileProps {
  userId: number;
  onClose: () => void;
  onImpersonate: (userId: number) => void;
}

interface UserDetails {
  id: number;
  username: string;
  email: string | null;
  createdAt: string;
  lastLogin: string;
  projectCount: number;
  conversionCount: number;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionExpiry: string | null;
  totalSpent: number;
}

interface UserProject {
  id: number;
  name: string;
  createdAt: string;
  status: string;
  type: string;
  isPaid: boolean;
}

export const UserProfile = ({ userId, onClose, onImpersonate }: UserProfileProps) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // For now, simulate the data - in a real app, we'd call the API
        // const response = await apiRequest("GET", `/api/admin/users/${userId}`);
        // const userData = await response.json();
        
        // Simulated user data
        const simulatedUser: UserDetails = {
          id: userId,
          username: `user${userId}`,
          email: `user${userId}@example.com`,
          createdAt: "2025-01-15T10:30:00Z",
          lastLogin: "2025-04-09T14:45:30Z",
          projectCount: 8,
          conversionCount: 12,
          subscriptionStatus: Math.random() > 0.5 ? 'active' : 'inactive',
          subscriptionExpiry: Math.random() > 0.5 ? "2026-01-15T10:30:00Z" : null,
          totalSpent: Math.floor(Math.random() * 200) + 50,
        };
        
        // Simulated projects
        const simulatedProjects: UserProject[] = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Project ${i + 1}`,
          createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
          status: Math.random() > 0.3 ? 'completed' : 'in_progress',
          type: ['website', 'html', 'pdf', 'code'][Math.floor(Math.random() * 4)],
          isPaid: Math.random() > 0.7,
        }));
        
        setUser(simulatedUser);
        setProjects(simulatedProjects);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, toast]);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-red-500">User not found</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onClose}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{user.username}'s Profile</CardTitle>
            <CardDescription>User ID: {user.id}</CardDescription>
          </div>
          <Badge className={user.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
            {user.subscriptionStatus === 'active' ? 'Subscribed' : 'Free User'}
          </Badge>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">User Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Username:</span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{user.email || "Not provided"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Login:</span>
                  <span className="font-medium">{new Date(user.lastLogin).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Activity Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Projects:</span>
                  <span className="font-medium">{user.projectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversions:</span>
                  <span className="font-medium">{user.conversionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subscription:</span>
                  <span className="font-medium">
                    {user.subscriptionStatus === 'active' 
                      ? `Active (Expires: ${new Date(user.subscriptionExpiry!).toLocaleDateString()})` 
                      : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Spent:</span>
                  <span className="font-medium">${user.totalSpent.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Projects</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Project Name</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Payment</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{project.id}</td>
                    <td className="px-4 py-2">{project.name}</td>
                    <td className="px-4 py-2">{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 capitalize">{project.type}</td>
                    <td className="px-4 py-2">
                      <Badge className={project.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}>
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={project.isPaid ? "default" : "outline"}>
                        {project.isPaid ? 'Paid' : 'Free'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No projects found for this user.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="billing" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Subscription Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge className={user.subscriptionStatus === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                    {user.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {user.subscriptionStatus === 'active' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Renewal Date:</span>
                      <span className="font-medium">{new Date(user.subscriptionExpiry!).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan:</span>
                      <span className="font-medium">Premium ($25/year)</span>
                    </div>
                  </>
                )}
              </div>
              
              {user.subscriptionStatus === 'active' && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // In a real app, this would interact with the API
                      toast({
                        title: "Not Implemented",
                        description: "This feature is not fully implemented in the demo",
                      });
                    }}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Transaction History</h3>
              <div className="space-y-2">
                <div className="border rounded p-3">
                  <div className="flex justify-between">
                    <span>Annual Subscription</span>
                    <span className="font-medium">$25.00</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()} - Visa ****4242
                  </div>
                </div>
                
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="border rounded p-3">
                    <div className="flex justify-between">
                      <span>App Conversion</span>
                      <span className="font-medium">$5.00</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(Date.now() - (i + 1) * 86400000 * 15).toLocaleDateString()} - Visa ****4242
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={() => onImpersonate(userId)}>
          Log in as {user.username}
        </Button>
      </CardFooter>
    </Card>
  );
};