import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '@/components/layout/PublicNavbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Eventia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout; 