import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence } from "framer-motion";
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

// Import our theme provider and CSS variables
import "@/styles/theme.css";

// Import Authentication Provider
import AdminEntry from "@/components/auth/AdminEntry";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import PersistLogin from "@/components/auth/PersistLogin";
import Unauthorized from "@/pages/Unauthorized";

// Import Language Provider

// Import Cart Provider

// Public Pages
import AdminLogin from "./pages/AdminLogin";
import ApiTestPage from "./pages/ApiTestPage";
import ARVenuePreview from "./pages/ARVenuePreview";
import DeliveryAddressPage from "./pages/booking/DeliveryAddressPage";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Debug from "./pages/Debug";
import DeliveryDetails from "./pages/DeliveryDetails";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import EventSearch from "./pages/EventSearch";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import StadiumBooking from "./pages/ipl/StadiumBooking";
import IPLTickets from "./pages/IPLTickets";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Support from "./pages/Support";

// Admin Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminEventManagement from "./pages/AdminEventManagement";
import AdminUpiManagement from "./pages/AdminUpiManagement";

// Components
import SafeTransition from "./components/utils/SafeTransition";

// Import for language configuration
import "./i18n/config";

// Security utilities
import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUtrVerification from '@/pages/AdminUtrVerification';
import SeatMapPreview from '@/pages/SeatMapPreview';

import { fetchCsrfToken } from "./services/api/apiUtils";

// Create a component for route handling that includes AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();

  // This helps with Core Web Vitals by ensuring scrolling to top on page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes - No authentication required */}
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

        <Route path="/search" element={
          <SafeTransition>
            <EventSearch />
          </SafeTransition>
        } />

        <Route path="/events/:id" element={
          <SafeTransition>
            <EventDetail />
          </SafeTransition>
        } />

        <Route path="/cart" element={
          <SafeTransition>
            <Cart />
          </SafeTransition>
        } />

        <Route path="/seats" element={
          <SafeTransition>
            <SeatSelectionPage />
          </SafeTransition>
        } />

        <Route path="/booking/delivery" element={
          <SafeTransition>
            <DeliveryAddressPage />
          </SafeTransition>
        } />

        <Route path="/booking/payment" element={
          <SafeTransition>
            <Payment />
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

        <Route path="/ipl/book/:matchId" element={
          <SafeTransition>
            <StadiumBooking />
          </SafeTransition>
        } />

        <Route path="/support" element={
          <SafeTransition>
            <Support />
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

        {/* Authentication Routes */}
        <Route path="/login" element={
          <SafeTransition>
            <Login />
          </SafeTransition>
        } />

        <Route path="/register" element={
          <SafeTransition>
            <Register />
          </SafeTransition>
        } />

        <Route path="/forgot-password" element={
          <SafeTransition>
            <ForgotPassword />
          </SafeTransition>
        } />

        <Route path="/profile" element={
          <SafeTransition>
            <Profile />
          </SafeTransition>
        } />

        <Route path="/admin-login" element={
          <SafeTransition>
            <AdminLogin />
          </SafeTransition>
        } />

        {/* Admin Portal Entry Point */}
        <Route path="/admin" element={<AdminEntry />}>
          {/* Protected Admin Routes Wrap with Layout */}
          <Route element={<PersistLogin />}>
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="events" element={<AdminEventManagement />} />
                <Route path="upi" element={<AdminUpiManagement />} />
                <Route path="utr" element={<AdminUtrVerification />} />
                <Route path="discounts" element={<AdminDashboardPage activeTab="settings" />} /> {/* Placeholder */}

                {/* Legacy Mappings */}
                <Route path="stats" element={<Navigate to="dashboard" replace />} />
                <Route path="users" element={<AdminDashboardPage activeTab="users" />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="/seat-map-test" element={<SeatMapPreview />} />

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

const App = () => {
  // Initialize CSRF token when app loads
  useEffect(() => {
    // Fetch CSRF token on app initialization
    fetchCsrfToken().catch(error => {
      console.error('Failed to initialize CSRF protection:', error);
    });
  }, []);

  return (
    <>
      <AnimatedRoutes />
      <Toaster />
      <Sonner />
    </>
  );
};

export default App;
