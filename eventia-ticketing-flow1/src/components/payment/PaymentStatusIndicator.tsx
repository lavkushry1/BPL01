import React from 'react';
import { PaymentStatus } from '@/hooks/use-payment-status';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface PaymentStatusIndicatorProps {
  status: PaymentStatus;
  isLoading: boolean;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Component to display payment status with appropriate visual indicators
 */
export const PaymentStatusIndicator: React.FC<PaymentStatusIndicatorProps> = ({
  status,
  isLoading,
  onRetry,
  showRetry = true
}) => {
  // Visual configurations based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
      case 'VERIFIED':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: status === 'COMPLETED' ? 'Payment completed' : 'Payment verified'
        };
      case 'FAILED':
      case 'REJECTED':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          text: status === 'FAILED' ? 'Payment failed' : 'Payment rejected'
        };
      case 'INITIATED':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          text: 'Payment initiated'
        };
      case 'PENDING':
      default:
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          text: 'Payment pending'
        };
    }
  };

  const config = getStatusConfig();
  
  return (
    <div className={`rounded-md border ${config.borderColor} ${config.bgColor} p-3 flex items-center justify-between`}>
      <div className="flex items-center space-x-3">
        {isLoading ? (
          <Spinner className="h-5 w-5" />
        ) : (
          config.icon
        )}
        <span className={`font-medium ${config.color}`}>{config.text}</span>
        {isLoading && <span className="text-sm text-gray-500">Checking status...</span>}
      </div>
      
      {(showRetry && ['PENDING', 'INITIATED'].includes(status) && !isLoading && onRetry) && (
        <button 
          onClick={onRetry}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      )}
    </div>
  );
}; 