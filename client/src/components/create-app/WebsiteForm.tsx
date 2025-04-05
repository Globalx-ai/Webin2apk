import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  websiteUrl: z.string().url("Please enter a valid URL"),
  appName: z.string().min(3, "App name must be at least 3 characters"),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i, "Invalid package name format (e.g., com.example.app)"),
  description: z.string().optional(),
  enableJavaScript: z.boolean().default(true),
  enableDomStorage: z.boolean().default(true),
  enableZoom: z.boolean().default(false),
  enableCache: z.boolean().default(true),
  orientation: z.enum(["auto", "portrait", "landscape"]).default("auto"),
  offlineMode: z.enum(["none", "cache", "pwa"]).default("none"),
});

type FormValues = z.infer<typeof formSchema>;

interface WebsiteFormProps {
  onNext: (data: FormValues) => void;
}

const WebsiteForm = ({ onNext }: WebsiteFormProps) => {
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      websiteUrl: "",
      appName: "",
      packageName: "",
      description: "",
      enableJavaScript: true,
      enableDomStorage: true,
      enableZoom: false,
      enableCache: true,
      orientation: "auto",
      offlineMode: "none",
    },
  });

  const onSubmit = (data: FormValues) => {
    onNext(data);
  };

  const testUrl = async () => {
    const url = form.getValues("websiteUrl");
    
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a website URL to test",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidatingUrl(true);
    
    try {
      const response = await apiRequest("POST", "/api/validate-url", { websiteUrl: url });
      const result = await response.json();
      
      toast({
        title: "URL Validation",
        description: result.message,
        variant: result.valid ? "default" : "destructive",
      });
      
      // If URL is valid and we don't have an app name yet, generate one from the domain
      if (result.valid && !form.getValues("appName")) {
        try {
          const domain = new URL(url).hostname.replace("www.", "");
          const appName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
          form.setValue("appName", appName, { shouldValidate: true });
          
          // Generate a package name from the domain
          const packageName = `com.${domain.replace(/\./g, "_")}`;
          form.setValue("packageName", packageName, { shouldValidate: true });
        } catch (error) {
          // Ignore any errors when trying to create a default app name
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingUrl(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Step 1: Enter Website Details</h3>
          <p className="text-gray-600 mb-4">Provide the website URL you want to convert into an Android app</p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                          className="rounded-r-none"
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        onClick={testUrl}
                        disabled={isValidatingUrl}
                        variant="outline"
                        className="rounded-l-none border-l-0"
                      >
                        {isValidatingUrl ? "Testing..." : "Test"}
                      </Button>
                    </div>
                    <FormDescription>
                      Enter the full URL including https:// or http://
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>App Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My App" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will appear on the device home screen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="packageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input placeholder="com.example.myapp" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier (e.g., com.yourcompany.appname)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of your app..." 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Will be used in app store listings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center pt-4">
                <Collapsible
                  open={isAdvancedOpen}
                  onOpenChange={setIsAdvancedOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center cursor-pointer">
                      <Checkbox
                        id="advanced-options"
                        checked={isAdvancedOpen}
                        onCheckedChange={(checked) => setIsAdvancedOpen(!!checked)}
                      />
                      <label htmlFor="advanced-options" className="ml-2 block text-sm text-gray-600">
                        Show advanced options
                      </label>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-6 space-y-6 border-t pt-6">
                    <h4 className="text-lg font-medium mb-4">Advanced Options</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WebView Settings</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="enableJavaScript"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600">Enable JavaScript</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableDomStorage"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600">Enable DOM Storage</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableZoom"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600">Enable Zoom Controls</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="enableCache"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-600">Enable Cache</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="orientation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orientation</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              value={field.value} 
                              onValueChange={field.onChange}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="auto" />
                                </FormControl>
                                <FormLabel className="text-sm text-gray-600">Auto</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="portrait" />
                                </FormControl>
                                <FormLabel className="text-sm text-gray-600">Portrait</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="landscape" />
                                </FormControl>
                                <FormLabel className="text-sm text-gray-600">Landscape</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="offlineMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Offline Support</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select offline mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="cache">Basic Cache</SelectItem>
                              <SelectItem value="pwa">Progressive Web App (PWA)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Define how the app should behave without internet connection
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Continue
                  <span className="material-icons ml-1">arrow_forward</span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default WebsiteForm;
