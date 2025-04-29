import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

interface RequireAuthProps {
  allowedRoles?: string[];
  isAdminRoute?: boolean;
}

/**
 * Component that protects routes by requiring authentication
 * Optionally can restrict access based on user roles
 * 
 * @param allowedRoles Optional array of roles that are allowed to access the route
 * @param isAdminRoute Whether this is an admin route (redirects to admin login)
 */
const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles, isAdminRoute = false }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If user is not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    const loginPath = isAdminRoute ? '/admin-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  
  // If allowedRoles is provided, check if user has one of the required roles
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // User is authenticated but doesn't have the required role
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and has the required role (if specified)
  return <Outlet />;
};

export default RequireAuth; 