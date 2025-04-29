import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  getAllUpiSettings,
  createUpiSetting,
  updateUpiSetting,
  deleteUpiSetting,
  UpiSetting
} from '@/services/api/paymentApi';
import useAuth from '@/hooks/useAuth';

// Simple Admin Layout wrapper
const AdminLayout: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 pt-16 pb-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const AdminUpiManagement = () => {
  const { isAuthenticated } = useAuth();
  const [upiSettings, setUpiSettings] = useState<UpiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [newDiscountAmount, setNewDiscountAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch UPI settings on component mount
  useEffect(() => {
    fetchUpiSettings();
  }, []);

  const fetchUpiSettings = async () => {
    if (!isAuthenticated) {
      setConfigError('You must be logged in to access UPI settings');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const settings = await getAllUpiSettings();
      setUpiSettings(settings);
      setConfigError(null);
    } catch (error) {
      console.error('Error fetching UPI settings:', error);
      setConfigError('Failed to load UPI settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding a new UPI setting
  const handleAddUpiSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUpiId || newDiscountAmount < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid UPI ID and discount amount",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newSetting = await createUpiSetting({
        upivpa: newUpiId,
        discountamount: newDiscountAmount,
        isactive: true
      });
      
      setUpiSettings(prev => [...prev, newSetting]);
      
      // Reset form
      setNewUpiId('');
      setNewDiscountAmount(0);
      
      toast({
        title: "UPI setting added",
        description: "The new UPI setting has been added successfully",
      });
    } catch (error) {
      console.error('Error adding UPI setting:', error);
      toast({
        title: "Failed to add UPI setting",
        description: "There was an error adding the UPI setting. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle toggling UPI setting active status
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateUpiSetting(id, { isactive: !currentActive });
      
      // Update local state
      setUpiSettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, isactive: !currentActive } 
            : setting
        )
      );
      
      toast({
        title: `UPI setting ${!currentActive ? 'activated' : 'deactivated'}`,
        description: `The UPI setting has been ${!currentActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating UPI setting:', error);
      toast({
        title: "Failed to update UPI setting",
        description: "There was an error updating the UPI setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle deleting a UPI setting
  const handleDeleteUpiSetting = async (id: string) => {
    try {
      await deleteUpiSetting(id);
      
      // Update local state
      setUpiSettings(prev => prev.filter(setting => setting.id !== id));
      
      toast({
        title: "UPI setting deleted",
        description: "The UPI setting has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting UPI setting:', error);
      toast({
        title: "Failed to delete UPI setting",
        description: "There was an error deleting the UPI setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Simplified inner content to avoid layout nesting when used as a component
  const UpiManagementContent = () => (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UPI Payment Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage UPI IDs for receiving payments and generating QR codes
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New UPI ID</CardTitle>
          <CardDescription>
            Add a new UPI ID for payments. Only one UPI ID can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUpiSetting} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="UPI ID (e.g., business@ybl)"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-1/4">
              <Input
                type="number"
                placeholder="Discount (₹)"
                value={newDiscountAmount}
                onChange={(e) => setNewDiscountAmount(parseInt(e.target.value))}
                min="0"
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="whitespace-nowrap">
              <PlusCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Adding...' : 'Add UPI ID'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All UPI IDs</CardTitle>
          <CardDescription>
            View and manage UPI IDs for payment collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : configError ? (
            <div className="flex items-center p-6 text-red-600 bg-red-50 rounded-md border border-red-200">
              <AlertCircle className="h-5 w-5 mr-3" />
              <p>{configError}</p>
            </div>
          ) : upiSettings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium">No UPI IDs configured</h3>
              <p className="text-sm text-gray-500 mt-2">
                Add your first UPI ID to start receiving payments.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UPI ID</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upiSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.upivpa}</TableCell>
                    <TableCell>
                      {setting.discountamount > 0 ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ₹{setting.discountamount}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">No discount</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={setting.isactive} 
                          onCheckedChange={() => handleToggleActive(setting.id, setting.isactive)}
                        />
                        <span className={`text-sm ${setting.isactive ? 'text-green-600' : 'text-gray-500'}`}>
                          {setting.isactive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(setting.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteUpiSetting(setting.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <p className="text-sm text-gray-500">
            {upiSettings.filter(s => s.isactive).length} active UPI IDs
          </p>
          <Button variant="outline" onClick={fetchUpiSettings}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  // When used as a standalone page
  if (window.location.pathname.includes('/admin/upi-settings')) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <UpiManagementContent />
        </div>
      </AdminLayout>
    );
  }

  // When used as a component in the dashboard
  return <UpiManagementContent />;
};

export default AdminUpiManagement;
