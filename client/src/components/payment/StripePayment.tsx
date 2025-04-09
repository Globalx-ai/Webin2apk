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

interface StripePaymentFormProps {
  projectId: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({ projectId, onPaymentSuccess, onClose }: StripePaymentFormProps) {
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
        title: "Payment Failed",
        description: error.message || "Something went wrong with your payment.",
        variant: "destructive",
      });
      setProcessing(false);
    } else {
      // Payment succeeded, update the project status
      try {
        await apiRequest("POST", `/api/projects/${projectId}/payment`, {
          useSubscription: false
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({queryKey: [`/api/projects/${projectId}`]});
        
        toast({
          title: "Payment Successful",
          description: "Your payment was processed and your app is being built.",
        });
        
        onPaymentSuccess();
        onClose();
      } catch (paymentError) {
        toast({
          title: "Error",
          description: "Payment succeeded but there was an issue updating the project status.",
          variant: "destructive",
        });
        console.error("Error updating project status:", paymentError);
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
          onClick={onClose}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || processing}
        >
          {processing ? "Processing..." : "Pay $5"}
        </Button>
      </div>
    </form>
  );
}

interface StripePaymentProps {
  projectId: number;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export function StripePayment({ projectId, onPaymentSuccess, onClose }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await apiRequest("POST", `/api/projects/${projectId}/payment`, {
          createIntent: true,
          amount: 500, // $5.00 in cents
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        console.error("Payment initialization error:", error);
      } finally {
        setLoading(false);
      }
    }

    createPaymentIntent();
  }, [projectId, toast]);

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
      <PaymentForm 
        projectId={projectId}
        onPaymentSuccess={onPaymentSuccess}
        onClose={onClose}
      />
    </Elements>
  );
}