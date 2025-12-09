import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Info, ArrowRight, Clock, CheckCircle, Smartphone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UpiGuideTooltip = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Info className="h-4 w-4 mr-1" />
          <span className="text-xs">{t('payment.howItWorks', 'How UPI Payment Works')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 pb-2">
          <h4 className="font-medium text-sm">{t('payment.upiGuide', 'UPI Payment Guide')}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t('payment.upiGuideDesc', 'Simple steps to complete your payment')}
          </p>
        </div>
        <Separator />
        
        <Tabs defaultValue="english" className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">English</TabsTrigger>
              <TabsTrigger value="hinglish">Hinglish</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="english" className="p-4 pt-2 space-y-3">
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{t('payment.step1', 'Scan QR with UPI App')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('payment.step1Desc', 'Scan QR code with any UPI app (PhonePe, GPay, etc.)')}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{t('payment.step2', 'Complete Payment')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('payment.step2Desc', 'Pay the shown amount in your UPI app')}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{t('payment.step3', 'Submit UTR Number')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('payment.step3Desc', 'Find UTR/reference number in your UPI app and enter below')}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{t('payment.step4', 'Payment Verification')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('payment.step4Desc', 'Our system will verify your payment and generate tickets')}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>{t('payment.helpText', 'Need help?')}</strong> {t('payment.helpDesc', 'Find your UTR number in payment history of your UPI app')}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="hinglish" className="p-4 pt-2 space-y-3">
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">QR Scan Karo</p>
                <p className="text-xs text-muted-foreground">
                  Apne phone ke UPI app (PhonePe, GPay, etc.) se QR scan karo
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">Payment Karo</p>
                <p className="text-xs text-muted-foreground">
                  Dikhaye gaye amount ko UPI app se pay karo
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">UTR Number Bharo</p>
                <p className="text-xs text-muted-foreground">
                  UPI app ke transaction history se UTR/reference number copy karke neeche paste karo
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-1 rounded-full mr-3 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">Payment Verify Hoga</p>
                <p className="text-xs text-muted-foreground">
                  Hamara system aapka payment verify karega aur ticket generate karega
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Help chahiye?</strong> UTR number apke UPI app ke payment history mein milega
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="p-3 bg-muted/50 rounded-b-lg">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs h-7"
            onClick={() => setOpen(false)}
          >
            {t('payment.gotIt', 'Got it!')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UpiGuideTooltip; 