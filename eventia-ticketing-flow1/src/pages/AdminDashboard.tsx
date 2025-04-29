import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { CircleDollarSign, TrendingUp, Calendar, Users, AlertCircle, Check, CreditCard, Package, Ticket, Percent } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { toast } from '@/hooks/use-toast';

const revenueData = [
  { name: 'Jan', revenue: 52000 },
  { name: 'Feb', revenue: 45000 },
  { name: 'Mar', revenue: 58000 },
  { name: 'Apr', revenue: 75000 },
  { name: 'May', revenue: 92000 },
  { name: 'Jun', revenue: 84000 },
  { name: 'Jul', revenue: 79000 },
];

const eventPerformanceData = [
  { name: 'IPL: MI vs CSK', ticketsSold: 850 },
  { name: 'IPL: RCB vs KKR', ticketsSold: 620 },
  { name: 'Music Festival', ticketsSold: 450 },
  { name: 'Comedy Night', ticketsSold: 320 },
  { name: 'Tech Conference', ticketsSold: 280 },
];

const paymentMethodsData = [
  { name: 'UPI', value: 65 },
  { name: 'Credit Card', value: 20 },
  { name: 'Debit Card', value: 12 },
  { name: 'Net Banking', value: 3 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Data refreshed",
        description: "Analytics data has been updated to the latest values",
      });
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow bg-gray-50 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor bookings, revenue, and platform performance</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <AnimatedButton size="sm" variant="outline" onClick={refreshData} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Refreshing...
                  </>
                ) : (
                  "Refresh Data"
                )}
              </AnimatedButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Link to="/admin-events">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Ticket className="h-5 w-5 mr-2 text-primary" />
                    Manage Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Add, edit or delete IPL matches and events</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin-upi">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    UPI Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Manage UPI payment details and QR codes</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin-utr">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-5 w-5 mr-2 text-primary" />
                    UTR Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Verify UTRs and dispatch tickets to customers</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin-discounts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Percent className="h-5 w-5 mr-2 text-primary" />
                    Discount Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Manage discount codes and promotions</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="text-2xl font-bold">2,520</div>
                    <p className="text-xs text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CircleDollarSign className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="text-2xl font-bold">₹4,85,250</div>
                    <p className="text-xs text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.5% from last month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-primary mr-3" />
                  <div>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-gray-500 flex items-center">
                      Next 30 days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending UTRs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-amber-500 mr-3" />
                  <div>
                    <div className="text-2xl font-bold">18</div>
                    <p className="text-xs text-gray-500 flex items-center">
                      Requiring verification
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="revenue">Revenue Insights</TabsTrigger>
              <TabsTrigger value="events">Event Performance</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue trends for the current year</CardDescription>
                  <div className="flex gap-2 mt-2">
                    <AnimatedButton 
                      variant={dateRange === 'week' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateRange('week')}
                    >
                      Week
                    </AnimatedButton>
                    <AnimatedButton 
                      variant={dateRange === 'month' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateRange('month')}
                    >
                      Month
                    </AnimatedButton>
                    <AnimatedButton 
                      variant={dateRange === 'year' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setDateRange('year')}
                    >
                      Year
                    </AnimatedButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance</CardTitle>
                  <CardDescription>Most popular events based on ticket sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={eventPerformanceData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ticketsSold" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Distribution of payment methods used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {paymentMethodsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
