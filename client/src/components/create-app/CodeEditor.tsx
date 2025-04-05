import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const codePromptSchema = z.object({
  language: z.string().min(1, "Language is required"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
});

type CodePromptValues = z.infer<typeof codePromptSchema>;

// Form validation schema for existing code
const existingCodeSchema = z.object({
  language: z.string().min(1, "Language is required"),
  code: z.string().min(1, "Code is required"),
});

type ExistingCodeValues = z.infer<typeof existingCodeSchema>;

interface CodeEditorProps {
  onCodeGenerated?: (code: string, language: string) => void;
}

export default function CodeEditor({ onCodeGenerated }: CodeEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"generate" | "improve" | "preview">("generate");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [codeExplanation, setCodeExplanation] = useState<string>("");
  const [previewReady, setPreviewReady] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("html");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Form for generating new code
  const generateForm = useForm<CodePromptValues>({
    resolver: zodResolver(codePromptSchema),
    defaultValues: {
      language: "html",
      prompt: "",
    },
  });

  // Form for improving existing code
  const improveForm = useForm<ExistingCodeValues>({
    resolver: zodResolver(existingCodeSchema),
    defaultValues: {
      language: "html",
      code: "",
    },
  });

  // Update selected language when it changes in the form
  useEffect(() => {
    const subscription = generateForm.watch((value, { name }) => {
      if (name === "language" && value.language) {
        setSelectedLanguage(value.language);
      }
    });
    return () => subscription.unsubscribe();
  }, [generateForm.watch]);

  // Function to generate code with AI
  const handleGenerateCode = async (data: CodePromptValues) => {
    setIsGenerating(true);
    setPreviewReady(false);
    
    try {
      const response = await apiRequest("POST", "/api/fetch-code", {
        language: data.language,
        prompt: data.prompt,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      setGeneratedCode(result.code);
      setCodeExplanation(result.explanation);
      setSelectedLanguage(result.language);
      
      toast({
        title: "Code Generated",
        description: "AI has generated code based on your prompt",
      });
      
      if (onCodeGenerated) {
        onCodeGenerated(result.code, result.language);
      }
      
      // Switch to preview tab after successful generation
      setActiveTab("preview");
      setPreviewReady(true);
      createPreviewUrl(result.code, result.language);
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to improve existing code with AI
  const handleImproveCode = async (data: ExistingCodeValues) => {
    setIsImproving(true);
    setPreviewReady(false);
    
    try {
      const response = await apiRequest("POST", "/api/improve-code", {
        language: data.language,
        code: data.code,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      setGeneratedCode(result.improvedCode);
      setCodeExplanation(result.explanation);
      setSelectedLanguage(result.language);
      
      toast({
        title: "Code Improved",
        description: "AI has improved your code",
      });
      
      if (onCodeGenerated) {
        onCodeGenerated(result.improvedCode, result.language);
      }
      
      // Switch to preview tab after successful improvement
      setActiveTab("preview");
      setPreviewReady(true);
      createPreviewUrl(result.improvedCode, result.language);
    } catch (error) {
      console.error("Error improving code:", error);
      toast({
        title: "Improvement Failed",
        description: "Failed to improve code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImproving(false);
    }
  };

  // Create a preview URL for the code
  const createPreviewUrl = (code: string, language: string) => {
    try {
      // For HTML, we can create a data URL
      if (language === "html") {
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(code)}`;
        setPreviewUrl(dataUrl);
        return;
      }
      
      // For other languages, we'll use online compilers
      let compilerUrl = "";
      
      switch (language) {
        case "javascript":
        case "js":
          compilerUrl = `https://jsfiddle.net/#togetherjs=${Date.now()}`;
          break;
        case "python":
          compilerUrl = "https://replit.com/languages/python3";
          break;
        case "java":
          compilerUrl = "https://www.jdoodle.com/online-java-compiler/";
          break;
        default:
          compilerUrl = "https://codepen.io/pen/";
      }
      
      setPreviewUrl(compilerUrl);
    } catch (error) {
      console.error("Error creating preview URL:", error);
      toast({
        title: "Preview Failed",
        description: "Failed to create code preview.",
        variant: "destructive",
      });
    }
  };

  // Function to use the generated code in the app
  const handleUseCode = () => {
    if (onCodeGenerated && generatedCode) {
      onCodeGenerated(generatedCode, selectedLanguage);
      toast({
        title: "Code Applied",
        description: "The code has been applied to your app",
      });
    }
  };

  // Render appropriate preview based on language
  const renderPreview = () => {
    if (!previewReady) {
      return (
        <div className="flex items-center justify-center h-[400px] bg-gray-100 dark:bg-gray-800 rounded-md">
          <p className="text-gray-500 dark:text-gray-400">Generate or improve code to see preview</p>
        </div>
      );
    }

    if (selectedLanguage === "html") {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[400px] border-0 rounded-md bg-white"
          title="Code Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[300px]">
          <pre className="text-sm"><code>{generatedCode}</code></pre>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">To preview this code:</h4>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Copy the code above</li>
            <li>
              <a 
                href={previewUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                Open online compiler
              </a>
            </li>
            <li>Paste the code and run it</li>
          </ol>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Code Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="improve">Improve Existing</TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewReady}>Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate">
            <Form {...generateForm}>
              <form onSubmit={generateForm.handleSubmit(handleGenerateCode)} className="space-y-4">
                <FormField
                  control={generateForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programming Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java (Android)</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generateForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What would you like to create?</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g., Create a responsive navigation menu with dropdown for mobile" 
                          className="h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Describe the code you want to generate in detail
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2 text-sm">code</span>
                      Generate Code
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="improve">
            <Form {...improveForm}>
              <form onSubmit={improveForm.handleSubmit(handleImproveCode)} className="space-y-4">
                <FormField
                  control={improveForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programming Language</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="java">Java (Android)</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={improveForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Code</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste your code here..." 
                          className="h-48 font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Paste the code you want to improve or optimize
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isImproving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isImproving ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                      Improving...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2 text-sm">auto_fix_high</span>
                      Improve Code
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Preview</h3>
                {renderPreview()}
              </div>
              
              {codeExplanation && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Explanation</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                    <p className="text-sm">{codeExplanation}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleUseCode()}>
                  <span className="material-icons mr-2 text-sm">check</span>
                  Use This Code
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}