import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { usePaymentService } from '../../hooks/usePaymentService';
import { useBooking } from '../../hooks/useBooking';

interface UtrSubmissionProps {
  bookingId: string;
  amount: number;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

const UtrSubmission: React.FC<UtrSubmissionProps> = ({
  bookingId,
  amount,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation('payment');
  const [utrNumber, setUtrNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { submitUtrNumber } = usePaymentService();
  const { getBookingDetails } = useBooking();

  // UTR validation pattern: 12-16 alphanumeric characters
  const UTR_PATTERN = /^[A-Z0-9]{12,16}$/;

  // Validate UTR on change
  useEffect(() => {
    if (utrNumber.trim() && !UTR_PATTERN.test(utrNumber)) {
      setValidationError(t('utr.validationError'));
    } else {
      setValidationError(null);
    }
  }, [utrNumber, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setUtrNumber(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!utrNumber.trim()) {
      setValidationError(t('utr.required'));
      return;
    }

    if (!UTR_PATTERN.test(utrNumber)) {
      setValidationError(t('utr.validationError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitUtrNumber(bookingId, utrNumber);
      
      if (response.success) {
        onSuccess(response.transactionId);
      } else {
        setError(response.message || t('utr.submissionError'));
        onError(response.message || t('utr.submissionError'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check clipboard for UTR pattern if supported
  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard) {
      setError(t('utr.clipboardNotSupported'));
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split(/[\n\r]/);
      
      // Look for UTR-like pattern in clipboard content
      for (const line of lines) {
        const words = line.split(/\s+/);
        for (const word of words) {
          if (UTR_PATTERN.test(word)) {
            setUtrNumber(word);
            return;
          }
        }
      }
      
      // If no pattern found, just paste the first line
      if (lines[0]) {
        setUtrNumber(lines[0].trim().toUpperCase().replace(/\s/g, ''));
      }
    } catch (err) {
      setError(t('utr.clipboardError'));
    }
  };

  return (
    <div className="utr-submission-container bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">{t('utr.title')}</h2>
      
      <div className="bg-blue-50 p-3 rounded-md mb-4">
        <p className="text-sm text-blue-800">
          {t('utr.instruction')}
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="utr-number" className="block text-sm font-medium mb-1">
            {t('utr.label')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input
              id="utr-number"
              type="text"
              value={utrNumber}
              onChange={handleInputChange}
              placeholder={t('utr.placeholder')}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "utr-error" : undefined}
              className={`w-full pr-24 ${validationError ? 'border-red-500' : ''}`}
              maxLength={16}
              autoComplete="off"
              disabled={isSubmitting}
            />
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={handlePasteFromClipboard}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
              disabled={isSubmitting}
            >
              {t('utr.paste')}
            </Button>
          </div>
          {validationError && (
            <p id="utr-error" className="mt-1 text-sm text-red-600">
              {validationError}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('utr.help')}
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('amount')}:</span>
            <span className="font-medium">₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">{t('bookingId')}:</span>
            <span className="font-medium">{bookingId}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting || !!validationError}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {t('utr.submitting')}
              </>
            ) : (
              t('utr.submit')
            )}
          </Button>
          
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              {t('utr.verificationNote')}
            </p>
          </div>
        </div>
      </form>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-medium mb-2">{t('utr.findUtr')}</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <p>
            <span className="font-medium">BHIM/UPI: </span>
            {t('utr.findUtrUpi')}
          </p>
          <p>
            <span className="font-medium">Google Pay: </span>
            {t('utr.findUtrGpay')}
          </p>
          <p>
            <span className="font-medium">PhonePe: </span>
            {t('utr.findUtrPhonepe')}
          </p>
          <p>
            <span className="font-medium">Paytm: </span>
            {t('utr.findUtrPaytm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UtrSubmission; 