import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { upiSettingsApi } from '@/services/api/adminApi';
import { formatDate } from '@/utils/formatters';

interface UpiSetting {
    id: string;
    upivpa: string;
    discountamount: number;
    isactive: boolean;
    created_at: string;
    updated_at: string;
}

const UpiSettingsManager: React.FC = () => {
    const [upiSettings, setUpiSettings] = useState<UpiSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [newUpiId, setNewUpiId] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isActive, setIsActive] = useState(true);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    // Fetch UPI settings on component mount
    useEffect(() => {
        fetchUpiSettings();
    }, []);

    const fetchUpiSettings = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await upiSettingsApi.getAllUpiSettings();
            setUpiSettings(response.data || []);
        } catch (error) {
            console.error('Error fetching UPI settings:', error);
            setError('Failed to load UPI settings. Please try again.');

            toast({
                title: "Failed to load UPI settings",
                description: "There was an error loading UPI settings. Please refresh the page.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUpiSetting = async () => {
        if (!newUpiId) {
            toast({
                title: "UPI ID is required",
                description: "Please enter a valid UPI ID",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const data = {
                upivpa: newUpiId,
                discountamount: Number(discountAmount),
                isactive: isActive
            };

            if (editMode && currentEditId) {
                // Update existing setting
                await upiSettingsApi.updateUpiSetting(currentEditId, data);
                toast({
                    title: "UPI setting updated",
                    description: `Updated UPI ID: ${newUpiId}`,
                });
            } else {
                // Create new setting
                await upiSettingsApi.createUpiSetting(data);
                toast({
                    title: "UPI setting created",
                    description: `New UPI ID: ${newUpiId} has been added`,
                });
            }

            // Refresh the list
            await fetchUpiSettings();

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Error saving UPI setting:', error);

            toast({
                title: "Failed to add UPI setting",
                description: "There was an error adding the UPI setting. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditUpiSetting = (setting: UpiSetting) => {
        setNewUpiId(setting.upivpa);
        setDiscountAmount(setting.discountamount);
        setIsActive(setting.isactive);
        setEditMode(true);
        setCurrentEditId(setting.id);
    };

    const handleDeleteUpiSetting = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this UPI setting?')) {
            try {
                await upiSettingsApi.deleteUpiSetting(id);

                toast({
                    title: "UPI setting deleted",
                    description: "The UPI setting has been deleted successfully",
                });

                // Refresh the list
                await fetchUpiSettings();
            } catch (error) {
                console.error('Error deleting UPI setting:', error);

                toast({
                    title: "Failed to delete UPI setting",
                    description: "There was an error deleting the UPI setting. It may be in use.",
                    variant: "destructive"
                });
            }
        }
    };

    const resetForm = () => {
        setNewUpiId('');
        setDiscountAmount(0);
        setIsActive(true);
        setEditMode(false);
        setCurrentEditId(null);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>UPI Payment Settings</CardTitle>
                <CardDescription>Manage UPI IDs for receiving payments and generating QR codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Form for adding new UPI ID */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="text-lg font-medium mb-4">
                        {editMode ? 'Edit UPI ID' : 'Add New UPI ID'}
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="upi-id">UPI ID</Label>
                            <Input
                                id="upi-id"
                                placeholder="e.g., business@okicici"
                                value={newUpiId}
                                onChange={(e) => setNewUpiId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a valid UPI ID that will be used for payment collection
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount Amount (₹)</Label>
                            <Input
                                id="discount"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={discountAmount || 0}
                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Discount amount that will be applied for payments using this UPI
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is-active" className="flex-1">Active</Label>
                                <Switch
                                    id="is-active"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Only one UPI ID can be active at a time
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button
                            onClick={handleCreateUpiSetting}
                            disabled={isSubmitting || !newUpiId}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Saving...' : editMode ? 'Update UPI ID' : 'Add UPI ID'}
                        </Button>

                        {editMode && (
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                {/* List of UPI settings */}
                <div>
                    <h3 className="text-lg font-medium mb-4">All UPI IDs</h3>

                    {error && (
                        <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-8 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-muted-foreground">Loading UPI settings...</p>
                        </div>
                    ) : upiSettings.length === 0 ? (
                        <div className="py-8 text-center bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground">No UPI settings found. Add a new UPI ID to get started.</p>
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>UPI ID</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {upiSettings.map((setting) => (
                                        <TableRow key={setting.id}>
                                            <TableCell className="font-medium">{setting.upivpa}</TableCell>
                                            <TableCell>₹{setting.discountamount}</TableCell>
                                            <TableCell>
                                                {setting.isactive ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600 flex w-fit items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="flex w-fit items-center gap-1">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{formatDate(setting.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditUpiSetting(setting)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={setting.isactive}
                                                        onClick={() => handleDeleteUpiSetting(setting.id)}
                                                        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default UpiSettingsManager; 