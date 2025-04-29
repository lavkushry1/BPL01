/**
 * @component DeliveryDetailsForm
 * @description Form component for collecting delivery/contact information.
 * Uses Zod for form validation and React Hook Form for state management.
 * 
 * @apiDependencies
 * - None (delegates API calls to parent component)
 * 
 * @requiredProps
 * - onSubmit (function) - Callback function to handle form submission
 * 
 * @requiredFields
 * - name (string) - Customer's full name (min 3 characters)
 * - phone (string) - Customer's phone number (min 10 digits)
 * - address (string) - Delivery address (min 5 characters)
 * - city (string) - City (min 2 characters)
 * - pincode (string) - PIN code (min 6 characters)
 * 
 * @validation
 * - Uses Zod schema validation with minimum length requirements
 * 
 * @expectedResponse
 * - Calls onSubmit with form data when validation passes
 * - Handles loading state during submission
 * - Displays validation errors inline
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { User, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const deliveryFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  pincode: z.string().min(6, "Pincode must be at least 6 characters"),
});

type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

interface DeliveryDetailsFormProps {
  onSubmit: (data: DeliveryFormValues) => Promise<void>;
}

const DeliveryDetailsForm: React.FC<DeliveryDetailsFormProps> = ({ onSubmit }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      pincode: '',
    },
  });

  const handleSubmit = async (data: DeliveryFormValues) => {
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting delivery details:', error);
      toast({
        title: "Error saving details",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Delivery Details</CardTitle>
        <p className="text-sm text-gray-500">
          Please provide your details for ticket delivery
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your full name" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your phone number" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Enter your delivery address" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Pincode" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DeliveryDetailsForm;
