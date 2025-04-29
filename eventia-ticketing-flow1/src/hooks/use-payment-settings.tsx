import { useState, useEffect } from 'react';
import { getActiveUpiSettings } from '@/services/api/paymentApi';

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
      const upiSettings = await getActiveUpiSettings();
      
      if (upiSettings) {
        setSettings({
          upiId: upiSettings.upivpa,
          discount: upiSettings.discountamount
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch payment settings'));
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
