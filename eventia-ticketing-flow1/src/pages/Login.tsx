import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';
import { useMutation } from '@tanstack/react-query';

const Login = () => {
  const { setUser, setAccessToken, setPersist, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // If user is already authenticated, redirect them
      const redirectPath = user?.role === 'admin' ? '/admin/settings' : '/';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  // Set up login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => 
      login(credentials.email, credentials.password),
    onSuccess: (data) => {
      // Extract data from the response
      const userData = data.user;
      const token = data.token || ''; // Use token from the response
      
      // Update auth context
      setUser(userData as any); // Use type assertion to bypass TypeScript error
      setAccessToken(token);
      setPersist(rememberDevice);
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin/settings', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow pt-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary dark:text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account to continue</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberDevice}
                    onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                  />
                  <label 
                    htmlFor="remember" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-gray-500 dark:text-gray-500">
              <strong>Test credentials:</strong> admin@example.com / password123
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login; 