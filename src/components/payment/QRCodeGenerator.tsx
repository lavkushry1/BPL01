import React, { useState, useEffect } from 'react';
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
    const [safeValue, setSafeValue] = useState<string>("");

    // Update safeValue whenever value changes
    useEffect(() => {
        // Only update if we have a valid value
        if (value && typeof value === 'string' && value.trim() !== '') {
            setSafeValue(value);
            setQrError(false); // Reset error state when we get a new valid value
        } else if (!safeValue) {
            // Set a default value if we have nothing at all
            const defaultUpiString = "upi://pay?pa=eventia@okicici&pn=EventiaTickets&cu=INR";
            setSafeValue(defaultUpiString);
        }
    }, [value]);

    // Handle error when QR code fails to render
    const handleQrError = () => {
        console.error("QR code render error with value:", value);
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

    // Show error state if there's an error or if value is invalid
    if (qrError || errorMessage || (!value && !safeValue)) {
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

    // Only render QR code if we have a valid value (either original or safe)
    const displayValue = value || safeValue;

    return (
        <div className={`flex flex-col items-center ${className || ''}`}>
            {displayValue && (
                <QRCodeSVG
                    value={displayValue}
                    size={size}
                    onError={handleQrError}
                    level="H" // High error correction level
                    includeMargin={true}
                />
            )}
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