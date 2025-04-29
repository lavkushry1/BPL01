import { useState, useEffect, useCallback } from 'react';
import { validateDiscountCode } from '@/services/api/discountApi';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Define proper types for the discount validation response
interface Discount {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
  min_amount?: number;
  max_uses?: number;
  used_count?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface DiscountValidationResponse {
  valid: boolean;
  discount?: Discount;
  finalAmount?: number;
  message?: string;
}

interface DiscountHookResult {
  discountCode: string;
  setDiscountCode: (code: string) => void;
  discountAmount: number;
  discountPercentage: number;
  isValidating: boolean;
  isApplied: boolean;
  isAutoApplied: boolean;
  applyDiscount: (code: string) => Promise<boolean>;
  resetDiscount: () => void;
  error: string | null;
}

interface DiscountCacheItem {
  code: string;
  value: number;
  type: 'FIXED' | 'PERCENTAGE';
  percentage: number;
  validUntil: number; // Unix timestamp (ms)
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = 'eventia_discount_cache';

/**
 * Custom hook for handling discount codes with caching and auto-apply functionality
 */
export function useDiscount(
  eventId?: string,
  orderAmount: number = 0,
  initialDiscount?: { code: string; amount: number; isAutoApplied?: boolean }
): DiscountHookResult {
  const { t } = useTranslation();
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isAutoApplied, setIsAutoApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load cached discounts
  const getCachedDiscounts = useCallback((): Record<string, DiscountCacheItem> => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        
        // Clean up expired items
        const now = Date.now();
        const cleanedCache: Record<string, DiscountCacheItem> = {};
        
        Object.entries(parsedCache).forEach(([key, value]: [string, any]) => {
          if (value.validUntil > now) {
            cleanedCache[key] = value;
          }
        });
        
        // Update cache with cleaned version
        if (Object.keys(cleanedCache).length !== Object.keys(parsedCache).length) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
        }
        
        return cleanedCache;
      }
    } catch (e) {
      console.error('Error loading discount cache:', e);
    }
    
    return {};
  }, []);
  
  // Cache a discount
  const cacheDiscount = useCallback((discount: DiscountCacheItem) => {
    try {
      const existingCache = getCachedDiscounts();
      existingCache[discount.code] = discount;
      localStorage.setItem(CACHE_KEY, JSON.stringify(existingCache));
    } catch (e) {
      console.error('Error caching discount:', e);
    }
  }, [getCachedDiscounts]);
  
  // Initialize with any provided discount
  useEffect(() => {
    if (initialDiscount) {
      setDiscountCode(initialDiscount.code);
      setDiscountAmount(initialDiscount.amount);
      setIsApplied(true);
      setIsAutoApplied(!!initialDiscount.isAutoApplied);
      
      // Cache this discount
      cacheDiscount({
        code: initialDiscount.code,
        value: initialDiscount.amount,
        type: 'FIXED', // Assume fixed without more info
        percentage: 0,
        validUntil: Date.now() + CACHE_EXPIRY
      });
    }
  }, [initialDiscount, cacheDiscount]);
  
  // Try to fetch auto-apply discount when component mounts
  useEffect(() => {
    const fetchAutoApplyDiscount = async () => {
      // Skip if we already have a discount applied or no eventId
      if (isApplied || !eventId) return;
      
      // 1. Check query param
      const params = new URLSearchParams(window.location.search);
      const queryCode = params.get('discount') || params.get('code');
      
      // 2. Check localStorage
      const localCode = localStorage.getItem('discountCode');
      const foundCode = queryCode || localCode;
      
      if (foundCode) {
        setDiscountCode(foundCode);
        setIsValidating(true);
        setError(null);
        
        try {
          // Check cache first
          const cachedDiscounts = getCachedDiscounts();
          if (cachedDiscounts[foundCode]) {
            const cached = cachedDiscounts[foundCode];
            setDiscountAmount(cached.value);
            setDiscountPercentage(cached.percentage);
            setIsApplied(true);
            setIsAutoApplied(true);
            
            toast({
              title: t('payment.discountApplied'),
              description: t('payment.savedAmount', { amount: cached.value })
            });
            return;
          }
          
          // Not in cache, validate with API
          const result = await validateDiscountCode(foundCode, orderAmount);
          
          if (result && result.valid) {
            // Calculate discount amount and percentage
            let amount = 0;
            let percentage = 0;
            
            if (result.discount?.type === 'PERCENTAGE') {
              percentage = result.discount.value;
              // Calculate discount amount based on percentage
              amount = orderAmount * (percentage / 100);
            } else if (result.discount) {
              amount = result.discount.value;
              percentage = orderAmount > 0 ? (amount / orderAmount) * 100 : 0;
            }
            
            setDiscountAmount(amount);
            setDiscountPercentage(percentage);
            setIsApplied(true);
            setIsAutoApplied(true);
            
            // Cache this discount
            cacheDiscount({
              code: foundCode,
              value: amount,
              type: result.discount.type,
              percentage,
              validUntil: Date.now() + CACHE_EXPIRY
            });
            
            toast({
              title: t('payment.discountApplied'),
              description: t('payment.savedAmount', { amount })
            });
          }
        } catch (e) {
          console.error('Error validating discount code:', e);
        } finally {
          setIsValidating(false);
        }
      }
      
      // 3. If no code found or validation failed, try backend auto-apply
      if (!isApplied && eventId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/discounts/auto-apply?eventId=${eventId}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.discount) {
              const discount = data.data.discount;
              
              // Calculate discount amount and percentage
              let amount = 0;
              let percentage = 0;
              
              if (discount.type === 'PERCENTAGE') {
                percentage = discount.value;
                amount = orderAmount * (percentage / 100);
              } else {
                amount = discount.value;
                percentage = orderAmount > 0 ? (amount / orderAmount) * 100 : 0;
              }
              
              setDiscountCode(discount.code);
              setDiscountAmount(amount);
              setDiscountPercentage(percentage);
              setIsApplied(true);
              setIsAutoApplied(true);
              
              // Cache this discount
              cacheDiscount({
                code: discount.code,
                value: amount,
                type: discount.type,
                percentage,
                validUntil: Date.now() + CACHE_EXPIRY
              });
              
              toast({
                title: t('payment.autoDiscountApplied'),
                description: t('payment.savedAmount', { amount })
              });
            }
          }
        } catch (e) {
          console.error('Error fetching auto-apply discount:', e);
        }
      }
    };
    
    fetchAutoApplyDiscount();
  }, [eventId, orderAmount, isApplied, getCachedDiscounts, cacheDiscount, t]);
  
  // Apply a discount code manually
  const applyDiscount = useCallback(
    async (code: string): Promise<boolean> => {
      if (!code.trim()) {
        setError(t('payment.enterValidCode'));
        return false;
      }
      
      setIsValidating(true);
      setError(null);
      
      try {
        // Check cache first
        const cachedDiscounts = getCachedDiscounts();
        if (cachedDiscounts[code]) {
          const cached = cachedDiscounts[code];
          setDiscountAmount(cached.value);
          setDiscountPercentage(cached.percentage);
          setIsApplied(true);
          setIsAutoApplied(false);
          
          toast({
            title: t('payment.discountApplied'),
            description: t('payment.savedAmount', { amount: cached.value })
          });
          
          return true;
        }
        
        // Not in cache, validate with API
        const result = await validateDiscountCode(code, orderAmount);
        
        if (!result || !result.valid) {
          setError(result?.message || t('payment.discountNotValid'));
          return false;
        }
        
        // Calculate discount amount and percentage
        let amount = 0;
        let percentage = 0;
        
        if (result.discount?.type === 'PERCENTAGE') {
          percentage = result.discount.value;
          // Calculate discount amount based on percentage
          amount = orderAmount * (percentage / 100);
        } else if (result.discount) {
          amount = result.discount.value;
          percentage = orderAmount > 0 ? (amount / orderAmount) * 100 : 0;
        }
        
        setDiscountAmount(amount);
        setDiscountPercentage(percentage);
        setIsApplied(true);
        setIsAutoApplied(false);
        
        // Cache this discount
        cacheDiscount({
          code,
          value: amount,
          type: result.discount.type,
          percentage,
          validUntil: Date.now() + CACHE_EXPIRY
        });
        
        toast({
          title: t('payment.discountApplied'),
          description: t('payment.savedAmount', { amount })
        });
        
        return true;
      } catch (e: any) {
        console.error('Error validating discount code:', e);
        setError(e.message || t('payment.errorValidatingDiscount'));
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [orderAmount, t, getCachedDiscounts, cacheDiscount]
  );
  
  // Reset the discount
  const resetDiscount = useCallback(() => {
    setDiscountCode('');
    setDiscountAmount(0);
    setDiscountPercentage(0);
    setIsApplied(false);
    setIsAutoApplied(false);
    setError(null);
  }, []);
  
  return {
    discountCode,
    setDiscountCode,
    discountAmount,
    discountPercentage,
    isValidating,
    isApplied,
    isAutoApplied,
    applyDiscount,
    resetDiscount,
    error
  };
} 