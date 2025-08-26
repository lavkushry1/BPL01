import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { api } from '../../api';

interface MetricsData {
  timeframe: string;
  aggregatedData: {
    avgFcp: number;
    avgLcp: number;
    avgCls: number;
    avgFid: number;
    avgMemoryUsage: number;
    totalSessions: number;
    uniqueSessions: number;
  };
  percentileData: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  networkDistribution: Array<{
    networkType: string;
    count: number;
  }>;
}

const MobilePerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('24h');
  const [metric, setMetric] = useState('lcp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);

  useEffect(() => {
    fetchMetricsData();
  }, [timeframe, metric]);

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/metrics/mobile/aggregate?timeframe=${timeframe}&metric=${metric}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching metrics data:', err);
      setError('Failed to load performance metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMetricValue = (value: number, metricType: string) => {
    if (!value) return 'N/A';

    switch (metricType) {
      case 'fcp':
      case 'lcp':
      case 'fid':
        return `${value.toFixed(0)} ms`;
      case 'cls':
        return value.toFixed(3);
      case 'memoryUsage':
        return `${value.toFixed(1)} MB`;
      default:
        return value.toFixed(2);
    }
  };

  const getMetricName = (metricKey: string) => {
    const metricNames: Record<string, string> = {
      fcp: 'First Contentful Paint',
      lcp: 'Largest Contentful Paint',
      cls: 'Cumulative Layout Shift',
      fid: 'First Input Delay',
      memoryUsage: 'Memory Usage',
    };

    return metricNames[metricKey] || metricKey;
  };

  const getMetricThreshold = (metricKey: string) => {
    const thresholds: Record<string, { good: number; needsImprovement: number; unit: string }> = {
      fcp: { good: 1800, needsImprovement: 3000, unit: 'ms' },
      lcp: { good: 2500, needsImprovement: 4000, unit: 'ms' },
      cls: { good: 0.1, needsImprovement: 0.25, unit: '' },
      fid: { good: 100, needsImprovement: 300, unit: 'ms' },
      memoryUsage: { good: 50, needsImprovement: 100, unit: 'MB' },
    };

    return thresholds[metricKey] || { good: 0, needsImprovement: 0, unit: '' };
  };

  const getMetricStatus = (value: number, metricKey: string) => {
    if (!value) return 'unknown';

    const threshold = getMetricThreshold(metricKey);
    
    if (metricKey === 'cls') {
      // For CLS, lower is better
      if (value <= threshold.good) return 'good';
      if (value <= threshold.needsImprovement) return 'needs-improvement';
      return 'poor';
    } else {
      // For other metrics, lower is better
      if (value <= threshold.good) return 'good';
      if (value <= threshold.needsImprovement) return 'needs-improvement';
      return 'poor';
    }
  };

  const preparePercentileChartData = () => {
    if (!data?.percentileData) return [];

    return [
      { name: 'p50', value: data.percentileData.p50 },
      { name: 'p75', value: data.percentileData.p75 },
      { name: 'p90', value: data.percentileData.p90 },
      { name: 'p95', value: data.percentileData.p95 },
      { name: 'p99', value: data.percentileData.p99 },
    ];
  };

  const prepareNetworkChartData = () => {
    if (!data?.networkDistribution) return [];

    return data.networkDistribution.map(item => ({
      name: item.networkType || 'unknown',
      value: item.count,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading performance metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Mobile Performance Monitoring</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lcp">Largest Contentful Paint</SelectItem>
              <SelectItem value="fcp">First Contentful Paint</SelectItem>
              <SelectItem value="cls">Cumulative Layout Shift</SelectItem>
              <SelectItem value="fid">First Input Delay</SelectItem>
              <SelectItem value="memoryUsage">Memory Usage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="percentiles">Percentiles</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data && [
              { key: 'fcp', label: 'First Contentful Paint' },
              { key: 'lcp', label: 'Largest Contentful Paint' },
              { key: 'cls', label: 'Cumulative Layout Shift' },
              { key: 'fid', label: 'First Input Delay' },
            ].map((metricInfo) => {
              const metricKey = metricInfo.key as keyof typeof data.aggregatedData;
              const avgValue = data.aggregatedData[`avg${metricKey.charAt(0).toUpperCase() + metricKey.slice(1)}` as keyof typeof data.aggregatedData];
              const status = getMetricStatus(Number(avgValue), metricKey);
              
              return (
                <Card key={metricKey} className={`border-l-4 ${status === 'good' ? 'border-l-green-500' : status === 'needs-improvement' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{metricInfo.label}</CardTitle>
                    <CardDescription>Average</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatMetricValue(Number(avgValue), metricKey)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Average memory consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {data && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-5xl font-bold">
                          {formatMetricValue(Number(data.aggregatedData.avgMemoryUsage), 'memoryUsage')}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Average memory usage across {data.aggregatedData.uniqueSessions} sessions
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Total monitored sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <div className="text-5xl font-bold">
                    {data?.aggregatedData.uniqueSessions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Unique sessions
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data?.aggregatedData.totalSessions || 0} total data points
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="percentiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{getMetricName(metric)} Percentiles</CardTitle>
              <CardDescription>
                Distribution across different percentiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={preparePercentileChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatMetricValue(Number(value), metric), getMetricName(metric)]}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Distribution</CardTitle>
              <CardDescription>
                Performance across different network types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareNetworkChartData()} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobilePerformanceDashboard;