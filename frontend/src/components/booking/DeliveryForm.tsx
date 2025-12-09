import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryDetails {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  specialInstructions: string;
  sendUpdates: boolean;
}

interface DeliveryFormProps {
  onSubmit: (deliveryDetails: DeliveryDetails) => void;
  onCancel: () => void;
  initialValues?: Partial<DeliveryDetails>;
}

const DeliveryForm: React.FC<DeliveryFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialValues = {} 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    customerName: initialValues.customerName || '',
    email: initialValues.email || '',
    phone: initialValues.phone || '',
    address: initialValues.address || '',
    city: initialValues.city || '',
    pincode: initialValues.pincode || '',
    specialInstructions: initialValues.specialInstructions || '',
    sendUpdates: initialValues.sendUpdates !== undefined ? initialValues.sendUpdates : true,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setDeliveryDetails((prev) => ({
      ...prev,
      [id]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!deliveryDetails.customerName || !deliveryDetails.email || !deliveryDetails.phone || 
        !deliveryDetails.address || !deliveryDetails.city || !deliveryDetails.pincode) {
      toast({
        title: t('common.error'),
        description: t('checkout.completeAllFields'),
        variant: "destructive"
      });
      return;
    }
    
    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(deliveryDetails.email)) {
      toast({
        title: t('common.error'),
        description: t('checkout.invalidEmail'),
        variant: "destructive"
      });
      return;
    }
    
    // Phone validation
    if (!/^\d{10}$/.test(deliveryDetails.phone)) {
      toast({
        title: t('common.error'),
        description: t('checkout.invalidPhone'),
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(deliveryDetails);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checkout.deliveryDetails')}</CardTitle>
        <CardDescription>
          {t('checkout.enterDeliveryInfo')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="delivery-form">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">{t('common.fullName')} *</Label>
              <Input 
                id="customerName" 
                value={deliveryDetails.customerName} 
                onChange={handleChange} 
                placeholder={t('checkout.enterFullName')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')} *</Label>
              <Input 
                id="email" 
                type="email" 
                value={deliveryDetails.email} 
                onChange={handleChange} 
                placeholder={t('checkout.enterEmail')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">{t('common.phone')} *</Label>
              <Input 
                id="phone" 
                value={deliveryDetails.phone} 
                onChange={handleChange} 
                placeholder={t('checkout.enterPhone')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">{t('common.address')} *</Label>
              <Input 
                id="address" 
                value={deliveryDetails.address} 
                onChange={handleChange} 
                placeholder={t('checkout.enterAddress')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">{t('common.city')} *</Label>
              <Input 
                id="city" 
                value={deliveryDetails.city} 
                onChange={handleChange} 
                placeholder={t('checkout.enterCity')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pincode">{t('common.pincode')} *</Label>
              <Input 
                id="pincode" 
                value={deliveryDetails.pincode} 
                onChange={handleChange} 
                placeholder={t('checkout.enterPincode')}
                required
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="specialInstructions">{t('checkout.specialInstructions')}</Label>
            <Textarea 
              id="specialInstructions" 
              value={deliveryDetails.specialInstructions} 
              onChange={handleChange} 
              placeholder={t('checkout.enterSpecialInstructions')}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="sendUpdates"
              checked={deliveryDetails.sendUpdates}
              onCheckedChange={(checked) => 
                setDeliveryDetails(prev => ({ ...prev, sendUpdates: checked }))
              }
            />
            <Label htmlFor="sendUpdates" className="text-sm">
              {t('checkout.sendUpdates')}
            </Label>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          type="submit"
          form="delivery-form"
          className="gap-1"
        >
          {t('common.continue')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeliveryForm; 