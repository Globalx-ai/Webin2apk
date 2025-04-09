import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { insertCouponSchema, type Coupon } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as z from "zod";

const couponFormSchema = insertCouponSchema.extend({
  code: z.string().min(3, "Code must be at least 3 characters"),
  discountPercent: z.number().min(10, "Discount must be at least 10%").max(100, "Discount cannot exceed 100%"),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional(),
  maxUses: z.number().optional(),
});

type CouponFormData = z.infer<typeof couponFormSchema>;

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editCouponId, setEditCouponId] = useState<number | undefined>(undefined);
  const { toast } = useToast();
  
  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountPercent: 100,
      isActive: true,
      expiresAt: "",
      maxUses: undefined,
    },
  });

  // Load existing coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", "/api/coupons");
        const data = await response.json();
        setCoupons(data);
      } catch (error) {
        toast({
          title: "Error loading coupons",
          description: "Failed to load coupon data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [toast]);

  const onSubmit = async (data: CouponFormData) => {
    setIsSubmitting(true);
    try {
      if (editCouponId) {
        // Update existing coupon
        const response = await apiRequest("PATCH", `/api/coupons/${editCouponId}`, data);
        if (response.ok) {
          toast({
            title: "Coupon updated",
            description: `Coupon "${data.code}" has been updated successfully.`,
          });
          
          // Reset form and reload coupons
          form.reset();
          setEditCouponId(undefined);
          queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
          
          // Update the local state
          const updatedCoupon = await response.json();
          setCoupons(coupons.map(c => c.id === editCouponId ? updatedCoupon : c));
        }
      } else {
        // Create new coupon
        const response = await apiRequest("POST", "/api/coupons", data);
        if (response.ok) {
          toast({
            title: "Coupon created",
            description: `Coupon "${data.code}" has been created successfully.`,
          });
          
          // Reset form and reload coupons
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
          
          // Add to local state
          const newCoupon = await response.json();
          setCoupons([...coupons, newCoupon]);
        }
      }
    } catch (error) {
      toast({
        title: "Error saving coupon",
        description: "Failed to save coupon data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const editCoupon = (coupon: Coupon) => {
    setEditCouponId(coupon.id);
    form.reset({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt || "",
      maxUses: coupon.maxUses === null ? undefined : coupon.maxUses,
    });
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      const response = await apiRequest("DELETE", `/api/coupons/${id}`);
      if (response.ok) {
        toast({
          title: "Coupon deleted",
          description: "The coupon has been deleted successfully.",
        });
        
        // Update local state
        setCoupons(coupons.filter(c => c.id !== id));
        
        // If editing this coupon, reset the form
        if (editCouponId === id) {
          form.reset();
          setEditCouponId(undefined);
        }
      }
    } catch (error) {
      toast({
        title: "Error deleting coupon",
        description: "Failed to delete the coupon. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditCouponId(undefined);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coupon Management</CardTitle>
        <CardDescription>Create and manage discount coupons</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Coupon List</TabsTrigger>
            <TabsTrigger value="create">
              {editCouponId ? "Edit Coupon" : "Create Coupon"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center p-4">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  No coupons found. Create your first coupon to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {coupons.map((coupon) => (
                    <div 
                      key={coupon.id} 
                      className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1 flex-grow">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{coupon.code}</h3>
                          {coupon.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {coupon.discountPercent}% discount
                          {coupon.maxUses && ` • Max uses: ${coupon.maxUses}`}
                          {coupon.currentUses && coupon.currentUses > 0 && ` • Used ${coupon.currentUses} times`}
                          {coupon.expiresAt && ` • Expires: ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => editCoupon(coupon)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteCoupon(coupon.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SUMMER2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountPercent"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage: {value}%</FormLabel>
                      <FormControl>
                        <Slider 
                          min={10} 
                          max={100} 
                          step={5}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="py-4"
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxUses"
                    render={({ field: { value, onChange, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Maximum Uses (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            placeholder="Unlimited"
                            value={value === undefined ? "" : value}
                            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                            {...rest}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <FormDescription className="text-sm text-gray-500">
                          Enable or disable this coupon
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
                
                <div className="flex justify-end gap-2">
                  {editCouponId && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editCouponId ? "Update Coupon" : "Create Coupon"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}