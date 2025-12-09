/**
 * @component PaymentMethodSelector
 * @description Allows users to select between different payment methods (UPI or Stripe)
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import UpiPayment from './UpiPayment';
import StripePayment from './StripePayment';

interface PaymentMethodSelectorProps {
  bookingId: string;
  amount: number;
  onPaymentSuccess?: () => void;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

type PaymentMethod = 'upi' | 'stripe';

const PaymentMethodSelector = ({ bookingId, amount, onPaymentSuccess, customerInfo }: PaymentMethodSelectorProps) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('Select Payment Method')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="upi" id="upi" />
              <Label htmlFor="upi" className="flex items-center cursor-pointer">
                <Smartphone className="h-5 w-5 mr-2" />
                <div>
                  <div className="font-medium">{t('UPI Payment')}</div>
                  <div className="text-sm text-muted-foreground">{t('Pay using Google Pay, PhonePe, Paytm, etc.')}</div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="stripe" id="stripe" />
              <Label htmlFor="stripe" className="flex items-center cursor-pointer">
                <CreditCard className="h-5 w-5 mr-2" />
                <div>
                  <div className="font-medium">{t('Card Payment')}</div>
                  <div className="text-sm text-muted-foreground">{t('Pay using Credit/Debit Card')}</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedMethod === 'upi' ? (
        <UpiPayment
          bookingId={bookingId}
          amount={amount}
          onPaymentSuccess={onPaymentSuccess}
          customerInfo={customerInfo}
        />
      ) : (
        <StripePayment
          bookingId={bookingId}
          amount={amount}
          onPaymentSuccess={onPaymentSuccess}
          customerInfo={customerInfo}
        />
      )}
    </div>
  );
};

export default PaymentMethodSelector;