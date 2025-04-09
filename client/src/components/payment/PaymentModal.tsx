import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripePayment } from "./StripePayment";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StripeSubscription } from "./StripeSubscription";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onPaymentSuccess: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  projectId,
  onPaymentSuccess
}: PaymentModalProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<"one-time" | "subscription" | "use-subscription">("one-time");

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await apiRequest("POST", "/api/validate-coupon", {
        code: couponCode,
        projectId
      });
      
      const data = await response.json();
      
      if (data.valid) {
        toast({
          title: "Coupon Applied",
          description: `${data.message || "Discount applied successfully."}`,
        });
        setCouponApplied(true);
        
        // If it's a 100% discount coupon, automatically process the order
        if (data.discountPercent === 100) {
          await handleFreeBuild();
        }
      } else {
        toast({
          title: "Invalid Coupon",
          description: data.message || "This coupon code is not valid.",
          variant: "destructive",
        });
        setCouponApplied(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon code",
        variant: "destructive",
      });
      console.error("Coupon validation error:", error);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const { user } = useAuth();
  
  // Check for active subscription when component mounts
  useEffect(() => {
    if (user && user.subscriptionStatus === "active") {
      setHasActiveSubscription(true);
    } else {
      setHasActiveSubscription(false);
    }
  }, [user]);
  
  const handleFreeBuild = async () => {
    try {
      await apiRequest("POST", `/api/projects/${projectId}/payment`, {
        couponCode,
        useSubscription: false
      });
      
      // Invalidate project cache to reflect the payment status
      queryClient.invalidateQueries({queryKey: [`/api/projects/${projectId}`]});
      
      toast({
        title: "Success",
        description: "Your app is being built with the applied coupon",
      });
      
      onPaymentSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your request",
        variant: "destructive",
      });
      console.error("Free build error:", error);
    }
  };
  
  const handleSubscriptionBuild = async () => {
    try {
      const response = await apiRequest("POST", `/api/projects/${projectId}/payment`, {
        useSubscription: true
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Invalidate project cache to reflect the payment status
        queryClient.invalidateQueries({queryKey: [`/api/projects/${projectId}`]});
        
        toast({
          title: "Success",
          description: "Your app is being built using your active subscription",
        });
        
        onPaymentSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: data.error || "There was a problem using your subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your request",
        variant: "destructive",
      });
      console.error("Subscription build error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Choose your payment option to continue building your app.
          </DialogDescription>
        </DialogHeader>

        {hasActiveSubscription ? (
          // Show option to use existing subscription
          <div className="space-y-6 py-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-800">You have an active subscription!</h3>
              <p className="mt-1 text-sm text-green-700">
                You can use your subscription to build this app without additional payment.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubscriptionBuild}
              >
                Use Subscription
              </Button>
            </div>
          </div>
        ) : (
          // Show regular payment options
          <Tabs defaultValue="one-time" onValueChange={(value) => setPaymentType(value as "one-time" | "subscription")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">One-time Payment ($5)</TabsTrigger>
              <TabsTrigger value="subscription">Annual Subscription ($25)</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 mb-4">
              <div className="flex items-end gap-2">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="coupon">Coupon Code</Label>
                  <Input 
                    id="coupon" 
                    placeholder="Enter coupon code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                  />
                </div>
                <Button 
                  onClick={handleApplyCoupon} 
                  disabled={isValidatingCoupon || couponApplied}
                  variant="outline"
                >
                  {isValidatingCoupon ? "Validating..." : couponApplied ? "Applied" : "Apply"}
                </Button>
              </div>
              {couponApplied && (
                <p className="text-sm text-green-600 mt-2">
                  Coupon applied successfully!
                </p>
              )}
            </div>
            
            <TabsContent value="one-time">
              {!couponApplied && (
                <StripePayment 
                  projectId={projectId}
                  onPaymentSuccess={onPaymentSuccess}
                  onClose={() => onOpenChange(false)}
                />
              )}
            </TabsContent>
            
            <TabsContent value="subscription">
              {!couponApplied && (
                <StripeSubscription
                  onSubscriptionSuccess={() => {
                    onPaymentSuccess();
                    onOpenChange(false);
                  }}
                  onCancel={() => setPaymentType("one-time")}
                />
              )}
            </TabsContent>
            
            <p className="text-xs text-muted-foreground mt-6">
              Annual subscription ($25/year) includes unlimited app builds and priority support.
              First year free with subscription purchase.
            </p>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}