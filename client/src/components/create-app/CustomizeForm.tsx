import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please enter a valid hex color"),
  customCss: z.string().optional(),
  customJs: z.string().optional(),
  splashScreenEnabled: z.boolean().default(false),
  splashScreenDuration: z.number().min(1000).max(10000).default(3000),
  splashScreenLogo: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomizeFormProps {
  projectId: number;
  onNext: () => void;
  onBack: () => void;
}

const CustomizeForm = ({ projectId, onNext, onBack }: CustomizeFormProps) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("theme");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryColor: "#3B82F6",
      accentColor: "#8B5CF6",
      customCss: "",
      customJs: "",
      splashScreenEnabled: false,
      splashScreenDuration: 3000,
    },
  });

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Icon image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIconPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    form.setValue("splashScreenLogo", file);
  };

  const uploadIcon = async (formData: FormData) => {
    try {
      const response = await apiRequest("POST", `/api/projects/${projectId}/icon`, undefined);
      return await response.json();
    } catch (error) {
      throw new Error("Failed to upload icon");
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Save theme settings
      await apiRequest("PATCH", `/api/projects/${projectId}/config`, {
        customCss: data.customCss,
        splashScreenEnabled: data.splashScreenEnabled,
        splashScreenDuration: data.splashScreenDuration,
      });
      
      // Upload icon if provided
      if (data.splashScreenLogo && data.splashScreenLogo instanceof File) {
        const formData = new FormData();
        formData.append("icon", data.splashScreenLogo);
        await uploadIcon(formData);
      }
      
      toast({
        title: "Success",
        description: "App customization saved successfully",
      });
      
      onNext();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customization settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">Step 2: Customize Your App</h3>
        <p className="text-gray-600 mb-4">Define how your app looks and feels</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="theme">Theme & Colors</TabsTrigger>
                <TabsTrigger value="splash">Splash Screen</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Styling</TabsTrigger>
              </TabsList>
              
              <TabsContent value="theme" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex space-x-2">
                          <div 
                            className="w-10 h-10 rounded border" 
                            style={{ backgroundColor: field.value }}
                          />
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Main color for toolbar and buttons
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <div className="flex space-x-2">
                          <div 
                            className="w-10 h-10 rounded border" 
                            style={{ backgroundColor: field.value }}
                          />
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Secondary color for highlights and interactions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Icon
                  </label>
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32">
                      {iconPreview ? (
                        <img 
                          src={iconPreview} 
                          alt="App icon preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <>
                          <span className="material-icons text-gray-400 text-3xl mb-2">
                            add_photo_alternate
                          </span>
                          <span className="text-xs text-gray-500 text-center">
                            Upload icon (1024x1024 recommended)
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        Upload a square image (PNG or JPEG), minimum 512x512 pixels. This will be used for app stores and device home screens.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="splash" className="space-y-6">
                <FormField
                  control={form.control}
                  name="splashScreenEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Splash Screen</FormLabel>
                        <FormDescription>
                          Display a splash screen when the app launches
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
                
                {form.watch("splashScreenEnabled") && (
                  <FormField
                    control={form.control}
                    name="splashScreenDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (milliseconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1000}
                            max={10000}
                            step={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long the splash screen should be displayed (1000-10000 ms)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-6">
                <FormField
                  control={form.control}
                  name="customCss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom CSS</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder=".my-class { color: red; }"
                          className="font-mono text-sm h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom CSS to inject into the WebView
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customJs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom JavaScript</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="document.addEventListener('DOMContentLoaded', function() { });"
                          className="font-mono text-sm h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom JavaScript to inject into the WebView
                      </FormDescription>
                      <FormMessage />
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

export default CustomizeForm;
