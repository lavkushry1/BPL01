import React from 'react';
import { formatCurrency } from '@/utils/formatters';

/**
 * Summary Footer Component
 * Displays summary information about selected seats and total price
 */
interface SummaryFooterProps {
  totalPrice: number;
  selectedCount: number;
}

const SummaryFooter: React.FC<SummaryFooterProps> = ({ 
  totalPrice, 
  selectedCount 
}) => {
  return (
    <div className="p-4 bg-muted rounded-md mt-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium">Selected Seats</p>
          <p className="text-2xl font-bold">{selectedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Total Price</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice, 'INR')}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryFooter; 