import React from 'react';
import Register from '@/components/auth/Register';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const RegisterPage: React.FC = () => {
  // Update document title using React's useEffect
  React.useEffect(() => {
    document.title = "Create Account | Eventia";
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Create Your Account</h1>
          <Register />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegisterPage; 