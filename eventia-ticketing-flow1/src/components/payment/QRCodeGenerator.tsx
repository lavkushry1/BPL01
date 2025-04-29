import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ value, size, paymentDetails, className }) => {
  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <QRCodeSVG value={value} size={size} />
      {paymentDetails && (
        <div className="mt-4 text-center">
          <p className="font-medium">UPI ID</p>
          <p className="text-primary text-lg font-semibold">
            {paymentDetails.upiId}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Amount: ₹{paymentDetails.amount.toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
