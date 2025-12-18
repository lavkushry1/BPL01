import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';
import { login } from '@/services/api/authApi';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const { setUser, setPersist, isAuthenticated, user } = useAuth();
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
      const redirectPath = user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/';
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

      // Update auth context
      setUser(userData as any); // Use type assertion to bypass TypeScript error
      setPersist(rememberDevice);

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      if (userData.role?.toLowerCase() === 'admin') {
        navigate('/admin/dashboard', { replace: true });
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
    <div className="flex flex-col min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Ambient Bacgkround */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow pt-24 pb-12 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to manage your tickets and bookings</p>
          </div>

          <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl animate-fade-in-up animation-delay-100">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 h-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="remember"
                    checked={rememberDevice}
                    onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                    Remember me on this device
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm">
              <p className="text-slate-500">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
