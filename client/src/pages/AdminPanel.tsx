import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

// Types for our admin data
interface UserLoginData {
  id: number;
  username: string; 
  lastLogin: string;
  ipAddress: string;
  loginCount: number;
}

interface ConversionStats {
  total: number;
  website: number;
  html: number;
  pdf: number;
  code: number;
  paid: number;
  free: number;
}

interface UserStats {
  total: number;
  active: number;
  subscribers: number;
}

interface RevenueData {
  month: string;
  amount: number;
}

interface BuildsByDay {
  date: string;
  count: number;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLogins, setUserLogins] = useState<UserLoginData[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversionStats, setConversionStats] = useState<ConversionStats>({
    total: 0,
    website: 0,
    html: 0,
    pdf: 0,
    code: 0,
    paid: 0,
    free: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    subscribers: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [buildsByDay, setBuildsByDay] = useState<BuildsByDay[]>([]);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    // For now, we'll use simulated data
    const fetchAdminData = async () => {
      setLoading(true);

      try {
        // This would be actual API calls in a real application
        // const userLoginsResponse = await apiRequest("GET", "/api/admin/user-logins");
        // const statsResponse = await apiRequest("GET", "/api/admin/stats");
        
        // Simulated data for demonstration
        const simulatedUserLogins: UserLoginData[] = [
          { id: 1, username: "user1", lastLogin: "2025-04-09 09:21:45", ipAddress: "192.168.1.1", loginCount: 15 },
          { id: 2, username: "user2", lastLogin: "2025-04-08 14:33:12", ipAddress: "192.168.1.22", loginCount: 8 },
          { id: 3, username: "user3", lastLogin: "2025-04-09 06:17:02", ipAddress: "192.168.1.105", loginCount: 23 },
          { id: 4, username: "user4", lastLogin: "2025-04-07 18:45:30", ipAddress: "192.168.1.87", loginCount: 5 },
          { id: 5, username: "user5", lastLogin: "2025-04-09 11:02:18", ipAddress: "192.168.1.44", loginCount: 12 },
        ];

        const simulatedConversionStats: ConversionStats = {
          total: 256,
          website: 152,
          html: 48,
          pdf: 32,
          code: 24,
          paid: 87,
          free: 169
        };

        const simulatedUserStats: UserStats = {
          total: 120,
          active: 78,
          subscribers: 42
        };

        const simulatedRevenueData: RevenueData[] = [
          { month: "Jan", amount: 1500 },
          { month: "Feb", amount: 2200 },
          { month: "Mar", amount: 1800 },
          { month: "Apr", amount: 2400 },
          { month: "May", amount: 2000 },
          { month: "Jun", amount: 2600 }
        ];

        const simulatedBuildsByDay: BuildsByDay[] = [
          { date: "04/03", count: 12 },
          { date: "04/04", count: 19 },
          { date: "04/05", count: 14 },
          { date: "04/06", count: 8 },
          { date: "04/07", count: 23 },
          { date: "04/08", count: 17 },
          { date: "04/09", count: 15 }
        ];

        setUserLogins(simulatedUserLogins);
        setConversionStats(simulatedConversionStats);
        setUserStats(simulatedUserStats);
        setRevenueData(simulatedRevenueData);
        setBuildsByDay(simulatedBuildsByDay);

      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [toast]);

  // Check if the current user is an admin
  // This would be better implemented with a proper role system
  const isAdmin = user?.username === "admin";

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <span className="material-icons mr-2">error</span>
              <h2 className="text-xl font-semibold">Access Denied</h2>
            </div>
            <p className="mt-2">You do not have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-4 mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{userStats.total}</CardTitle>
                <CardDescription>Total Users</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{userStats.active}</CardTitle>
                <CardDescription>Active Users</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{conversionStats.total}</CardTitle>
                <CardDescription>Total Conversions</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">${revenueData.reduce((sum, item) => sum + item.amount, 0)}</CardTitle>
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily App Builds</CardTitle>
                <CardDescription>Number of app builds per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildsByDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Builds" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Types</CardTitle>
                <CardDescription>Distribution of conversion types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Website', value: conversionStats.website },
                          { name: 'HTML', value: conversionStats.html },
                          { name: 'PDF', value: conversionStats.pdf },
                          { name: 'Code', value: conversionStats.code },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Website', value: conversionStats.website },
                          { name: 'HTML', value: conversionStats.html },
                          { name: 'PDF', value: conversionStats.pdf },
                          { name: 'Code', value: conversionStats.code },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Login Activity</CardTitle>
              <CardDescription>Recent user logins with IP addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">User ID</th>
                      <th className="px-4 py-2 text-left">Username</th>
                      <th className="px-4 py-2 text-left">Last Login</th>
                      <th className="px-4 py-2 text-left">IP Address</th>
                      <th className="px-4 py-2 text-left">Login Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogins.map((login) => (
                      <tr key={login.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{login.id}</td>
                        <td className="px-4 py-2">{login.username}</td>
                        <td className="px-4 py-2">{login.lastLogin}</td>
                        <td className="px-4 py-2">{login.ipAddress}</td>
                        <td className="px-4 py-2">{login.loginCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
                <CardDescription>Overview of user base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Free Users', value: userStats.active - userStats.subscribers },
                          { name: 'Subscribers', value: userStats.subscribers },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#FFBB28" />
                        <Cell fill="#00C49F" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Activity Metrics</CardTitle>
                <CardDescription>User engagement overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-lg mb-4">Key Metrics:</p>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Daily Active Users:</span>
                      <span className="font-medium">42</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Monthly Active Users:</span>
                      <span className="font-medium">78</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Average Session Duration:</span>
                      <span className="font-medium">18 min</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Average Conversions per User:</span>
                      <span className="font-medium">2.1</span>
                    </li>
                    <li className="flex justify-between">
                      <span>New User Registrations (Last 7 days):</span>
                      <span className="font-medium">34</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{conversionStats.total}</CardTitle>
                <CardDescription>Total Conversions</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{conversionStats.paid}</CardTitle>
                <CardDescription>Paid Conversions</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">{conversionStats.free}</CardTitle>
                <CardDescription>Free Conversions</CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversion Breakdown</CardTitle>
              <CardDescription>Detailed statistics by conversion type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Website', paid: Math.round(conversionStats.website * 0.34), free: conversionStats.website - Math.round(conversionStats.website * 0.34) },
                      { name: 'HTML', paid: Math.round(conversionStats.html * 0.34), free: conversionStats.html - Math.round(conversionStats.html * 0.34) },
                      { name: 'PDF', paid: Math.round(conversionStats.pdf * 0.34), free: conversionStats.pdf - Math.round(conversionStats.pdf * 0.34) },
                      { name: 'Code', paid: Math.round(conversionStats.code * 0.34), free: conversionStats.code - Math.round(conversionStats.code * 0.34) },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="paid" name="Paid Conversions" stackId="a" fill="#8884d8" />
                    <Bar dataKey="free" name="Free Conversions" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">${revenueData.reduce((sum, item) => sum + item.amount, 0)}</CardTitle>
                <CardDescription>Total Revenue</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">${Math.round(revenueData.reduce((sum, item) => sum + item.amount, 0) / 6)}</CardTitle>
                <CardDescription>Monthly Average</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl">${conversionStats.paid * 5 + userStats.subscribers * 25}</CardTitle>
                <CardDescription>Projected Annual Revenue</CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Legend />
                    <Bar dataKey="amount" name="Revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown by revenue source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'One-time Purchases', value: conversionStats.paid * 5 },
                          { name: 'Subscriptions', value: userStats.subscribers * 25 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#00C49F" />
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Financial performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Average Revenue Per User:</span>
                      <span className="font-medium">${((conversionStats.paid * 5 + userStats.subscribers * 25) / userStats.total).toFixed(2)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Conversion Rate (Free to Paid):</span>
                      <span className="font-medium">{((conversionStats.paid / conversionStats.total) * 100).toFixed(1)}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Subscription Rate:</span>
                      <span className="font-medium">{((userStats.subscribers / userStats.total) * 100).toFixed(1)}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Revenue Growth (Monthly):</span>
                      <span className="font-medium">+8.4%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Coupon Usage Rate:</span>
                      <span className="font-medium">12.3%</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;