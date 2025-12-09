import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User, Phone, MapPin, Mail, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

// Define form schema with validation
const deliveryFormSchema = z.object({
  name: z.string().min(3, "common.errorNameLength"),
  email: z.string().email("common.errorInvalidEmail"),
  phone: z.string().min(10, "common.errorPhoneLength").max(15, "common.errorPhoneLength"),
  address: z.string().min(5, "common.errorAddressLength"),
  city: z.string().min(2, "common.errorCityLength"),
  pincode: z.string().min(6, "common.errorPincodeLength"),
  specialInstructions: z.string().optional(),
  receiveUpdates: z.boolean().optional().default(true),
});

export type DeliveryFormValues = z.infer<typeof deliveryFormSchema>;

export interface DeliveryDetailsFormProps {
  onSubmit: (data: DeliveryFormValues) => Promise<void>;
  defaultValues?: Partial<DeliveryFormValues>;
  onCancel?: () => void;
}

const DeliveryDetailsForm: React.FC<DeliveryDetailsFormProps> = ({ 
  onSubmit, 
  defaultValues,
  onCancel 
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      address: defaultValues?.address || '',
      city: defaultValues?.city || '',
      pincode: defaultValues?.pincode || '',
      specialInstructions: defaultValues?.specialInstructions || '',
      receiveUpdates: defaultValues?.receiveUpdates !== undefined ? defaultValues.receiveUpdates : true,
    },
  });

  // Handle form submission
  const handleSubmit = async (data: DeliveryFormValues) => {
    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error('Error submitting delivery details:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('checkout.errorSavingDetails'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.deliveryDetails')}</CardTitle>
          <CardDescription>
            {t('checkout.enterDeliveryInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.fullName')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder={t('checkout.enterFullName')} 
                            className="pl-10" 
                            {...field} 
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.name?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.email')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email"
                            placeholder={t('checkout.enterEmail')} 
                            className="pl-10" 
                            {...field}
                            dir="ltr" // Email addresses are always LTR
                          />
                        </div>
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.email?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.phone')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder={t('checkout.enterPhone')} 
                            className="pl-10" 
                            {...field}
                            dir="ltr" // Phone numbers are always LTR
                          />
                        </div>
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.phone?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('common.address')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder={t('checkout.enterAddress')} 
                            className="pl-10" 
                            {...field}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.address?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.city')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('checkout.enterCity')} 
                          {...field}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.city?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.pincode')}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('checkout.enterPincode')} 
                          {...field}
                          dir="ltr" // Pincodes are always LTR
                        />
                      </FormControl>
                      <FormMessage>{t(form.formState.errors.pincode?.message || '')}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t('checkout.specialInstructions')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('checkout.enterSpecialInstructions')} 
                          className="resize-none" 
                          rows={3}
                          {...field}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </FormControl>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiveUpdates"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0 sm:col-span-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex items-center">
                        <BellRing className="mr-2 h-4 w-4 text-gray-400" />
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {t('checkout.sendUpdates')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    {t('common.cancel')}
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="ml-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      {t('common.processing')}
                    </>
                  ) : (
                    t('common.continue')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeliveryDetailsForm; 