import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, BarChart, TrendingUp, Users, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const MOCK_REVENUE_DATA = [
  { month: 'Jan', value: 12500 },
  { month: 'Feb', value: 18200 },
  { month: 'Mar', value: 15800 },
  { month: 'Apr', value: 22400 },
  { month: 'May', value: 19600 },
  { month: 'Jun', value: 24800 },
];

const MOCK_USER_DATA = [
  { month: 'Jan', value: 245 },
  { month: 'Feb', value: 308 },
  { month: 'Mar', value: 367 },
  { month: 'Apr', value: 412 },
  { month: 'May', value: 498 },
  { month: 'Jun', value: 576 },
];

const MOCK_EVENTS_DATA = [
  { month: 'Jan', value: 5 },
  { month: 'Feb', value: 8 },
  { month: 'Mar', value: 6 },
  { month: 'Apr', value: 12 },
  { month: 'May', value: 9 },
  { month: 'Jun', value: 15 },
];

// Simple bar chart component
const SimpleBarChart = ({ data, maxHeight = 200 }: { data: { month: string; value: number }[], maxHeight?: number }) => {
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
  
  const renderChart = () => {
    switch (analyticsType) {
      case 'revenue':
        return <SimpleBarChart data={MOCK_REVENUE_DATA} />;
      case 'users':
        return <SimpleBarChart data={MOCK_USER_DATA} />;
      case 'events':
        return <SimpleBarChart data={MOCK_EVENTS_DATA} />;
      default:
        return <SimpleBarChart data={MOCK_REVENUE_DATA} />;
    }
  };
  
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
                <div className="mt-2 sm:mt-0">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-semibold">+12.5%</span>
                    <span className="text-muted-foreground text-sm">vs previous period</span>
                  </div>
                </div>
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Total Revenue</div>
                  <div className="text-xl font-bold">₹113,300</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Avg. Ticket Price</div>
                  <div className="text-xl font-bold">₹1,240</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Total Tickets</div>
                  <div className="text-xl font-bold">2,156</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Refunds</div>
                  <div className="text-xl font-bold">₹5,480</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">User Growth</h3>
                  <p className="text-muted-foreground">New user registrations over time</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-semibold">+15.8%</span>
                    <span className="text-muted-foreground text-sm">vs previous period</span>
                  </div>
                </div>
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Total Users</div>
                  <div className="text-xl font-bold">2,406</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">New Users</div>
                  <div className="text-xl font-bold">+576</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Active Users</div>
                  <div className="text-xl font-bold">1,845</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Retention</div>
                  <div className="text-xl font-bold">76.8%</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="mt-0">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">Event Statistics</h3>
                  <p className="text-muted-foreground">Events created and ticket sales</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-semibold">+66.7%</span>
                    <span className="text-muted-foreground text-sm">vs previous period</span>
                  </div>
                </div>
              </div>
              
              <div className="chart-container">
                {renderChart()}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Total Events</div>
                  <div className="text-xl font-bold">55</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Active Events</div>
                  <div className="text-xl font-bold">24</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Avg. Attendance</div>
                  <div className="text-xl font-bold">78.2%</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-md">
                  <div className="text-muted-foreground text-sm">Sold Out</div>
                  <div className="text-xl font-bold">12</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">Export Data</Button>
        <Button variant="outline" size="sm">View Full Report</Button>
      </CardFooter>
    </Card>
  );
};

export default AdminAnalytics; 