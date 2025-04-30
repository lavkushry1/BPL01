/**
 * @component Confirmation
 * @description Displays booking confirmation details and provides access to the e-ticket.
 * Shows summary of the booking with options to download or share e-tickets.
 * 
 * @apiDependencies
 * - GET /api/bookings/:bookingId - Fetches booking details
 * - GET /api/bookings/:bookingId/ticket - Fetches the ticket PDF
 * 
 * @params
 * - bookingId: string - ID of the booking
 * 
 * @navigationFlow
 * - Previous: Payment page (/payment/:bookingId)
 * - Final destination in the booking flow
 */
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ConfirmationPage from '@/components/booking/ConfirmationPage';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { ArrowLeft, Check, Ticket, ShoppingBag, Calendar, Clock, MapPin, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { format as formatDate, parseISO } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';

const Confirmation = () => {
  const { t } = useTranslation();
  const { isRTL, currentLanguage } = useLanguage();
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);

  // Set date locale based on current language
  const dateLocale = currentLanguage === 'hi' ? hi : enUS;
  
  // In a real app, if state is missing, fetch the booking details from the API
  const { bookingDetails = {} } = location.state || {};
  
  // Default values in case state is missing
  const {
    eventTitle = 'Event Title',
    eventDate = '2025-05-15',
    eventTime = '19:30',
    venue = 'Venue Name',
    tickets = [],
    totalAmount = 0,
    customerName = '',
    email = '',
    phone = '',
    address = '',
  } = bookingDetails;

  // Format date based on current language
  const formattedDate = eventDate ? 
    formatDate(typeof eventDate === 'string' ? parseISO(eventDate) : eventDate, 'PPP', { locale: dateLocale }) : 
    '';

  // Simulate fetching ticket PDF
  useEffect(() => {
    const fetchTicket = async () => {
      if (!bookingId) return;
      
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a production app, this would be a call to get the ticket URL
      // Mock URL for demonstration purposes
      setTicketUrl('https://placehold.co/600x800');
      setLoading(false);
    };
    
    fetchTicket();
  }, [bookingId]);

  const handleDownloadTicket = () => {
    if (ticketUrl) {
      // In a real app, this would trigger an actual download
      // Simulate download process
      toast({
        title: t('confirmation.ticketDownloaded'),
        description: t('confirmation.checkDownloads'),
      });
    }
  };

  const handleShareTicket = () => {
    if (navigator.share && ticketUrl) {
      navigator.share({
        title: `${t('common.tickets')} - ${eventTitle}`,
        text: t('confirmation.shareTicketText', { event: eventTitle, date: formattedDate }),
        url: window.location.href,
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      toast({
        title: t('confirmation.linkCopied'),
        description: t('confirmation.ticketLinkCopied'),
      });
      
      // Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddToCalendar = () => {
    // In a real app, this would generate an .ics file or Google Calendar link
    toast({
      title: t('confirmation.addedToCalendar'),
      description: t('confirmation.eventAddedToCalendar'),
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.backToEvents')}
            </Button>
            <LanguageSwitcher />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t('confirmation.title')}
              </h1>
              <p className="text-gray-600">
                {t('confirmation.subtitle')}
              </p>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {t('confirmation.bookingDetails')}
                </CardTitle>
                <CardDescription>
                  {t('confirmation.bookingId')}: <span className="font-mono">{bookingId?.substring(0, 8)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{eventTitle}</h3>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formattedDate}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    {eventTime}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {venue}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('common.tickets')}</h4>
                  <div className="space-y-2">
                    {Array.isArray(tickets) && tickets.length > 0 ? (
                      tickets.map((ticket, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{ticket.quantity} x {ticket.category}</span>
                          <span>₹{ticket.subtotal}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm">
                        {ticketUrl ? `${t('common.tickets')}: ${tickets}` : t('confirmation.noTicketDetails')}
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('common.delivery')}</h4>
                  <div className="text-sm">
                    <div>{customerName}</div>
                    <div>{email}</div>
                    <div>{phone}</div>
                    <div>{address}</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>{t('common.total')}</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  {t('confirmation.eTicket')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : ticketUrl ? (
                  <div className="bg-gray-50 rounded-md overflow-hidden">
                    <img 
                      src={ticketUrl} 
                      alt="E-Ticket" 
                      className="w-full h-auto max-h-64 object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-gray-500">{t('confirmation.ticketLoading')}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="w-full" 
                  onClick={handleDownloadTicket}
                  disabled={!ticketUrl || loading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('confirmation.downloadTickets')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleShareTicket}
                  disabled={!ticketUrl || loading}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('confirmation.shareTicket')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleAddToCalendar}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('confirmation.addToCalendar')}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex">
                <Ticket className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800">{t('confirmation.importantInfo')}</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {t('confirmation.bringIdAndQr')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Confirmation;
