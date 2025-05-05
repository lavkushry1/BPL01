import React, { useEffect, useRef, useState } from 'react';

interface CanvasQrCodeProps {
    value: string;
    size?: number;
    className?: string;
    upiId?: string;
    amount?: number;
    description?: string;
}

/**
 * Ultra-simple QR code display that uses an image-based QR code from a public API
 * This is used as a last resort fallback when all other QR code generation methods fail
 */
const CanvasQrCode: React.FC<CanvasQrCodeProps> = ({
    value,
    size = 200,
    className,
    upiId = 'eventia@okicici',
    amount = 0,
    description
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Generate a valid UPI URL no matter what
    const getValidUpiUrl = () => {
        // If we have a valid value, use it
        if (value && typeof value === 'string' && value.startsWith('upi://')) {
            return value;
        }

        // Otherwise generate our own reliable fallback
        return `upi://pay?pa=${upiId}&pn=EventiaTickets&am=${amount}&cu=INR&tn=${description || 'TicketPayment'}`;
    };

    const actualValue = getValidUpiUrl();

    // Use multiple public QR code services as fallbacks
    const getQrServiceUrl = (attempt = 0) => {
        const encodedValue = encodeURIComponent(actualValue);

        // Rotate between multiple services to increase reliability
        const services = [
            `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`,
            `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodedValue}&choe=UTF-8`,
            `https://quickchart.io/qr?text=${encodedValue}&size=${size}&margin=1`,
            `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=10&format=svg`
        ];

        return services[attempt % services.length];
    };

    const handleError = () => {
        setHasError(true);
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);

        // Try the next service
        if (imgRef.current && nextRetry < 4) {
            imgRef.current.src = getQrServiceUrl(nextRetry);
        }
    };

    useEffect(() => {
        if (imgRef.current) {
            imgRef.current.src = getQrServiceUrl(retryCount);
            imgRef.current.onerror = handleError;
        }
    }, [actualValue, size, retryCount]);

    return (
        <div className={`flex flex-col items-center ${className || ''}`}>
            <div className="rounded-lg overflow-hidden bg-white p-3 shadow-sm">
                <img
                    ref={imgRef}
                    alt="UPI QR Code"
                    className="mx-auto"
                    width={size}
                    height={size}
                    style={{ display: 'block' }}
                />
            </div>

            {/* Display UPI ID and payment details */}
            <div className="w-full mt-4 text-center">
                <p className="font-medium">UPI ID</p>
                <div className="flex items-center justify-center">
                    <p className="text-primary text-lg font-semibold">{upiId}</p>
                </div>

                {amount > 0 && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        Amount: ₹{amount.toLocaleString('en-IN')}
                    </p>
                )}

                {description && (
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                        {description}
                    </p>
                )}
            </div>

            {/* Show manual instructions if all QR attempts fail */}
            {hasError && retryCount >= 4 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Unable to generate QR code</p>
                    <p className="mt-1 text-amber-700 dark:text-amber-400">
                        Please use the UPI ID shown above to make your payment manually.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CanvasQrCode; 