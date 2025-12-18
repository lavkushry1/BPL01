import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

/**
 * AdminEntry serves as the gateway to the admin portal
 * - If user is authenticated as admin, renders the admin pages
 * - If not authenticated or not admin, renders the login page
 */
const AdminEntry: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If authenticated and admin, render the child routes (admin pages)
  if (isAuthenticated && user?.role?.toLowerCase() === 'admin') {
    return <Outlet />;
  }
  
  // If not authenticated (or not admin), redirect to the dedicated admin login page
  return <Navigate to="/admin-login" replace state={{ from: location }} />;
};

export default AdminEntry;
