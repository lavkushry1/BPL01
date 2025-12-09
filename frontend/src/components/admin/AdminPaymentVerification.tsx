import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { defaultApiClient } from '@/services/api/apiUtils';
import { AlertCircle, CheckCircle2, Clock, Download, ExternalLink, Filter, Loader2, Search, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Customer {
  name: string;
  email: string;
  avatar?: string;
}

interface Payment {
  id: string;
  customer: Customer;
  event: string;
  amount: number;
  status: 'pending' | 'verified' | 'rejected';
  utr: string;
  timestamp: string;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-600 border-yellow-200">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'verified':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-600 border-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-600 border-red-200">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

// Format amount
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Mobile-friendly payment verification component
const AdminPaymentVerification: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payments from API
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await defaultApiClient.get('/admin/payments');
        setPayments(response.data);
      } catch (err) {
        console.error('Error fetching payment data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments based on tab and search query
  useEffect(() => {
    if (payments.length === 0) return;

    let result = payments;

    // Filter by status tab
    if (activeTab !== 'all') {
      result = result.filter(payment => payment.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(payment =>
        payment.customer.name.toLowerCase().includes(query) ||
        payment.customer.email.toLowerCase().includes(query) ||
        payment.event.toLowerCase().includes(query) ||
        payment.utr.toLowerCase().includes(query) ||
        payment.id.toLowerCase().includes(query)
      );
    }

    setFilteredPayments(result);
  }, [payments, activeTab, searchQuery]);

  // Handle payment verification
  const handleVerifyPayment = async (paymentId: string) => {
    setIsVerifying(true);

    try {
      await defaultApiClient.post(`/admin/payments/${paymentId}/verify`);

      // Update payment status in state
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentId
            ? { ...payment, status: 'verified' }
            : payment
        )
      );

      // Show success toast
      toast({
        title: "Payment verified successfully",
        description: `Payment ID: ${paymentId} has been verified`,
      });
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : 'An error occurred during verification',
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async (paymentId: string) => {
    setIsRejecting(true);

    try {
      await defaultApiClient.post(`/admin/payments/${paymentId}/reject`);

      // Update payment status in state
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentId
            ? { ...payment, status: 'rejected' }
            : payment
        )
      );

      // Show error toast
      toast({
        title: "Payment rejected",
        description: `Payment ID: ${paymentId} has been rejected`,
        variant: "destructive"
      });
    } catch (err) {
      console.error('Error rejecting payment:', err);
      toast({
        title: "Rejection failed",
        description: err instanceof Error ? err.message : 'An error occurred during rejection',
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle export of payments data
  const handleExportPayments = () => {
    window.location.href = `/api/admin/payments/export?status=${activeTab}&search=${encodeURIComponent(searchQuery)}`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>Verify UPI payments and manage transactions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading payment data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>Verify UPI payments and manage transactions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-500 font-medium mb-2">Error loading payment data</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Payment Verification</CardTitle>
            <CardDescription>Verify UPI payments and manage transactions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={handleExportPayments}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, event, UTR..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs for filtering */}
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Payments table for larger screens */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">No payments found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={payment.customer.avatar} alt={payment.customer.name} />
                          <AvatarFallback>{payment.customer.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{payment.customer.name}</div>
                          <div className="text-xs text-muted-foreground">{payment.customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{payment.event}</TableCell>
                    <TableCell className="font-medium">{formatAmount(payment.amount)}</TableCell>
                    <TableCell>{payment.utr}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>{formatDate(payment.timestamp)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyPayment(payment.id)}
                              disabled={isVerifying}
                              className="h-8 gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Verify</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectPayment(payment.id)}
                              disabled={isRejecting}
                              className="h-8 gap-1 border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}
                        {(payment.status === 'verified' || payment.status === 'rejected') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => window.location.href = `/admin/payments/${payment.id}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile-friendly payment cards */}
        <div className="md:hidden space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No payments found</p>
            </div>
          ) : (
            filteredPayments.map(payment => (
              <Card key={payment.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={payment.customer.avatar} alt={payment.customer.name} />
                        <AvatarFallback>{payment.customer.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{payment.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{payment.customer.email}</div>
                      </div>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Event</div>
                      <div className="font-medium truncate">{payment.event}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-medium">{formatAmount(payment.amount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">UTR</div>
                      <div className="font-medium">{payment.utr}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Date</div>
                      <div className="font-medium">{formatDate(payment.timestamp)}</div>
                    </div>
                  </div>

                  {payment.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleVerifyPayment(payment.id)}
                        disabled={isVerifying}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectPayment(payment.id)}
                        disabled={isRejecting}
                        className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {(payment.status === 'verified' || payment.status === 'rejected') && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.location.href = `/admin/payments/${payment.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="md:hidden">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={handleExportPayments}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AdminPaymentVerification;
