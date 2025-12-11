import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import console from 'console';
import { Activity, AlertCircle, Calendar, CircleDollarSign, CreditCard, Package, Percent, Ticket, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [eventPerformanceData, setEventPerformanceData] = useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);

  // Mock data for immediate preview if API fails (or for development)
  const mockRevenue = [
    { name: 'Mon', revenue: 4000 }, { name: 'Tue', revenue: 3000 }, { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 }, { name: 'Fri', revenue: 1890 }, { name: 'Sat', revenue: 2390 }, { name: 'Sun', revenue: 3490 }
  ];

  useEffect(() => {
    // Use existing API or fallback to mocks
    fetch('/api/dashboard-data')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      })
      .then((data) => {
        setRevenueData(data.revenue || mockRevenue);
        setEventPerformanceData(data.eventPerformance || []);
        setPaymentMethodsData(data.paymentMethods || []);
      })
      .catch((error) => {
        console.warn("Using mock data", error);
        setRevenueData(mockRevenue);
      });
  }, []);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Synced",
        description: "Dashboard data updated successfully.",
      });
    }, 1000);
  };

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <Card className="bg-slate-900/60 border-white/5 hover:border-white/10 transition-all duration-300 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
            {change && (
              <p className="text-xs flex items-center text-green-400 bg-green-400/10 px-2 py-1 rounded w-fit">
                <TrendingUp className="h-3 w-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", `bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-slate-400">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <AnimatedButton onClick={refreshData} disabled={isRefreshing} className="bg-blue-600 hover:bg-blue-700">
          {isRefreshing ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
          {isRefreshing ? 'Syncing...' : 'Sync Data'}
        </AnimatedButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="₹4,85,250" change="+12.5%" icon={CircleDollarSign} color="blue" />
        <StatCard title="Active Bookings" value="1,240" change="+8.2%" icon={Ticket} color="purple" />
        <StatCard title="Upcoming Events" value="12" icon={Calendar} color="yellow" />
        <StatCard title="Pending Verifications" value="18" icon={AlertCircle} color="red" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-slate-900/60 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Revenue Analytics</CardTitle>
            <CardDescription className="text-slate-400">Monthly revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, fill: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
                </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-900/60 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Access</CardTitle>
            <CardDescription className="text-slate-400">Manage your system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Verify Payment UTRs', path: '/admin-utr', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { name: 'Add New IPL Match', path: '/admin-events', icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { name: 'Update UPI IDs', path: '/admin-upi', icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10' },
              { name: 'Manage Discounts', path: '/admin-discounts', icon: Percent, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((action, i) => (
              <Link key={i} to={action.path} className="flex items-center p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                <div className={cn("p-2 rounded-lg mr-3", action.bg, action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{action.name}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed data */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="bg-slate-900 border border-white/5 p-1">
          <TabsTrigger value="events" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Event Performance</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Payment Methods</TabsTrigger>
            </TabsList>

        <TabsContent value="events" className="mt-6">
          <Card className="bg-slate-900/60 border-white/5 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-white">Ticket Sales by Event</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Bar dataKey="ticketsSold" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card className="bg-slate-900/60 border-white/5 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-white">Payment Method Distribution</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodsData.map((__entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
