import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import React from 'react';

// Import our theme provider and CSS variables
import { ThemeProvider } from "@/styles/ThemeProvider";
import "@/styles/theme.css";

// Import Authentication Provider
import { AuthProvider } from "@/contexts/AuthContext";
import PersistLogin from "@/components/auth/PersistLogin";
import RequireAuth from "@/components/auth/RequireAuth";
import Unauthorized from "@/pages/Unauthorized";

import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import Checkout from "./pages/Checkout";
import DeliveryDetails from "./pages/DeliveryDetails";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEventManagement from "./pages/AdminEventManagement";
import AdminUpiManagement from "./pages/AdminUpiManagement";
import AdminUtrVerification from "./pages/AdminUtrVerification";
import AdminDiscountManagement from "./pages/AdminDiscountManagement";
import ARVenuePreview from "./pages/ARVenuePreview";
import IPLTickets from "./pages/IPLTickets";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import ApiTestPage from "./pages/ApiTestPage";
import BottomNav from "./components/layout/BottomNav";
import SafeTransition from "./components/utils/SafeTransition";

// Import for language configuration
import "./i18n/config";

// Define role types
const ROLES = {
  User: 'user',
  Admin: 'admin'
};

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a component for route handling that includes AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={
          <SafeTransition>
            <Index />
          </SafeTransition>
        } />
        <Route path="/events" element={
          <SafeTransition>
            <Events />
          </SafeTransition>
        } />
        <Route path="/events/:id" element={
          <SafeTransition>
            <EventDetail />
          </SafeTransition>
        } />
        <Route path="/delivery-details" element={
          <SafeTransition>
            <DeliveryDetails />
          </SafeTransition>
        } />
        <Route path="/payment/:bookingId" element={
          <SafeTransition>
            <Payment />
          </SafeTransition>
        } />
        <Route path="/confirmation/:bookingId" element={
          <SafeTransition>
            <Confirmation />
          </SafeTransition>
        } />
        <Route path="/checkout" element={
          <SafeTransition>
            <Checkout />
          </SafeTransition>
        } />
        <Route path="/ipl-tickets" element={
          <SafeTransition>
            <IPLTickets />
          </SafeTransition>
        } />
        <Route path="/support" element={
          <SafeTransition>
            <Support />
          </SafeTransition>
        } />
        <Route path="/admin-login" element={
          <SafeTransition>
            <AdminLogin />
          </SafeTransition>
        } />
        <Route path="/venue-preview/:id" element={
          <SafeTransition>
            <ARVenuePreview />
          </SafeTransition>
        } />
        <Route path="/debug" element={<Debug />} />
        <Route path="/api-test" element={
          <SafeTransition>
            <ApiTestPage />
          </SafeTransition>
        } />
        <Route path="/unauthorized" element={
          <SafeTransition>
            <Unauthorized />
          </SafeTransition>
        } />

        {/* Protected Routes with Authentication */}
        <Route element={<PersistLogin />}>
          <Route element={<RequireAuth allowedRoles={[ROLES.Admin]} />}>
            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={
              <SafeTransition>
                <AdminDashboard />
              </SafeTransition>
            } />
            <Route path="/admin-events" element={
              <SafeTransition>
                <AdminEventManagement />
              </SafeTransition>
            } />
            <Route path="/admin-upi" element={
              <SafeTransition>
                <AdminUpiManagement />
              </SafeTransition>
            } />
            <Route path="/admin-discounts" element={
              <SafeTransition>
                <AdminDiscountManagement />
              </SafeTransition>
            } />
            <Route path="/admin-utr" element={
              <SafeTransition>
                <AdminUtrVerification />
              </SafeTransition>
            } />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path="*" element={
          <SafeTransition>
            <NotFound />
          </SafeTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
            <BottomNav />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
