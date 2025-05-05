import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from 'react';

// Import our theme provider and CSS variables
import { ThemeProvider } from "@/styles/ThemeProvider";
import "@/styles/theme.css";

// Import Authentication Provider
import { AuthProvider } from "@/contexts/AuthContext";
import { AppStateProvider } from "@/contexts/AppStateContext";
import PersistLogin from "@/components/auth/PersistLogin";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import AdminEntry from "@/components/auth/AdminEntry";
import SessionTimeoutMonitor from "@/components/auth/SessionTimeoutMonitor";
import Unauthorized from "@/pages/Unauthorized";

// Import Language Provider
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import RTLProvider from "@/components/ui/RTLProvider";

// Import Cart Provider
import { CartProvider } from "@/hooks/useCart";

// Public Pages
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";
import DeliveryDetails from "./pages/DeliveryDetails";
import ARVenuePreview from "./pages/ARVenuePreview";
import IPLTickets from "./pages/IPLTickets";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import ApiTestPage from "./pages/ApiTestPage";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import DeliveryAddressPage from "./pages/booking/DeliveryAddressPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import EventSearch from "./pages/EventSearch";

// Admin Pages
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUpiManagement from "./pages/AdminUpiManagement";
import AdminEventManagement from "./pages/AdminEventManagement";

// Components
import BottomNavigation from "./components/mobile/BottomNavigation";
import NetworkStatus from "./components/ui/NetworkStatus";
import SafeTransition from "./components/utils/SafeTransition";
import AccessibilitySettings from "./components/ui/AccessibilitySettings";
import LiteModeBanner from "./components/mobile/LiteModeBanner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Import for language configuration
import "./i18n/config";

// Security utilities
import { configureHSTS } from "./utils/certificatePinning";
import { isWebAuthnSupported, checkBiometricCapability } from "./utils/webauthn";
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
          {/* Protected Admin Routes */}
          <Route element={<PersistLogin />}>
            <Route element={<AdminProtectedRoute />}>
              {/* Admin Dashboard and Stats */}
              <Route index element={<Navigate to="settings" replace />} />

              <Route path="settings" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="settings" />
                </SafeTransition>
              } />

              <Route path="stats" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="overview" />
                </SafeTransition>
              } />

              {/* Redirect /admin/overview to /admin/stats */}
              <Route path="overview" element={<Navigate to="/admin/stats" replace />} />

              {/* User Management */}
              <Route path="users" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="users" />
                </SafeTransition>
              } />

              {/* Delivery Management */}
              <Route path="deliveries" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="deliveries" />
                </SafeTransition>
              } />

              {/* Event Management */}
              <Route path="events" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="events" />
                </SafeTransition>
              } />

              {/* Payment Approval */}
              <Route path="payments" element={
                <SafeTransition>
                  <AdminDashboardPage activeTab="payments" />
                </SafeTransition>
              } />

              {/* UPI Management (Full Page View) */}
              <Route path="upi-settings" element={
                <SafeTransition>
                  <AdminUpiManagement />
                </SafeTransition>
              } />

              {/* Full Event Management */}
              <Route path="events-full" element={
                <SafeTransition>
                  <AdminEventManagement />
                </SafeTransition>
              } />
            </Route>
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
