import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Form validation schema
const adminLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user, persist, setPersist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from the state or default to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';
  
  // If user is already authenticated and is admin, redirect to admin dashboard
  if (isAuthenticated && user?.role?.toLowerCase() === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Initialize form with react-hook-form
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await login(data.email, data.password);
      
      if (response.user.role?.toLowerCase() !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only administrators can access this system",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });
      
      // Navigate to the admin dashboard
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Admin login failed:', error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle remember me functionality
  const handleTogglePersist = () => {
    setPersist(prev => !prev);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-primary mb-4">
            <ShieldAlert size={24} />
          </div>
          <CardTitle className="text-xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@example.com" 
                        {...field} 
                        autoComplete="email"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        autoComplete="current-password"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Remember me checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={persist}
                  onCheckedChange={handleTogglePersist}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-xs text-muted-foreground">
            Protected area. Unauthorized access is prohibited.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage; 
