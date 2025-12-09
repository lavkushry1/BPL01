import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Trash, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { getAllDiscounts, createDiscount, deleteDiscount } from '@/services/api/discountApi';

// Define types
interface Discount {
  id: string;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  maxUses: number;
  usedCount: number;
  minAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminDiscountManagement = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Form states
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date;
  });
  const [description, setDescription] = useState('');
  
  useEffect(() => {
    fetchDiscounts();
  }, []);
  
  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const discountData = await getAllDiscounts();
      setDiscounts(discountData);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load discounts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCode || discountValue <= 0 || !startDate || !endDate) {
      toast({
        title: 'Invalid input',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (startDate >= endDate) {
      toast({
        title: 'Invalid date range',
        description: 'End date must be after start date.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newDiscount = await createDiscount({
        code: newCode,
        type: discountType,
        value: discountValue,
        minAmount: minAmount || 0,
        maxUses: maxUses,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        description: description,
      });
      
      setDiscounts(prev => [...prev, newDiscount]);
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Success',
        description: `Discount code ${newCode} has been created.`,
      });
    } catch (error: any) {
      console.error('Error creating discount:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create discount. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteDiscount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) {
      return;
    }
    
    try {
      await deleteDiscount(id);
      setDiscounts(prev => prev.filter(discount => discount.id !== id));
      
      toast({
        title: 'Success',
        description: 'Discount has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete discount. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const resetForm = () => {
    setNewCode('');
    setDiscountType('FIXED');
    setDiscountValue(0);
    setMinAmount(undefined);
    setMaxUses(100);
    setStartDate(new Date());
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEndDate(nextMonth);
    setDescription('');
  };
  
  const getFilteredDiscounts = () => {
    const now = new Date();
    
    switch (selectedFilter) {
      case 'active':
        return discounts.filter(d => 
          d.isActive && 
          new Date(d.startDate) <= now && 
          new Date(d.endDate) >= now
        );
      case 'upcoming':
        return discounts.filter(d => new Date(d.startDate) > now);
      case 'expired':
        return discounts.filter(d => new Date(d.endDate) < now);
      default:
        return discounts;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    return discount.isActive && 
           new Date(discount.startDate) <= now && 
           new Date(discount.endDate) >= now;
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16 pb-12 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Discount Management</h1>
          
          <div className="flex justify-between items-center mb-6">
            <Tabs defaultValue="all" onValueChange={setSelectedFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Discount
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Discount</DialogTitle>
                  <DialogDescription>
                    Create a new discount code for your customers.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddDiscount} className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="code">Discount Code</Label>
                      <Input
                        id="code"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="SUMMER2023"
                        className="uppercase"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select 
                        value={discountType} 
                        onValueChange={(value: 'FIXED' | 'PERCENTAGE') => setDiscountType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="value">
                        {discountType === 'FIXED' ? 'Amount (₹)' : 'Percentage (%)'}
                      </Label>
                      <Input
                        id="value"
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        min={0}
                        max={discountType === 'PERCENTAGE' ? 100 : undefined}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="minAmount">Min Purchase Amount (₹)</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        value={minAmount ?? ''}
                        onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : undefined)}
                        min={0}
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxUses">Maximum Uses</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        min={1}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => date && setStartDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => date && setEndDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Special discount for summer sale"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Discount'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Discount Codes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : getFilteredDiscounts().length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Valid Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredDiscounts().map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell className="font-bold">
                          {discount.code}
                          {discount.minAmount ? (
                            <span className="block text-xs text-gray-500">
                              Min. ₹{discount.minAmount}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {discount.type === 'FIXED' ? (
                            `₹${discount.value}`
                          ) : (
                            `${discount.value}%`
                          )}
                        </TableCell>
                        <TableCell>
                          {discount.usedCount} / {discount.maxUses}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span>{formatDate(discount.startDate)}</span>
                            <span className="mx-1">to</span>
                            <span>{formatDate(discount.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isDiscountActive(discount) ? "default" : "secondary"}
                            className={
                              isDiscountActive(discount) 
                                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {isDiscountActive(discount) ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteDiscount(discount.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No discount codes found for the selected filter.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDiscountManagement;
