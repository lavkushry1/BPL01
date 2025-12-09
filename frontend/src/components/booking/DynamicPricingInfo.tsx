import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatters';
import { Info, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface PriceAdjustment {
  ruleId: string;
  ruleName: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED';
  adjustmentValue: number;
  appliedAmount: number;
}

interface PriceCalculation {
  basePrice: number;
  finalPrice: number;
  adjustments: PriceAdjustment[];
  discountPercentage?: number;
  calculationTime: Date;
}

interface DynamicPricingInfoProps {
  eventId: string;
  ticketCategoryId: string;
  quantity?: number;
  showDetails?: boolean;
}

const DynamicPricingInfo: React.FC<DynamicPricingInfoProps> = ({
  eventId,
  ticketCategoryId,
  quantity = 1,
  showDetails = false
}) => {
  const { t } = useTranslation();
  const [priceData, setPriceData] = useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showDetails);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(
          `/api/events/${eventId}/tickets/${ticketCategoryId}/price?quantity=${quantity}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch pricing data');
        }
        
        const data = await response.json();
        setPriceData({
          ...data,
          calculationTime: new Date(data.calculationTime || new Date())
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dynamic pricing data:', err);
        setError(t('dynamicPricing.errorFetching', 'Unable to load dynamic pricing information.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPriceData();
  }, [eventId, ticketCategoryId, quantity, t]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('dynamicPricing.error', 'Error')}
          </CardTitle>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!priceData) {
    return null;
  }

  const { basePrice, finalPrice, adjustments, discountPercentage } = priceData;
  const totalSavings = basePrice - finalPrice;
  const now = new Date();
  const calculationAge = Math.floor((now.getTime() - new Date(priceData.calculationTime).getTime()) / (1000 * 60));

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {discountPercentage && discountPercentage > 0 ? (
              <TrendingDown className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-amber-600" />
            )}
            {t('dynamicPricing.title', 'Dynamic Pricing')}
          </span>
          {calculationAge < 10 && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {t('dynamicPricing.updatedRecently', 'Updated recently')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t('dynamicPricing.description', 'Prices adjust based on demand, time until event, and available inventory.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {t('dynamicPricing.basePrice', 'Base Price')}
            </div>
            <div className="font-medium">{formatCurrency(basePrice, 'INR')}</div>
          </div>
          
          {expanded && adjustments && adjustments.length > 0 && (
            <div className="space-y-2 py-2 px-3 bg-muted/30 rounded-md text-sm">
              {adjustments.map((adjustment) => (
                <div key={adjustment.ruleId} className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>{adjustment.ruleName}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {adjustment.adjustmentType === 'PERCENTAGE' 
                              ? t('dynamicPricing.percentageDiscount', '{{value}}% discount', { value: adjustment.adjustmentValue })
                              : t('dynamicPricing.fixedDiscount', '{{value}} discount', { value: formatCurrency(adjustment.adjustmentValue, 'INR') })
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-green-600">-{formatCurrency(adjustment.appliedAmount, 'INR')}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center font-medium">
            <div>
              {t('dynamicPricing.finalPrice', 'Final Price')}
            </div>
            <div className="text-lg">{formatCurrency(finalPrice, 'INR')}</div>
          </div>
          
          {totalSavings > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-sm">
                <div className="text-green-600 font-medium">
                  {t('dynamicPricing.youSave', 'You save {{amount}} ({{percent}}%)', {
                    amount: formatCurrency(totalSavings, 'INR'),
                    percent: discountPercentage?.toFixed(0) || Math.round((totalSavings / basePrice) * 100)
                  })}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('dynamicPricing.savingsInfo', 'Savings compared to standard pricing')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={discountPercentage} max={30} className="h-1.5 mt-1" />
            </div>
          )}
        </div>
      </CardContent>
      {!showDetails && (
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded 
              ? t('dynamicPricing.showLess', 'Show Less')
              : t('dynamicPricing.showBreakdown', 'Show Price Breakdown')}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DynamicPricingInfo;