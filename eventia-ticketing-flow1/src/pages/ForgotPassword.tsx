import React from 'react';
import ForgotPassword from '@/components/auth/ForgotPassword';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const ForgotPasswordPage: React.FC = () => {
  // Update document title
  React.useEffect(() => {
    document.title = "Forgot Password | Eventia";
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Reset Your Password</h1>
          <ForgotPassword />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage; 