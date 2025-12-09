import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, BarChart, TrendingUp, Users, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Analytics data type definitions
interface AnalyticsDataPoint {
  month: string;
  value: number;
}

interface AnalyticsSummary {
  revenue: {
    data: AnalyticsDataPoint[];
    growth: number;
    totalRevenue: number;
    avgTicketPrice: number;
    totalTickets: number;
    refunds: number;
  };
  users: {
    data: AnalyticsDataPoint[];
    growth: number;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    retention: number;
  };
  events: {
    data: AnalyticsDataPoint[];
    growth: number;
    totalEvents: number;
    activeEvents: number;
    avgAttendance: number;
    soldOut: number;
  };
}

// Simple bar chart component
const SimpleBarChart = ({ data, maxHeight = 200 }: { data: AnalyticsDataPoint[], maxHeight?: number }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="flex items-end h-[200px] gap-2">
      {data.map((item, index) => {
        const heightPercentage = (item.value / maxValue) * 100;
        
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-primary/90 hover:bg-primary rounded-t-sm transition-all"
              style={{ height: `${heightPercentage}%` }}
            >
              <span className="sr-only">{item.value}</span>
            </div>
            <div className="text-xs mt-2 text-muted-foreground">{item.month}</div>
          </div>
        );
      })}
    </div>
  );
};

// Mobile-friendly analytics component
const AdminAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('6months');
  const [analyticsType, setAnalyticsType] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary | null>(null);
  
  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeRange]);
  
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-red-500">Error loading data: {error}</p>
        </div>
      );
    }
    
    if (!analyticsData) {
      return (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }
    
    switch (analyticsType) {
      case 'revenue':
        return <SimpleBarChart data={analyticsData.revenue.data} />;
      case 'users':
        return <SimpleBarChart data={analyticsData.users.data} />;
      case 'events':
        return <SimpleBarChart data={analyticsData.events.data} />;
      default:
        return <SimpleBarChart data={analyticsData.revenue.data} />;
    }
  };
  
  // Get the current metrics for the selected analytics type
  const getCurrentMetrics = () => {
    if (!analyticsData) return null;
    
    switch (analyticsType) {
      case 'revenue':
        return {
          growth: analyticsData.revenue.growth,
          metrics: [
            { label: 'Total Revenue', value: `₹${analyticsData.revenue.totalRevenue.toLocaleString()}` },
            { label: 'Avg. Ticket Price', value: `₹${analyticsData.revenue.avgTicketPrice.toLocaleString()}` },
            { label: 'Total Tickets', value: analyticsData.revenue.totalTickets.toLocaleString() },
            { label: 'Refunds', value: `₹${analyticsData.revenue.refunds.toLocaleString()}` }
          ]
        };
      case 'users':
        return {
          growth: analyticsData.users.growth,
          metrics: [
            { label: 'Total Users', value: analyticsData.users.totalUsers.toLocaleString() },
            { label: 'New Users', value: `+${analyticsData.users.newUsers.toLocaleString()}` },
            { label: 'Active Users', value: analyticsData.users.activeUsers.toLocaleString() },
            { label: 'Retention', value: `${analyticsData.users.retention}%` }
          ]
        };
      case 'events':
        return {
          growth: analyticsData.events.growth,
          metrics: [
            { label: 'Total Events', value: analyticsData.events.totalEvents.toString() },
            { label: 'Active Events', value: analyticsData.events.activeEvents.toString() },
            { label: 'Avg. Attendance', value: `${analyticsData.events.avgAttendance}%` },
            { label: 'Sold Out', value: analyticsData.events.soldOut.toString() }
          ]
        };
      default:
        return null;
    }
  };
  
  const currentMetrics = getCurrentMetrics();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Track key metrics and performance trends</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" value={analyticsType} onValueChange={setAnalyticsType} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="revenue" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">Revenue</h3>
                  <p className="text-muted-foreground">Revenue trend over time</p>
                </div>
                {currentMetrics && (
                  <div className="mt-2 sm:mt-0">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-semibold">
                        {currentMetrics.growth >= 0 ? '+' : ''}{currentMetrics.growth}%
                      </span>
                      <span className="text-muted-foreground text-sm">vs previous period</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              {currentMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {currentMetrics.metrics.map((metric, index) => (
                    <div key={index} className="bg-muted/40 p-3 rounded-md">
                      <div className="text-muted-foreground text-sm">{metric.label}</div>
                      <div className="text-xl font-bold">{metric.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">User Growth</h3>
                  <p className="text-muted-foreground">New user registrations over time</p>
                </div>
                {currentMetrics && (
                  <div className="mt-2 sm:mt-0">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-semibold">
                        {currentMetrics.growth >= 0 ? '+' : ''}{currentMetrics.growth}%
                      </span>
                      <span className="text-muted-foreground text-sm">vs previous period</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              {currentMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {currentMetrics.metrics.map((metric, index) => (
                    <div key={index} className="bg-muted/40 p-3 rounded-md">
                      <div className="text-muted-foreground text-sm">{metric.label}</div>
                      <div className="text-xl font-bold">{metric.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">Event Statistics</h3>
                  <p className="text-muted-foreground">Events created and ticket sales</p>
                </div>
                {currentMetrics && (
                  <div className="mt-2 sm:mt-0">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500 font-semibold">
                        {currentMetrics.growth >= 0 ? '+' : ''}{currentMetrics.growth}%
                      </span>
                      <span className="text-muted-foreground text-sm">vs previous period</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              {currentMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {currentMetrics.metrics.map((metric, index) => (
                    <div key={index} className="bg-muted/40 p-3 rounded-md">
                      <div className="text-muted-foreground text-sm">{metric.label}</div>
                      <div className="text-xl font-bold">{metric.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.href = `/api/admin/analytics/export?timeRange=${timeRange}&type=${analyticsType}`}
        >
          Export Data
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = `/admin/reports/${analyticsType}?timeRange=${timeRange}`}
        >
          View Full Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminAnalytics;