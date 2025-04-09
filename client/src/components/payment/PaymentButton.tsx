import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "./PaymentModal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface PaymentButtonProps extends ButtonProps {
  projectId: number;
  onPaymentSuccess?: () => void;
  paymentText?: string;
}

export function PaymentButton({
  projectId,
  onPaymentSuccess,
  paymentText = "Continue to Payment",
  ...props
}: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePaymentClick = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user has an active subscription
      if (user.subscriptionStatus === "active") {
        // If user has subscription, proceed without payment
        await apiRequest("POST", `/api/projects/${projectId}/payment`, {
          // Use subscription instead of one-time payment
          useSubscription: true 
        });
        
        toast({
          title: "Processing Request",
          description: "Your app is being prepared with your subscription",
        });
        
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        // Open payment modal for users without subscription
        setIsModalOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your request",
        variant: "destructive",
      });
      console.error("Payment error:", error);
    }
  };

  return (
    <>
      <Button
        onClick={handlePaymentClick}
        {...props}
      >
        {paymentText}
      </Button>
      
      <PaymentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
        onPaymentSuccess={() => {
          if (onPaymentSuccess) {
            onPaymentSuccess();
          }
        }}
      />
    </>
  );
}