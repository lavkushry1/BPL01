import React, { useState, useEffect } from 'react';

interface SimpleQrCodeProps {
    value: string;
    size?: number;
    className?: string;
    onError?: () => void;
    fallbackUpi?: string;
    paymentDetails?: {
        upiId: string;
        amount: number;
        description?: string;
    };
}

/**
 * An ultra-simple QR code component that uses external QR code service APIs
 * Doesn't require any QR code library dependencies
 */
const SimpleQrCode: React.FC<SimpleQrCodeProps> = ({
    value,
    size = 200,
    className,
    onError,
    fallbackUpi = "eventia@okicici",
    paymentDetails
}) => {
    const [hasError, setHasError] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState("");

    // Generate a valid UPI URL no matter what
    const getValidUpiUrl = () => {
        // If we have a valid value, use it
        if (value && typeof value === 'string' && value.startsWith('upi://')) {
            return value;
        }

        const amount = paymentDetails?.amount || 0;
        const description = paymentDetails?.description || 'Payment';

        // Otherwise generate our own reliable fallback
        return `upi://pay?pa=${fallbackUpi}&pn=EventiaTickets&am=${amount}&cu=INR&tn=${description}`;
    };

    const actualValue = getValidUpiUrl();

    useEffect(() => {
        try {
            const encodedValue = encodeURIComponent(actualValue);
            // Use Google Charts API to generate QR code
            const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodedValue}&choe=UTF-8`;
            setQrImageUrl(qrUrl);
        } catch (error) {
            console.error('Error creating QR code URL:', error);
            setHasError(true);
            if (onError) onError();
        }
    }, [actualValue, size, onError]);

    // Fallback method in case image loading fails
    const handleImageError = () => {
        try {
            const encodedValue = encodeURIComponent(actualValue);
            // Try a different QR code service as fallback
            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`;
            setQrImageUrl(fallbackUrl);
        } catch (error) {
            console.error('QR fallback error:', error);
            setHasError(true);
            if (onError) onError();
        }
    };

    return (
        <div className={`flex flex-col items-center ${className || ''}`}>
            <div className="p-4 bg-white rounded-lg">
                {!hasError && qrImageUrl ? (
                    <img
                        src={qrImageUrl}
                        alt="QR Code"
                        width={size}
                        height={size}
                        style={{ maxWidth: '100%', height: 'auto' }}
                        onError={handleImageError}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                        <div className="text-red-500 text-sm text-center">
                            Unable to generate QR code.
                            <br />
                            Please use the UPI ID below.
                        </div>
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

export default SimpleQrCode; 