/**
 * @component DeliveryDetails
 * @description Allows users to enter delivery/contact information for their booking.
 * 
 * @apiDependencies
 * - POST /api/bookings/:bookingId/delivery - Saves delivery details for a booking
 * 
 * @requiredFields
 * - name (string) - Customer's full name
 * - phone (string) - Customer's phone number
 * - address (string) - Delivery address
 * - city (string) - City
 * - pincode (string) - PIN code
 * 
 * @expectedResponse
 * - Status 200 with delivery details object
 * 
 * @navigationFlow
 * - Previous: Booking/Seat selection
 * - Next: Payment page (/payment/:bookingId)
 */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DeliveryDetailsForm from '@/components/payment/DeliveryDetailsForm';
import { toast } from '@/hooks/use-toast';
import { saveDeliveryDetails } from '@/services/api/bookingApi';

const DeliveryDetails = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (location.state?.bookingDetails) {
      setBookingDetails(location.state.bookingDetails);
      setIsLoading(false);
    } else {
      toast({
        title: "Error",
        description: "No booking details found",
        variant: "destructive"
      });
      navigate('/events');
    }
  }, [location.state, navigate]);

  const handleFormSubmit = async (formData: any) => {
    try {
      if (!bookingDetails || !bookingDetails.bookingId) {
        toast({
          title: "Error",
          description: "Booking information is missing. Please return to the event page and try again.",
          variant: "destructive"
        });
        navigate('/events');
        return;
      }
      
      // Use bookingApi service to save delivery details
      await saveDeliveryDetails(bookingDetails.bookingId, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode
      });

      // Navigate to payment page
      navigate(`/payment/${bookingDetails.bookingId}`, { 
        state: { 
          bookingDetails: {
            ...bookingDetails,
            deliveryDetails: formData
          }
        }
      });
    } catch (error) {
      console.error('Error submitting delivery details:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery details. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('checkout.deliveryDetails')}</CardTitle>
                <CardDescription>
                  {t('checkout.enterDeliveryInfo')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-white/5 border border-[var(--district-border)] rounded-md">
                  <h3 className="font-semibold mb-2">{t('checkout.orderSummary')}</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('checkout.event')}:</span>
                    <span className="font-medium">{bookingDetails.eventTitle}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('checkout.date')}:</span>
                    <span>{bookingDetails.eventDate}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('checkout.time')}:</span>
                    <span>{bookingDetails.eventTime}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('checkout.venue')}:</span>
                    <span>{bookingDetails.venue}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('checkout.tickets')}:</span>
                    <span>{bookingDetails.ticketCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t border-gray-200">
                    <span>{t('checkout.total')}:</span>
                    <span>₹{bookingDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <DeliveryDetailsForm onSubmit={handleFormSubmit} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DeliveryDetails;
