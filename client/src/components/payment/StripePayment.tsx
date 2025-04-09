import React, { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  projectId: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const CheckoutForm = ({ projectId, onPaymentSuccess, onPaymentError }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        onPaymentError(error.message || "An unexpected error occurred");
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Update project as paid
        await apiRequest("POST", `/api/projects/${projectId}/payment`, {
          paymentIntentId: paymentIntent.id
        });
        
        onPaymentSuccess();
        toast({
          title: "Payment Successful",
          description: "Your app bundle is ready to download",
        });
      }
    } catch (error: any) {
      onPaymentError(error.message || "An unexpected error occurred");
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
        <p className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Your card will be charged $5.00 for this app bundle
        </p>
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now & Download Bundle"
        )}
      </Button>
    </form>
  );
};

interface StripePaymentProps {
  projectId: number;
  onPaymentComplete: () => void;
}

export default function StripePayment({ projectId, onPaymentComplete }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Creating payment intent for project ID:", projectId);
        console.log("Stripe public key available:", !!import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        
        // Verify we have a valid project ID
        if (!projectId || isNaN(projectId)) {
          throw new Error(`Invalid project ID: ${projectId}`);
        }
        
        const requestData = { 
          amount: 5.00,  // $5.00 per bundle
          createIntent: true // Explicitly request intent creation only
        };
        console.log("Payment request data:", requestData);
        
        const response = await apiRequest("POST", `/api/projects/${projectId}/payment`, requestData);
        
        console.log("Payment intent response status:", response.status);
        
        if (!response.ok) {
          let errorMessage = "Failed to create payment intent";
          try {
            const errorData = await response.json();
            console.error("Payment intent creation failed:", errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            console.error("Could not parse error response:", jsonError);
          }
          throw new Error(errorMessage);
        }
        
        try {
          const data = await response.json();
          console.log("Payment intent created, client secret received:", !!data.clientSecret);
          
          if (!data.clientSecret) {
            throw new Error("No client secret returned from server");
          }
          
          setClientSecret(data.clientSecret);
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          throw new Error("Invalid response format from server");
        }
      } catch (error: any) {
        console.error("Payment setup error:", error);
        setError(error.message || "Failed to create payment intent");
        toast({
          title: "Payment Setup Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [projectId, toast]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    onPaymentComplete();
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-center text-gray-600">Setting up secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Payment Setup Failed</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-600 mb-4">Your app bundle is ready to download</p>
        <Button
          onClick={() => window.open(`/api/projects/${projectId}/download`, "_blank")}
        >
          Download App Bundle
        </Button>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">Complete Payment</h3>
      <p className="text-gray-600 mb-6">Pay securely to download your app bundle</p>
      
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            projectId={projectId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </Elements>
      )}
    </div>
  );
}