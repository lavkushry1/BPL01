import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Handle error when QR code fails to render
  const handleQrError = () => {
    setQrError(true);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className || ''}`} style={{ height: size, width: size }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-500 mt-4">Generating QR code...</p>
      </div>
    );
  }

  if (qrError || errorMessage) {
    return (
      <div className={`flex flex-col items-center justify-center ${className || ''}`} style={{ minHeight: size }}>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            {errorMessage || "Failed to generate QR code"}
          </p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                setQrError(false);
                onRetry();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <QRCodeSVG 
        value={value} 
        size={size} 
        onError={handleQrError}
        level="H" // High error correction level
        includeMargin={true}
      />
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
