import { useState, useEffect } from 'react';
import { getActiveUpiSettings, getPaymentSettings } from '@/services/api/paymentApi';
import { isAuthenticated } from '@/services/api/apiUtils';

interface PaymentSettings {
  upiId: string;
  discount: number;
}

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    upiId: '',
    discount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);

      // First try the new public endpoint approach
      try {
        console.log('Fetching UPI settings from public endpoint');
        const response = await getPaymentSettings();
        if (response && response.data) {
          setSettings({
            upiId: response.data.upivpa || '9122036484@hdfc',
            discount: response.data.discountamount || 0
          });
          console.log('Successfully loaded UPI settings:', response.data);
          setError(null);
          setIsLoading(false);
          return;
        }
      } catch (publicError) {
        console.error('Error fetching from public endpoint:', publicError);
      }

      // If public endpoint fails, try the authenticated endpoint
      try {
        console.log('Fetching UPI settings from authenticated endpoint');
        const upiSettings = await getActiveUpiSettings();

        if (upiSettings) {
          setSettings({
            upiId: upiSettings.upivpa,
            discount: upiSettings.discountamount
          });
          console.log('Successfully loaded UPI settings from auth endpoint');
          setError(null);
          setIsLoading(false);
          return;
        }
      } catch (authError) {
        console.error('Error fetching from authenticated endpoint:', authError);
      }

      // If all attempts fail, use default values
      console.log('Using default UPI settings');
      setSettings({
        upiId: '9122036484@hdfc',
        discount: 0
      });
      setError(new Error('Failed to fetch payment settings from all endpoints'));
    } catch (err) {
      console.error('Error in fetch settings flow:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch payment settings'));

      // Still set default values on error
      setSettings({
        upiId: '9122036484@hdfc',
        discount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    activeUpiId: settings.upiId,
    discountAmount: settings.discount,
    isLoading,
    error,
    refreshSettings: fetchSettings
  };
}

export default usePaymentSettings;
