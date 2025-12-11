import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { defaultApiClient } from '@/services/api/apiUtils';
import { ArrowDownAZ, ArrowUpAZ, CheckCircle, FileText, Filter, Loader2, Search, Truck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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
        const response = await defaultApiClient.get(`/payments?status=awaiting_verification`);

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
      const response = await defaultApiClient.put(`/payments/${selectedUtr.id}/verify`, {});

      if (response.data && response.data.success) {
        toast({
          title: "UTR Verified",
          description: `UTR ${selectedUtr.id} has been verified successfully.`,
        });

        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'verified' } : utr
          )
        );
        setSelectedUtr({ ...selectedUtr, status: 'verified' });
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
      const response = await defaultApiClient.put(`/payments/${selectedUtr.id}/reject`, {});

      if (response.data && response.data.success) {
        toast({
          title: "UTR Rejected",
          description: `UTR ${selectedUtr.id} has been marked as rejected.`,
          variant: "destructive"
        });

        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'rejected' } : utr
          )
        );
        setSelectedUtr({ ...selectedUtr, status: 'rejected' });
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
      const response = await defaultApiClient.post(`/admin/tickets/dispatch/${selectedUtr.id}`);

      if (response.data && response.data.success) {
        toast({
          title: "Ticket Dispatched",
          description: `Tickets for UTR ${selectedUtr.id} have been dispatched.`,
        });

        setUtrData(prevData =>
          prevData.map(utr =>
            utr.id === selectedUtr.id ? { ...utr, status: 'dispatched' } : utr
          )
        );
        setSelectedUtr({ ...selectedUtr, status: 'dispatched' });
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
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 backdrop-blur-sm">Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 backdrop-blur-sm">Verified</Badge>;
      case 'dispatched':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 backdrop-blur-sm">Dispatched</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-sm">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-white/5">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">UTR Verification</h1>
          <p className="text-slate-400 mt-1">Verify payments and dispatch tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-white/5 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Submissions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    {sortDirection === 'desc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search UTR, name, or event details..."
                    className="pl-9 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <Tabs defaultValue="all" className="mb-6" onValueChange={setFilter}>
                <TabsList className="bg-slate-950/50 border border-white/5 w-full justify-start p-1 h-auto flex-wrap">
                  {['all', 'pending', 'verified', 'dispatched'].map(tab => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 capitalize flex-1 min-w-[80px]"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {isLoading ? (
                <div className="py-20 flex flex-col justify-center items-center text-slate-500">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                  <p>Loading transactions...</p>
                </div>
              ) : filteredUTRs.length === 0 ? (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-xl bg-slate-950/30">
                    <div className="bg-slate-900/50 p-4 rounded-full w-fit mx-auto mb-4">
                      <Filter className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium">No records found</p>
                    <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                    <div className="rounded-xl border border-white/5 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-950/50">
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-slate-400">UTR ID</TableHead>
                            <TableHead className="text-slate-400">Customer</TableHead>
                            <TableHead className="text-slate-400">Event</TableHead>
                            <TableHead className="text-slate-400">Amount</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-right text-slate-400">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUTRs.map((utr) => (
                            <TableRow
                              key={utr.id}
                          className={`cursor-pointer border-white/5 transition-colors ${selectedUtr?.id === utr.id ? 'bg-blue-600/10 hover:bg-blue-600/20' : 'hover:bg-white/5'}`}
                          onClick={() => setSelectedUtr(utr)}
                        >
                          <TableCell className="font-medium text-white font-mono">{utr.id}</TableCell>
                          <TableCell className="text-slate-300">
                            <div>{utr.customerName}</div>
                            <div className="text-xs text-slate-500">{utr.phone}</div>
                          </TableCell>
                          <TableCell className="text-slate-300 max-w-[150px] truncate">{utr.eventName}</TableCell>
                          <TableCell className="text-white font-bold">₹{utr.amount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(utr.status)}</TableCell>
                          <TableCell className="text-right text-slate-500 text-xs">{new Date(utr.date).toLocaleDateString()}</TableCell>
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
          {/* Detail Panel */}
          <div className="sticky top-24">
            <Card className="bg-slate-900/80 border-white/10 backdrop-blur-md shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-white">Transaction Details</CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedUtr ? `Viewing UTR: ${selectedUtr.id}` : 'Select a transaction to view actions'}
                </CardDescription>
                </CardHeader>
              <CardContent className="pt-6">
                  {!selectedUtr ? (
                  <div className="py-12 text-center text-slate-500">
                    <FileText className="h-16 w-16 mx-auto text-slate-700 mb-4 opacity-50" />
                    <p>Select a record from the list</p>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-fade-in">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Customer Information</h3>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Name</span>
                            <span className="text-white font-medium">{selectedUtr.customerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Email</span>
                            <span className="text-white font-medium text-sm">{selectedUtr.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Phone</span>
                            <span className="text-white font-medium text-sm">{selectedUtr.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Details</h3>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Amount Paid</span>
                            <span className="text-2xl font-bold text-green-400">₹{selectedUtr.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-slate-400 text-sm">Status</span>
                            <span>{getStatusBadge(selectedUtr.status)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Time</span>
                            <span className="text-slate-300 text-sm">{new Date(selectedUtr.date).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Info */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Event</span>
                            <span className="text-white text-right text-sm ml-4">{selectedUtr.eventName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Category</span>
                            <span className="text-white text-sm">{selectedUtr.ticketCategory}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Quantity</span>
                            <span className="text-white text-sm">x{selectedUtr.quantity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                        {selectedUtr.status === 'pending' && (
                          <>
                            <Button
                              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 shadow-lg shadow-green-900/20"
                              onClick={handleVerifyUtr}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                              Verify Payment
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 h-12"
                              onClick={handleRejectUtr}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                              Reject Payment
                            </Button>
                          </>
                        )}

                        {selectedUtr.status === 'verified' && (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 shadow-lg shadow-blue-900/20"
                            onClick={handleDispatchTicket}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                            Dispatch Tickets
                          </Button>
                        )}

                        {(selectedUtr.status === 'dispatched' || selectedUtr.status === 'rejected') && (
                          <div className="p-3 rounded-lg bg-slate-800 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" /> Action Completed
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUtrVerification;
