import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, TagIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscountFormProps {
  eventId?: string;
  onApplyDiscount: (amount: number, code: string) => void;
  disabled?: boolean;
}

/**
 * DiscountForm component
 * Allows users to enter and apply discount codes during checkout
 */
const DiscountForm: React.FC<DiscountFormProps> = ({ 
  eventId, 
  onApplyDiscount, 
  disabled = false
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [appliedCode, setAppliedCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Mock validation - in a real app this would call an API
  const validateDiscountCode = async (code: string): Promise<{
    valid: boolean;
    discount: { value: number; code: string } | null;
    message?: string;
  }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock valid codes
    const validCodes: Record<string, number> = {
      'WELCOME10': 500,
      'EVENTIA2025': 1000,
      'NEWYEAR': 750
    };
    
    if (code in validCodes) {
      return {
        valid: true,
        discount: {
          code,
          value: validCodes[code]
        }
      };
    }
    
    return {
      valid: false,
      discount: null,
      message: t('payment.invalidCode')
    };
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!discountCode.trim()) {
      toast({
        title: t('payment.error'),
        description: t('payment.enterValidCode'),
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateDiscountCode(discountCode);
      
      if (!result.valid) {
        toast({
          title: t('payment.invalidDiscountCode'),
          description: result.message || t('payment.discountNotValid'),
          variant: "destructive",
        });
        return;
      }
      
      if (result.discount) {
        onApplyDiscount(result.discount.value, result.discount.code);
        setAppliedCode(result.discount.code);
        setDiscountAmount(result.discount.value);
        setIsApplied(true);
        
        toast({
          title: t('payment.discountApplied'),
          description: t('payment.savedAmount', { amount: result.discount.value }),
        });
      }
    } catch (error) {
      console.error('Error validating discount code:', error);
      toast({
        title: t('common.error'),
        description: t('payment.errorValidatingDiscount'),
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetDiscount = () => {
    setDiscountCode('');
    setIsApplied(false);
    setAppliedCode('');
    setDiscountAmount(0);
    onApplyDiscount(0, '');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="mt-4 mb-2">
      <h3 className="text-sm font-medium mb-2">{t('payment.haveDiscount')}</h3>
      
      {!isApplied ? (
        <form onSubmit={handleApplyDiscount} className="flex space-x-2">
          <Input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder={t('payment.enterDiscountCode')}
            className="flex-grow"
            disabled={disabled || isValidating}
          />
          <Button 
            type="submit" 
            variant="outline" 
            disabled={disabled || isValidating || !discountCode.trim()}
          >
            {isValidating ? (
              <span className="flex items-center">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                {t('common.processing')}
              </span>
            ) : (
              t('payment.apply')
            )}
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex items-center">
            <TagIcon className="h-5 w-5 mr-2 text-green-600" />
            <div>
              <span className="text-green-700 font-medium">{appliedCode}</span>
              <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800 border-green-200">
                {t('payment.applied')}
              </Badge>
              <p className="text-xs text-green-600">
                {t('payment.discountApplied')}: {formatCurrency(discountAmount)}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetDiscount} 
            className="text-red-600 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiscountForm;
