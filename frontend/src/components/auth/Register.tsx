import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { register as userRegister } from '@/services/api/authApi';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// Validation schema for registration form
const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Initialize form with react-hook-form and zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      // Call the register API function
      await userRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'user' // Default to user role
      });

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please login.",
      });

      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);

      // Display error message
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-3 text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                        className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-slate-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-slate-500">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                    </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3 text-slate-500">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          className="pl-10 h-11 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                        />
                      </div>
                    </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-lg shadow-blue-900/20 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
            ) : (
              <>
                Create Account <ArrowRight className="h-4 w-4" />
              </>
            )}
            </Button>
          </form>
      </Form>

      <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm">
        <p className="text-slate-500">
          Already have an account?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-blue-400 hover:text-blue-300"
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Register;
