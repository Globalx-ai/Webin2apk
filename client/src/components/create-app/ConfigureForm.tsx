import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  permissions: z.array(z.string()).default([]),
  keystorePassword: z.string().min(6, "Password must be at least 6 characters").optional(),
  keystoreAlias: z.string().min(1, "Alias is required").optional(),
  adMobEnabled: z.boolean().default(false),
  adMobAppId: z.string().optional(),
  adMobBannerId: z.string().optional(),
  adMobInterstitialId: z.string().optional(),
  firebaseEnabled: z.boolean().default(false),
  firebaseConfig: z.string().optional(),
  pushNotifications: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const availablePermissions = [
  { id: "INTERNET", label: "Internet" },
  { id: "ACCESS_NETWORK_STATE", label: "Network State" },
  { id: "CAMERA", label: "Camera" },
  { id: "ACCESS_FINE_LOCATION", label: "Fine Location" },
  { id: "ACCESS_COARSE_LOCATION", label: "Coarse Location" },
  { id: "READ_EXTERNAL_STORAGE", label: "Read Storage" },
  { id: "WRITE_EXTERNAL_STORAGE", label: "Write Storage" },
];

interface ConfigureFormProps {
  projectId: number;
  onNext: () => void;
  onBack: () => void;
}

const ConfigureForm = ({ projectId, onNext, onBack }: ConfigureFormProps) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("permissions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      permissions: ["INTERNET"],
      adMobEnabled: false,
      firebaseEnabled: false,
      pushNotifications: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Save app configuration
      await apiRequest("PATCH", `/api/projects/${projectId}/config`, {
        permissions: data.permissions,
        adMobEnabled: data.adMobEnabled,
        adMobAppId: data.adMobAppId,
        adMobBannerId: data.adMobBannerId,
        adMobInterstitialId: data.adMobInterstitialId,
      });
      
      toast({
        title: "Success",
        description: "App configuration saved successfully",
      });
      
      onNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save app configuration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Step 3: Configure Technical Settings</h3>
        <p className="text-gray-600 mb-4">Set up permissions, keys, and integrations</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="signing">App Signing</TabsTrigger>
                <TabsTrigger value="monetization">Monetization</TabsTrigger>
              </TabsList>
              
              <TabsContent value="permissions" className="space-y-6">
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Android Permissions</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {availablePermissions.map((permission) => (
                          <FormField
                            key={permission.id}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, permission.id]);
                                      } else {
                                        field.onChange(
                                          field.value?.filter((value) => value !== permission.id)
                                        );
                                      }
                                    }}
                                    // Internet permission is required and can't be disabled
                                    disabled={permission.id === "INTERNET"}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-gray-600">
                                  {permission.label}
                                  {permission.id === "INTERNET" && " (Required)"}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormDescription>
                        Select the permissions your app needs. Be mindful that excessive permissions may affect user trust.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Push Notifications</FormLabel>
                        <FormDescription>
                          Enable Firebase Cloud Messaging for push notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="signing" className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">App Signing Key</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    A keystore will be automatically generated for you. You can provide custom details below or leave blank for defaults.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="keystoreAlias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Alias</FormLabel>
                          <FormControl>
                            <Input placeholder="app-alias" {...field} />
                          </FormControl>
                          <FormDescription>
                            Unique name for the key
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="keystorePassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter secure password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Secure password for the keystore
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                  <div className="flex items-start">
                    <span className="material-icons text-yellow-400 mr-3">warning</span>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Keep your keystore file and password secure. If lost, you won't be able to update your app on the Google Play Store.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="monetization" className="space-y-6">
                <FormField
                  control={form.control}
                  name="adMobEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">AdMob Integration</FormLabel>
                        <FormDescription>
                          Enable Google AdMob for monetization
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch("adMobEnabled") && (
                  <div className="space-y-4 p-4 rounded-lg border">
                    <FormField
                      control={form.control}
                      name="adMobAppId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AdMob App ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="adMobBannerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner Ad Unit ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="adMobInterstitialId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interstitial Ad Unit ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="firebaseEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Firebase Analytics</FormLabel>
                        <FormDescription>
                          Track app usage and performance
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
              >
                <span className="material-icons mr-1">arrow_backward</span>
                Back
              </Button>
              
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Continue"}
                <span className="material-icons ml-1">arrow_forward</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ConfigureForm;
