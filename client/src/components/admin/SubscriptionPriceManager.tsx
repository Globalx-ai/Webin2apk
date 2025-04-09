import React, { useState, useEffect } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Define the form schema
const priceFormSchema = z.object({
  annualPrice: z.number().min(1, "Price must be at least $1"),
  monthlyPrice: z.number().min(1, "Price must be at least $1"),
  firstYearFree: z.boolean().default(true),
  enableTrialPeriod: z.boolean().default(false),
  trialDays: z.number().min(1).max(90).optional(),
});

type PriceFormData = z.infer<typeof priceFormSchema>;

// Main component
export function SubscriptionPriceManager() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{
    id: number;
    date: string;
    annualPrice: number;
    monthlyPrice: number;
    changedBy: string;
  }>>([]);

  // Initialize form with default values
  const form = useForm<PriceFormData>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      annualPrice: 25,
      monthlyPrice: 2.5,
      firstYearFree: true,
      enableTrialPeriod: false,
      trialDays: 14,
    },
  });

  // Load current subscription price settings
  useEffect(() => {
    const fetchPriceSettings = async () => {
      try {
        // In a real implementation, this would fetch from the API
        // For now, we'll just use our default values after a delay to simulate loading
        setTimeout(() => {
          setIsLoading(false);
        }, 500);

        // Mock price history data
        setPriceHistory([
          { id: 3, date: "2025-04-01", annualPrice: 25, monthlyPrice: 2.5, changedBy: "admin" },
          { id: 2, date: "2025-03-15", annualPrice: 24, monthlyPrice: 2.5, changedBy: "admin" },
          { id: 1, date: "2025-02-01", annualPrice: 20, monthlyPrice: 2, changedBy: "admin" },
        ]);
      } catch (error) {
        toast({
          title: "Error loading price settings",
          description: "There was a problem loading the subscription price settings.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchPriceSettings();
  }, [toast]);

  // Handle form submission
  const onSubmit = async (data: PriceFormData) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would save to the API
      console.log("Submitting price data:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state with the new prices
      setPriceHistory(prev => [
        { 
          id: prev.length + 1, 
          date: new Date().toISOString().split('T')[0], 
          annualPrice: data.annualPrice, 
          monthlyPrice: data.monthlyPrice, 
          changedBy: "admin"
        },
        ...prev
      ]);
      
      toast({
        title: "Price settings updated",
        description: "The subscription price settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to update price settings",
        description: "There was a problem updating the subscription price settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Price Management</CardTitle>
        <CardDescription>Manage subscription pricing and trial periods</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center p-4">Loading price settings...</div>
        ) : (
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="annualPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Subscription Price: ${field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={10}
                            max={100}
                            step={5}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-6"
                          />
                        </FormControl>
                        <FormDescription>
                          Set the annual subscription price
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Subscription Price: ${field.value.toFixed(2)}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={0.5}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-6"
                          />
                        </FormControl>
                        <FormDescription>
                          Set the monthly subscription price
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstYearFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            First Year Free
                          </FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Offer the first year subscription for free
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

                  <FormField
                    control={form.control}
                    name="enableTrialPeriod"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Enable Trial Period
                          </FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Allow users to try before subscribing
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
                </div>

                {form.watch("enableTrialPeriod") && (
                  <FormField
                    control={form.control}
                    name="trialDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Period (Days): {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={90}
                            step={1}
                            value={[field.value || 14]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-6"
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days for free trial
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-between items-center">
                  <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline">
                        View Price History
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Price Change History</DialogTitle>
                        <DialogDescription>
                          Record of previous subscription price changes
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-72">
                        <div className="space-y-3 py-2">
                          {priceHistory.map((entry) => (
                            <div key={entry.id} className="border-b pb-3">
                              <div className="font-medium">{entry.date}</div>
                              <div className="text-sm text-gray-500">
                                Annual: ${entry.annualPrice} / Monthly: ${entry.monthlyPrice.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Changed by: {entry.changedBy}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowHistoryDialog(false)}
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Price Settings"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-2">Current Subscription Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">${form.watch("annualPrice")}</div>
                      <div className="text-sm text-gray-500">per year</div>
                      {form.watch("firstYearFree") && (
                        <div className="mt-2 text-sm text-green-600 font-medium">First year free</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">${form.watch("monthlyPrice").toFixed(2)}</div>
                      <div className="text-sm text-gray-500">per month</div>
                      {form.watch("enableTrialPeriod") && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          {form.watch("trialDays")} days free trial
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}