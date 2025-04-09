import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe with the public key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionFormProps {
  onSubscriptionSuccess: () => void;
  onCancel: () => void;
}

const SubscriptionForm = ({ onSubscriptionSuccess, onCancel }: SubscriptionFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    // Use the stripe.confirmPayment method to complete the payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Subscription Failed",
        description: error.message || "Something went wrong with your subscription.",
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      // Subscription succeeded
      try {
        // Update the user's subscription status
        await apiRequest("POST", "/api/update-subscription-status", {
          status: "active",
        });
        
        // Invalidate user data to refresh subscription status
        queryClient.invalidateQueries({queryKey: ["/api/user"]});
        
        toast({
          title: "Subscription Successful",
          description: "Your annual subscription is now active. Build unlimited apps for the next year!",
        });
        
        onSubscriptionSuccess();
      } catch (subError) {
        toast({
          title: "Error",
          description: "Subscription succeeded but there was an issue updating your account.",
          variant: "destructive",
        });
        console.error("Error updating subscription status:", subError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          type="button" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || processing}
        >
          {processing ? "Processing..." : "Subscribe for $25/year"}
        </Button>
      </div>
    </form>
  );
};

interface StripeSubscriptionProps {
  onSubscriptionSuccess: () => void;
  onCancel: () => void;
}

export function StripeSubscription({ onSubscriptionSuccess, onCancel }: StripeSubscriptionProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function createSubscription() {
      try {
        const response = await apiRequest("POST", "/api/create-subscription");
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("No client secret received");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        console.error("Subscription initialization error:", error);
        onCancel();
      } finally {
        setLoading(false);
      }
    }

    createSubscription();
  }, [toast, onCancel]);

  if (loading || !clientSecret) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#7c3aed',
          },
        } 
      }}
    >
      <SubscriptionForm 
        onSubscriptionSuccess={onSubscriptionSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}