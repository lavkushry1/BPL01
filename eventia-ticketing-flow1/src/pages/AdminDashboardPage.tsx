import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Users,
  Ticket,
  Calendar,
  Settings,
  TruckIcon,
  CreditCard,
  PieChart,
  LogOut,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuth from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Import existing admin components
import AdminUpiManagement from './AdminUpiManagement';
import AdminEventManagement from './AdminEventManagement';
import UserManagement from '../components/admin/UserManagement';
import UpiSettingsManager from '../components/admin/UpiSettingsManager';
import MobilePerformanceDashboard from '../components/admin/MobilePerformanceDashboard';

interface AdminDashboardPageProps {
  activeTab?: 'overview' | 'users' | 'events' | 'deliveries' | 'payments' | 'settings' | 'mobile';
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  activeTab = 'overview'
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Update tab when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value as AdminDashboardPageProps['activeTab']);
    navigate(`/admin/${value}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              Logged in as: <span className="font-semibold">{user?.name || user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full border-b rounded-none p-0 flex">
            <TabsTrigger
              value="overview"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="deliveries"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <TruckIcon className="h-4 w-4 mr-2" />
              Deliveries
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-muted-foreground ml-2">
                Welcome back, {user?.name || 'Admin'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,243</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    +2 added this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
                  <TruckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">
                    5 require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$24,560</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-sm">New booking: <span className="font-medium">IPL Match #12</span></p>
                      <p className="ml-auto text-xs text-muted-foreground">Just now</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <p className="text-sm">New user registered: <span className="font-medium">john.doe@example.com</span></p>
                      <p className="ml-auto text-xs text-muted-foreground">10 min ago</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      <p className="text-sm">Event updated: <span className="font-medium">Concert at Central Park</span></p>
                      <p className="ml-auto text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      <p className="text-sm">Payment pending: <span className="font-medium">Order #12345</span></p>
                      <p className="ml-auto text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common admin tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('users')}>
                    <Users className="h-4 w-4 mr-2" />
                    <span>Manage Users</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('events')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Create Event</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('deliveries')}>
                    <TruckIcon className="h-4 w-4 mr-2" />
                    <span>Manage Deliveries</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => handleTabChange('payments')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Review Payments</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <UserManagement />
          </TabsContent>

          {/* Event Management */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Event Management</h2>
              <Button variant="outline" onClick={() => navigate('/admin/events-full')} className="mt-2 md:mt-0">
                <Calendar className="h-4 w-4 mr-2" />
                Full Event Manager
              </Button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <AdminEventManagement />
            </div>
          </TabsContent>

          {/* Delivery Management */}
          <TabsContent value="deliveries" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Delivery Management</h2>
            <Card>
              <CardHeader>
                <CardTitle>All Deliveries</CardTitle>
                <CardDescription>
                  Track and manage delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Delivery management content will display here, showing all deliveries with their current status and options to update.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Approval */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Payment Settings</h2>
              <Button variant="outline" onClick={() => navigate('/admin/upi-settings')} className="mt-2 md:mt-0">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage UPI Settings
              </Button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <AdminUpiManagement />
            </div>
          </TabsContent>

          {/* Mobile Performance Monitoring */}
          <TabsContent value="mobile" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Mobile Performance Monitoring</h2>
            <MobilePerformanceDashboard />
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">System Settings</h2>

            <div className="space-y-6">
              {/* UPI Payment Settings */}
              <UpiSettingsManager />

              {/* General Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure system preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Additional system settings will display here, allowing configuration of system-wide preferences and options.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardPage;