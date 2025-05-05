import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';

interface PaymentDetails {
  upiId: string;
  amount: number;
  description: string;
}

interface QRCodeGeneratorProps {
  value: string;
  size: number;
  paymentDetails?: PaymentDetails;
  className?: string;
  isLoading?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size,
  paymentDetails,
  className,
  isLoading = false,
  onRetry,
  errorMessage
}) => {
  const [qrError, setQrError] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const [safeValue, setSafeValue] = useState<string>('');

  // Generate QR code with multiple fallback options
  const generateQR = useCallback(async (valueToEncode: string) => {
    if (!valueToEncode) {
      setQrError(true);
      return;
    }

    try {
      setQrError(false);

      // First attempt: Use QRCode library
      try {
        const dataUrl = await QRCode.toDataURL(valueToEncode, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'H'
        });

        setQrDataUrl(dataUrl);
        return;
      } catch (primaryError) {
        console.error('Primary QR generation failed:', primaryError);
        // Continue to fallbacks
      }

      // Second attempt: Try alternative QRCode method
      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, valueToEncode, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'H'
        });

        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
        return;
      } catch (secondaryError) {
        console.error('Secondary QR generation failed:', secondaryError);
        // Continue to fallbacks
      }

      // Third attempt: Use external QR code service
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(valueToEncode)}`);

    } catch (err) {
      console.error('All QR code generation methods failed:', err);
      setQrError(true);

      // Final fallback - use external service
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(valueToEncode || 'error')}`);
    }
  }, [size]);

  // Update safeValue whenever value changes
  useEffect(() => {
    // Only update if we have a valid value
    if (value && typeof value === 'string' && value.trim() !== '') {
      setSafeValue(value);
      setQrError(false); // Reset error state when we get a new valid value
    } else if (!safeValue) {
      // Set a default value if we have nothing at all
      const defaultUpiString = "upi://pay?pa=9122036484@hdfc&pn=EventiaTickets&cu=INR";
      setSafeValue(defaultUpiString);
    }
  }, [value]);

  // Generate QR code when value changes or on retry
  useEffect(() => {
    generateQR(safeValue);
  }, [safeValue, generateQR, retryCount]);

  // Retry mechanism
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // If no external retry handler, regenerate QR code
      setQrError(false);
      setQrDataUrl('');
      setRetryCount(prev => prev + 1);

      // Generate fallback QR if needed
      if (!safeValue) {
        const fallbackValue = paymentDetails ?
          `upi://pay?pa=${paymentDetails.upiId}&am=${paymentDetails.amount}&cu=INR` :
          'https://eventia.app/payment';

        generateQR(fallbackValue);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className || ''}`} style={{ height: size, width: size }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500 mt-4">Generating QR code...</p>
      </div>
    );
  }

  if (qrError || errorMessage || !safeValue) {
    return (
      <div className={`flex flex-col items-center justify-center ${className || ''}`} style={{ minHeight: size }}>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {errorMessage || "Failed to generate QR code"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Handle image load errors
  const handleImageError = () => {
    console.error('QR code image failed to load');
    setQrError(true);
    // Try to regenerate immediately with a different method
    handleRetry();
  };

  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <div className="bg-white p-2 rounded-lg">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            width={size}
            height={size}
            className="rounded"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {paymentDetails && (
        <div className="mt-4 text-center">
          <p className="font-medium">UPI ID</p>
          <p className="text-primary text-lg font-semibold">
            {paymentDetails.upiId}
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Amount: ₹{paymentDetails.amount.toLocaleString('en-IN')}
          </p>
          {paymentDetails.description && (
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
              {paymentDetails.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
