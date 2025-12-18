import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';

const AdminLogin = () => {
  const { setUser, setAccessToken, setPersist, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'admin') {
      // If user is already authenticated as admin, redirect to dashboard
      navigate('/admin/dashboard', { replace: true });
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
      // Login flow with Express backend API
      const response = await login(email, password);

      const userData = response.user;

      // Check if user is admin
      if (userData?.role?.toLowerCase() !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      setUser(userData as any);
      setAccessToken(response.token || '');
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

  return (
    <div className="flex flex-col min-h-screen district-shell">
      <Navbar />

      <main className="flex-grow pt-16 flex items-center justify-center">
        <div className="w-full max-w-md p-8 district-panel rounded-xl shadow-xl border border-[var(--district-border)]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--district-border)]">
              <Shield className="h-8 w-8 text-[var(--district-accent)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--district-text)]">Admin Login</h1>
            <p className="text-[var(--district-muted)] mt-2">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--district-text)] mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-white/5 text-[var(--district-text)] border-[var(--district-border)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--district-text)] mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 text-[var(--district-text)] border-[var(--district-border)]"
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--district-text)]"
                  >
                    Remember this device
                  </label>
                </div>

                <a
                  href="#"
                  className="text-sm text-[var(--district-accent)] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full district-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 border-t border-[var(--district-border)] pt-6 text-center">
            <p className="text-sm text-[var(--district-muted)]">
              Need help? Contact system administrator
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;
