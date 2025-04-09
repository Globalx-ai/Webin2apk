import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ResolutionSelectorProps {
  projectId: number;
  currentResolution?: string;
  onResolutionChange?: (resolution: string) => void;
}

interface Resolution {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
}

const DEVICE_RESOLUTIONS: Resolution[] = [
  { 
    id: "iphone14", 
    name: "iPhone 14", 
    width: 390, 
    height: 844,
    description: "Apple iPhone 14/15 series (390×844)" 
  },
  { 
    id: "pixel7", 
    name: "Google Pixel 7", 
    width: 412, 
    height: 915,
    description: "Google Pixel 7 (412×915)" 
  },
  { 
    id: "galaxys23", 
    name: "Samsung Galaxy S23", 
    width: 360, 
    height: 780,
    description: "Samsung Galaxy S23 series (360×780)" 
  },
  { 
    id: "ipad", 
    name: "iPad Air", 
    width: 820, 
    height: 1180,
    description: "Apple iPad Air (820×1180)" 
  },
  { 
    id: "galaxytab", 
    name: "Galaxy Tab S8", 
    width: 1600, 
    height: 2560,
    description: "Samsung Galaxy Tab S8 (1600×2560)" 
  },
  { 
    id: "desktop", 
    name: "Desktop", 
    width: 1920, 
    height: 1080,
    description: "Standard Desktop (1920×1080)" 
  }
];

export function ResolutionSelector({ projectId, currentResolution, onResolutionChange }: ResolutionSelectorProps) {
  const [selectedResolution, setSelectedResolution] = useState(currentResolution || "iphone14");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentResolution) {
      setSelectedResolution(currentResolution);
    }
  }, [currentResolution]);

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const resolution = DEVICE_RESOLUTIONS.find(r => r.id === selectedResolution);
      
      if (!resolution) {
        throw new Error("Invalid resolution selected");
      }
      
      // Update the project config
      const response = await apiRequest("PATCH", `/api/projects/${projectId}/config`, {
        resolutionPreset: selectedResolution,
        previewWidth: resolution.width,
        previewHeight: resolution.height,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update resolution");
      }
      
      if (onResolutionChange) {
        onResolutionChange(selectedResolution);
      }
      
      toast({
        title: "Resolution updated",
        description: `Preview resolution set to ${resolution.name} (${resolution.width}×${resolution.height})`,
      });
    } catch (error) {
      console.error("Error updating resolution:", error);
      toast({
        title: "Error",
        description: "Failed to update resolution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview Resolution</CardTitle>
        <CardDescription>
          Select a device resolution for preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedResolution} 
          onValueChange={setSelectedResolution}
          className="space-y-3"
        >
          {DEVICE_RESOLUTIONS.map((resolution) => (
            <div key={resolution.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
              <RadioGroupItem value={resolution.id} id={`resolution-${resolution.id}`} />
              <Label htmlFor={`resolution-${resolution.id}`} className="flex-1 cursor-pointer">
                <div className="font-medium">{resolution.name}</div>
                <div className="text-sm text-gray-500">{resolution.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || selectedResolution === currentResolution}
          className="w-full"
        >
          {submitting ? "Updating..." : "Apply Resolution"}
        </Button>
      </CardFooter>
    </Card>
  );
}