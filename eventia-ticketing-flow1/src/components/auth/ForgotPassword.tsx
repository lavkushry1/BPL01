import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import userApi from '@/services/api/userApi';

// Validation schema for forgot password form
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Call the reset password API function
      await userApi.requestPasswordReset({ email: data.email });
      
      // Show success message
      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Password reset request error:', error);
      
      // Always show a success message even if the email doesn't exist
      // This prevents user enumeration attacks
      setIsSubmitted(true);
      
      // Log the error for debugging (don't show to user)
      if (import.meta.env.DEV) {
        console.log('Password reset request failed:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If form is submitted, show success message
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Reset Link Sent</CardTitle>
          <CardDescription className="text-center">
            If an account exists with this email, we've sent a password reset link.
            Please check your inbox and follow the instructions.
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="flex justify-center flex-col gap-4 pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </Button>
          
          <p className="text-sm text-muted-foreground text-center">
            Didn't receive an email? Check your spam folder or{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal"
              onClick={() => setIsSubmitted(false)}
            >
              try again
            </Button>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
                      <div className="px-3 py-2 text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        {...field} 
                        className="border-0 focus-visible:ring-0 focus-visible:ring-transparent" 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : "Send Reset Link"}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto font-normal text-primary"
            onClick={() => navigate('/login')}
          >
            Back to login
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default ForgotPassword; 