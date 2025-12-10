import { Spinner } from '@/components/ui/spinner';
import { PaymentStatus } from '@/hooks/use-payment-status';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import React from 'react';

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
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="relative">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-1 -right-1"
                >
                  <ShieldCheck className="h-3 w-3 text-blue-600 bg-white rounded-full" />
                </motion.div>
              </div>
            </motion.div>
          ),
          text: status === 'COMPLETED' ? 'Payment Completed' : 'Payment Verified'
        };
      case 'FAILED':
      case 'REJECTED':
        return {
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: (
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
            >
              <XCircle className="h-6 w-6 text-red-600" />
            </motion.div>
          ),
          text: status === 'FAILED' ? 'Payment Failed' : 'Payment Rejected'
        };
      case 'INITIATED':
        return {
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <Clock className="h-6 w-6 text-blue-600 animate-pulse" />,
          text: 'Payment Initiated'
        };
      case 'PENDING':
      default:
        return {
          color: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: <Clock className="h-6 w-6 text-amber-600" />,
          text: 'Payment Pending'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 flex items-center justify-between shadow-sm`}
    >
      <div className="flex items-center space-x-3">
        {isLoading ? (
          <Spinner className="h-5 w-5 text-current" />
        ) : (
          config.icon
        )}
        <div className="flex flex-col">
          <span className={`font-semibold ${config.color}`}>{config.text}</span>
          {isLoading && <span className="text-xs text-gray-500">Verifying status...</span>}
        </div>
      </div>

      {(showRetry && ['PENDING', 'INITIATED'].includes(status) && !isLoading && onRetry) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-4 h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Check Status
        </Button>
      )}
    </motion.div>
  );
};
