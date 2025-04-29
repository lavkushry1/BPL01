import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Shield, TestTube } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';

// Test credentials for quick access
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'password123'
};

const AdminLogin = () => {
  const { setUser, setAccessToken, setPersist, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin-dashboard';

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      // If user is already authenticated as admin, redirect to dashboard
      navigate('/admin-dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Special case for default credentials during development
      if (email === TEST_CREDENTIALS.email && password === TEST_CREDENTIALS.password) {
        // For test login, we'll simulate a successful JWT response
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email: TEST_CREDENTIALS.email,
          role: 'admin'
        };
        
        setUser(mockUser);
        setAccessToken('mock_admin_token');
        setPersist(rememberDevice);
        
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard",
        });
        
        navigate(from, { replace: true });
        setIsLoading(false);
        return;
      }
      
      // Regular login flow with Express backend API
      const response = await login(email, password);
      
      const userData = response.user;
      const accessToken = response.accessToken;
      
      // Check if user is admin
      if (userData?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      setUser(userData);
      setAccessToken(accessToken);
      setPersist(rememberDevice);
      
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
      
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.response?.data?.message || error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    
    // Submit the form after a short delay to show the filled credentials
    setTimeout(() => {
      handleLogin({ preventDefault: () => {} } as React.FormEvent);
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900">
      <Navbar />
      
      <main className="flex-grow pt-16 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary dark:text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to access the admin dashboard</p>
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
                  placeholder="admin@example.com"
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
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberDevice}
                  onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                />
                <label 
                  htmlFor="remember" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300">
                  Trust this device
                </label>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
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
          
          <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center mb-3">
              <TestTube className="w-5 h-5 text-amber-500 mr-2" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Credentials</h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p className="flex justify-between"><span>Email:</span> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{TEST_CREDENTIALS.email}</code></p>
              <p className="flex justify-between"><span>Password:</span> <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{TEST_CREDENTIALS.password}</code></p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-900/20"
              onClick={handleTestLogin}
              disabled={isLoading}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Use Test Account
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;
