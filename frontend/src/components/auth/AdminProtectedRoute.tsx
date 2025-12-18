import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

/**
 * AdminProtectedRoute ensures that only authenticated admin users can access the protected routes
 * - If loading: Shows a loading indicator
 * - If not authenticated: Redirects to admin login page
 * - If authenticated but not admin: Shows an error message and redirects to home page
 * - If authenticated as admin: Allows access to the protected routes
 */
const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Verifying access...</span>
      </div>
    );
  }
  
  // If not authenticated at all, redirect to admin login
  if (!isAuthenticated) {
    // Pass the current location so we can redirect back after login
    return <Navigate to="/admin-login" replace state={{ from: location }} />;
  }
  
  // If authenticated but not an admin, show unauthorized message and redirect
  if (!user || user.role?.toLowerCase() !== 'admin') {
    // Show a toast message about insufficient permissions
    toast({
      title: "Access Denied",
      description: "Only administrators can access this area",
      variant: "destructive"
    });
    
    // Redirect to home page
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated and has admin role, render the protected admin pages
  return <Outlet />;
};

export default AdminProtectedRoute; 
