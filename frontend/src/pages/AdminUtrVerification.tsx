import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Truck, AlertCircle, ArrowDownAZ, ArrowUpAZ, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { defaultApiClient } from '@/services/api/apiUtils';
import { API_BASE_URL } from '@/config';

interface UtrVerification {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  amount: number;
  status: 'pending' | 'verified' | 'dispatched' | 'rejected';
  date: string;
  eventName: string;
  ticketCategory: string;
  quantity: number;
}

const AdminUtrVerification = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedUtr, setSelectedUtr] = useState<UtrVerification | null>(null);
  const [utrData, setUtrData] = useState<UtrVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch UTR verifications from the API
  useEffect(() => {
    const fetchUtrVerifications = async () => {
      try {
        setIsLoading(true);
        const response = await defaultApiClient.get(`${API_BASE_URL}/admin/payments/utr-verifications`);

        if (response.data && response.data.data) {
          setUtrData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching UTR verifications:', error);
        toast({
          title: "Failed to load data",
          description: "Could not fetch UTR verifications. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUtrVerifications();
  }, []);

  // Filter and sort UTRs
  const filteredUTRs = utrData
    .filter(utr => {
      if (filter !== 'all' && utr.status !== filter) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        utr.id.toLowerCase().includes(searchLower) ||
        utr.customerName.toLowerCase().includes(searchLower) ||
        utr.email.toLowerCase().includes(searchLower) ||
        utr.eventName.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const handleVerifyUtr = async () => {
    if (!selectedUtr) return;

    try {
      setIsProcessing(true);

      // Call API to update UTR status
      const response = await defaultApiClient.post(`${API_BASE_URL}/admin/payments/verify-utr/${selectedUtr.id}`);

      if (response.data && response.data.success) {
        toast({
          title: "UTR Verified",
          description: `UTR ${selectedUtr.id} has been verified successfully.`,
        });

        // Update the UTR in the local state
        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'verified' } : utr
          )
        );

        // Update the selected UTR
        setSelectedUtr({
          ...selectedUtr,
          status: 'verified'
        });
      }
    } catch (error) {
      console.error('Error verifying UTR:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify the UTR. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUtr = async () => {
    if (!selectedUtr) return;

    try {
      setIsProcessing(true);

      // Call API to reject UTR
      const response = await defaultApiClient.post(`${API_BASE_URL}/admin/payments/reject-utr/${selectedUtr.id}`);

      if (response.data && response.data.success) {
        toast({
          title: "UTR Rejected",
          description: `UTR ${selectedUtr.id} has been marked as rejected.`,
          variant: "destructive"
        });

        // Update the UTR in the local state
        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'rejected' } : utr
          )
        );

        // Update the selected UTR
        setSelectedUtr({
          ...selectedUtr,
          status: 'rejected'
        });
      }
    } catch (error) {
      console.error('Error rejecting UTR:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the UTR. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispatchTicket = async () => {
    if (!selectedUtr) return;

    try {
      setIsProcessing(true);

      // Call API to dispatch ticket
      const response = await defaultApiClient.post(`${API_BASE_URL}/admin/tickets/dispatch/${selectedUtr.id}`);

      if (response.data && response.data.success) {
        toast({
          title: "Ticket Dispatched",
          description: `Tickets for UTR ${selectedUtr.id} have been dispatched.`,
        });

        // Update the UTR in the local state
        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'dispatched' } : utr
          )
        );

        // Update the selected UTR
        setSelectedUtr({
          ...selectedUtr,
          status: 'dispatched'
        });
      }
    } catch (error) {
      console.error('Error dispatching ticket:', error);
      toast({
        title: "Dispatch Failed",
        description: "Failed to dispatch the tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Verified</Badge>;
      case 'dispatched':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Dispatched</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow bg-gray-50 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">UTR Verification & Ticket Dispatch</h1>
            <p className="text-gray-600 mt-1">Verify payments and dispatch tickets to customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>UTR Submissions</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                        className="text-gray-500"
                      >
                        {sortDirection === 'desc' ? (
                          <ArrowDownAZ className="h-4 w-4" />
                        ) : (
                          <ArrowUpAZ className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search by UTR, customer, or event..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="all" className="mb-4" onValueChange={setFilter}>
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="verified">Verified</TabsTrigger>
                      <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {isLoading ? (
                    <div className="py-8 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2 text-gray-600">Loading UTR data...</p>
                    </div>
                  ) : filteredUTRs.length === 0 ? (
                    <div className="py-8 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500">No UTR verifications found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UTR ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUTRs.map((utr) => (
                            <TableRow
                              key={utr.id}
                              className={`cursor-pointer ${selectedUtr?.id === utr.id ? 'bg-primary/5' : ''}`}
                              onClick={() => setSelectedUtr(utr)}
                            >
                              <TableCell className="font-medium">{utr.id}</TableCell>
                              <TableCell>{utr.customerName}</TableCell>
                              <TableCell>{utr.eventName}</TableCell>
                              <TableCell>₹{utr.amount.toLocaleString()}</TableCell>
                              <TableCell>{getStatusBadge(utr.status)}</TableCell>
                              <TableCell>{new Date(utr.date).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>UTR Details</CardTitle>
                  <CardDescription>
                    {selectedUtr ? 'Verify and process the selected UTR' : 'Select a UTR to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedUtr ? (
                    <div className="py-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="mt-2 text-gray-500">Select a UTR to view details</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Information</h3>
                        <div className="space-y-1">
                          <p className="font-medium">{selectedUtr.customerName}</p>
                          <p className="text-sm text-gray-600">{selectedUtr.email}</p>
                          <p className="text-sm text-gray-600">{selectedUtr.phone}</p>
                          <p className="text-sm text-gray-600">{selectedUtr.address}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Details</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">UTR ID:</span>
                            <span className="font-medium">{selectedUtr.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <span className="font-medium">₹{selectedUtr.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span>{getStatusBadge(selectedUtr.status)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Date:</span>
                            <span className="font-medium">{new Date(selectedUtr.date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Order Details</h3>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Event:</span>
                            <span className="font-medium">{selectedUtr.eventName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ticket Category:</span>
                            <span className="font-medium">{selectedUtr.ticketCategory}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className="font-medium">{selectedUtr.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 space-y-2">
                        {selectedUtr.status === 'pending' && (
                          <>
                            <Button
                              className="w-full"
                              onClick={handleVerifyUtr}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Payment
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-red-700"
                              onClick={handleRejectUtr}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject Payment
                                </>
                              )}
                            </Button>
                          </>
                        )}

                        {selectedUtr.status === 'verified' && (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={handleDispatchTicket}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Truck className="mr-2 h-4 w-4" />
                                Dispatch Tickets
                              </>
                            )}
                          </Button>
                        )}

                        {selectedUtr.status === 'dispatched' && (
                          <Button variant="outline" className="w-full" disabled>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Tickets Dispatched
                          </Button>
                        )}

                        {selectedUtr.status === 'rejected' && (
                          <Button variant="outline" className="w-full" disabled>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Payment Rejected
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUtrVerification;
