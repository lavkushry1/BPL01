import Register from '@/components/auth/Register';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import React from 'react';

const RegisterPage: React.FC = () => {
  // Update document title using React's useEffect
  React.useEffect(() => {
    document.title = "Create Account | IPL 2026";
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Ambient Bacgkround */}
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="flex-grow py-24 px-4 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-2">Join the Action</h1>
            <p className="text-slate-400">Create an account to book tickets and get exclusive offers</p>
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <Register />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
