import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import paymentApi from '@/services/api/paymentApi';

interface CancelBookingButtonProps {
  bookingId: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

const CancelBookingButton = ({ bookingId, onSuccess, disabled = false }: CancelBookingButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: t('booking.reasonRequired', 'Please provide a reason'),
        description: t('booking.reasonRequiredDesc', 'A cancellation reason is required'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentApi.cancelBooking(bookingId, reason);
      toast({
        title: t('booking.cancelSuccess', 'Booking cancelled'),
        description: t('booking.cancelSuccessDesc', 'Your booking has been cancelled successfully'),
      });
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast({
        title: t('booking.cancelFailed', 'Cancellation failed'),
        description: error?.response?.data?.message || t('booking.tryAgain', 'Please try again'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        {t('booking.cancel', 'Cancel Booking')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('booking.confirmCancel', 'Confirm Cancellation')}</DialogTitle>
            <DialogDescription>
              {t('booking.cancelDesc', 'This action cannot be undone. Please provide a reason for cancellation.')}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('booking.reasonPlaceholder', 'Why are you cancelling this booking?')}
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.back', 'Back')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  {t('common.processing', 'Processing...')}
                </>
              ) : (
                t('booking.confirmCancelAction', 'Yes, Cancel Booking')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CancelBookingButton; 