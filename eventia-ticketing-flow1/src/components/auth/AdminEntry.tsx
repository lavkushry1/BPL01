import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';

/**
 * AdminEntry serves as the gateway to the admin portal
 * - If user is authenticated as admin, renders the admin pages
 * - If not authenticated or not admin, renders the login page
 */
const AdminEntry: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // If authenticated and admin, render the child routes (admin pages)
  if (isAuthenticated && user?.role === 'admin') {
    return <Outlet />;
  }
  
  // If not authenticated or not admin, render the login form
  return <LoginPage />;
};

export default AdminEntry; 