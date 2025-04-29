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
  deleteUpiSetting
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

export interface UpiSetting {
  id: string;
  upivpa: string;
  discountamount: number;
  isactive: boolean;
  created_at: string;
  updated_at: string;
}

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

  if (configError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-500">
                <AlertCircle className="mr-2 h-5 w-5" />
                Configuration Error
              </CardTitle>
              <CardDescription>
                There was a problem loading the UPI management features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {configError}
              </p>
              <Button onClick={fetchUpiSettings}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">UPI Payment Management</h1>
        
        {/* Add new UPI setting form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New UPI</CardTitle>
            <CardDescription>
              Create a new UPI payment option with optional discount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUpiSetting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="upiId" className="block text-sm font-medium mb-1">
                    UPI ID
                  </label>
                  <Input
                    id="upiId"
                    type="text"
                    value={newUpiId}
                    onChange={(e) => setNewUpiId(e.target.value)}
                    placeholder="example@okbank"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="discountAmount" className="block text-sm font-medium mb-1">
                    Discount Amount (₹)
                  </label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="1"
                    value={newDiscountAmount}
                    onChange={(e) => setNewDiscountAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add UPI ID
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* UPI settings list */}
        <Card>
          <CardHeader>
            <CardTitle>UPI IDs</CardTitle>
            <CardDescription>
              Manage existing UPI payment options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : upiSettings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No UPI settings found. Add your first UPI ID above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
    </AdminLayout>
  );
};

export default AdminUpiManagement;
