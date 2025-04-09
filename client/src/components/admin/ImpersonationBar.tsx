import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export const ImpersonationBar = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check URL parameters for impersonation flag
    const urlParams = new URLSearchParams(window.location.search);
    const impersonating = urlParams.get('impersonating');
    
    // Check localStorage for admin token
    const adminToken = localStorage.getItem('adminToken');
    
    setIsImpersonating(!!impersonating || !!adminToken);
    
    // Clean up URL if needed
    if (impersonating) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleReturnToAdmin = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        toast({
          title: "Error",
          description: "Admin session token not found",
          variant: "destructive",
        });
        return;
      }
      
      const response = await apiRequest("POST", "/api/admin/end-impersonation", { adminToken });
      
      if (response.ok) {
        // Remove the admin token
        localStorage.removeItem('adminToken');
        
        toast({
          title: "Success",
          description: "Returned to admin account successfully",
        });
        
        // Navigate to admin panel
        window.location.href = "/admin";
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to return to admin account",
          description: errorData.error || "An unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error returning to admin:", error);
      toast({
        title: "Error",
        description: "Failed to return to admin account",
        variant: "destructive",
      });
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-b border-yellow-200 p-2 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-800">
            You are viewing the application as a user. Admin session is active.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-yellow-50 border-yellow-300 text-yellow-800"
          onClick={handleReturnToAdmin}
        >
          <X className="h-4 w-4 mr-1" />
          Return to Admin Panel
        </Button>
      </div>
    </div>
  );
};