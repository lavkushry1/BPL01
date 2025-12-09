/**
 * @component ConfirmationPage
 * @description Displays booking confirmation with ticket details and provides options to download or share the e-ticket.
 * 
 * @apiDependencies
 * - GET /api/bookings/:bookingId/ticket - Fetches the ticket PDF for download and display
 * 
 * @requiredProps
 * - bookingId (string) - ID of the booking
 * - eventTitle (string) - Title of the event
 * - eventDate (string) - Date of the event
 * - eventTime (string) - Time of the event
 * - venue (string) - Venue of the event
 * - ticketCount (number) - Number of tickets booked
 * 
 * @expectedResponse
 * - Binary PDF file stream that is displayed in an iframe and available for download
 * 
 * @navigationFlow
 * - Previous: Payment confirmation page
 * - Final destination page in the booking flow
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Ticket, Share2, Check, CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getTicketPdfUrl } from '@/services/api/bookingApi';

interface ConfirmationPageProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  ticketCount: number;
}

const ConfirmationPage: React.FC<ConfirmationPageProps> = ({
  bookingId,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  ticketCount
}) => {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketPdf = async () => {
      try {
        setLoading(true);
        
        // Get the ticket URL from the bookingApi service
        const ticketUrl = getTicketPdfUrl(bookingId);
        
        // Fetch the ticket and create a blob URL
        const response = await fetch(ticketUrl);
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setPdfUrl(url);
      } catch (error) {
        console.error('Error fetching ticket PDF:', error);
        toast({
          title: "Failed to load ticket",
          description: "Please try again or contact support",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTicketPdf();

    // Cleanup function to revoke object URL
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [bookingId]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Eventia-Ticket-${bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your ticket PDF is being downloaded"
    });
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    
    if (navigator.share) {
      try {
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], `Eventia-Ticket-${bookingId}.pdf`, { type: 'application/pdf' });
        
        await navigator.share({
          title: `Ticket for ${eventTitle}`,
          text: 'Here is your Eventia ticket',
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
          title: "Sharing failed",
          description: "Please try downloading and sharing manually",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your device doesn't support direct sharing. Please download the ticket instead.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('confirmation.bookingConfirmed')}
        </h1>
        <p className="text-gray-600">
          {t('confirmation.collectAtVenue')}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{eventTitle}</CardTitle>
          <CardDescription>
            <div className="flex items-center text-sm mt-1">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              <span>{eventDate} • {eventTime}</span>
            </div>
            <div className="text-sm mt-1">
              {venue}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-500">{t('confirmation.bookingId')}</span>
              <div className="font-mono text-sm">{bookingId}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">{t('confirmation.tickets')}</span>
              <div className="font-semibold">{ticketCount} {ticketCount === 1 ? t('confirmation.ticket') : t('confirmation.tickets')}</div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : pdfUrl ? (
            <div className="bg-gray-50 rounded-md overflow-hidden h-96">
              <iframe 
                src={`${pdfUrl}#toolbar=0`}
                className="w-full h-full"
                title="Ticket PDF"
              ></iframe>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-md">
              <p className="text-red-500">{t('confirmation.pdfError')}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button 
            className="flex-1" 
            onClick={handleDownload}
            disabled={!pdfUrl || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('confirmation.downloadPdf')}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShare}
            disabled={!pdfUrl || loading}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {t('confirmation.shareTicket')}
          </Button>
        </CardFooter>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
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
    </div>
  );
};

export default ConfirmationPage;
