import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, Users, Ticket } from 'lucide-react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Seat } from '@/services/api/seatMapApi';
import InteractiveSeatMap from '@/components/booking/InteractiveSeatMap';
import DynamicPricingInfo from '@/components/booking/DynamicPricingInfo';
import { formatCurrency } from '@/utils/formatters';
import { getEvent } from '@/services/api/eventApi';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const SeatSelectionPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams(); // Get eventId from route params
  const eventId = eventIdParam || searchParams.get('eventId') || 'default-event';
  const venueId = searchParams.get('venueId') || 'default-venue';
  
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [selectedTicketCategory, setSelectedTicketCategory] = useState('premium');
  const [eventDetails, setEventDetails] = useState<any>(null);
  
  // Fetch event details
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Effect to set event details once fetched
  useEffect(() => {
    if (event) {
      console.log('Event data for booking:', event);
      setEventDetails(event);
    }
  }, [event]);
  
  // Add a check for admin-created events
  useEffect(() => {
    const checkAdminEvents = () => {
      try {
        // Already loaded via React Query, but as a fallback, check localStorage
        if (!event) {
          const adminEventsJson = localStorage.getItem('admin_created_events');
          if (adminEventsJson) {
            const adminEvents = JSON.parse(adminEventsJson);
            const foundEvent = adminEvents.find((e: any) => e.id === eventId);
            if (foundEvent) {
              console.log('Found admin event in localStorage:', foundEvent);
              setEventDetails(foundEvent);
            }
          }
        }
      } catch (e) {
        console.error('Error checking admin events during initialization:', e);
      }
    };
    
    checkAdminEvents();
  }, [event, eventId]);

  const handleProceedToCheckout = () => {
    // Store booking data in session storage for use in the delivery address and checkout pages
    const bookingData = {
      eventId: eventId,
      eventTitle: eventDetails?.title || "Event Title",
      eventDate: eventDetails?.start_date || eventDetails?.date || "2025-06-15",
      eventTime: eventDetails?.time || "18:00",
      venue: eventDetails?.location || eventDetails?.venue || "Venue Name",
      tickets: selectedSeats.map(seat => ({
        category: selectedTicketCategory || "Standard",
        quantity: 1,
        price: seat.price || 0,
        subtotal: seat.price || 0
      })),
      totalAmount: totalPrice
    };
    
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Navigate to delivery address page instead of checkout
    navigate(`/booking/delivery?eventId=${eventId}&seatIds=${selectedSeats.map(s => s.id).join(',')}`);
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  
  // If loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  // If error or no event found, show error message
  if (error || (!eventDetails && !isLoading)) {
    return (
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="mb-6">
          <Link 
            to="/events" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.backToEvents', 'Back to Events')}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{t('booking.eventNotFound', 'Event Not Found')}</h1>
          <p className="text-muted-foreground">
            {t('booking.errorLoadingEvent', 'There was an error loading this event. Please try again or select a different event.')}
          </p>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Link 
          to={`/events/${eventId}`} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('booking.backToEvent', 'Back to Event')}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">
          {eventDetails?.title ? `${t('booking.selectSeatsFor', 'Select Your Seats for')}: ${eventDetails.title}` : t('booking.selectSeats', 'Select Your Seats')}
        </h1>
        <p className="text-muted-foreground">
          {t('booking.seatSelectionInfo', 'Choose your preferred seats for the event. Selected seats will be temporarily reserved for 10 minutes.')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Tabs defaultValue={selectedTicketCategory} onValueChange={setSelectedTicketCategory} className="w-full">
            <TabsList className="w-full mb-4 overflow-x-auto scrollbar-hide">
              <TabsTrigger value="premium" className="flex-1">
                {t('booking.premium', 'Premium')}
                <Badge variant="outline" className="ml-2">₹4,999+</Badge>
              </TabsTrigger>
              <TabsTrigger value="standard" className="flex-1">
                {t('booking.standard', 'Standard')}
                <Badge variant="outline" className="ml-2">₹2,999+</Badge>
              </TabsTrigger>
              <TabsTrigger value="economy" className="flex-1">
                {t('booking.economy', 'Economy')}
                <Badge variant="outline" className="ml-2">₹1,499+</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="premium" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <InteractiveSeatMap
                    eventId={eventId}
                    venueId={venueId}
                    selectedSeats={selectedSeats}
                    onSeatSelect={setSelectedSeats}
                    showLegend={true}
                    showTotalPrice={false}
                    enableAR={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="standard" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <InteractiveSeatMap
                    eventId={eventId}
                    venueId={venueId}
                    selectedSeats={selectedSeats}
                    onSeatSelect={setSelectedSeats}
                    showLegend={true}
                    showTotalPrice={false}
                    enableAR={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="economy" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  <InteractiveSeatMap
                    eventId={eventId}
                    venueId={venueId}
                    selectedSeats={selectedSeats}
                    onSeatSelect={setSelectedSeats}
                    showLegend={true}
                    showTotalPrice={false}
                    enableAR={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-1" />
              {t('booking.seatReservationInfo', 'Seats are reserved for 10 minutes after selection. Seats will be released if you don\'t complete your booking within this time.')}
            </div>
          </div>
        </div>
        
        <div className="col-span-1">
          <div className="sticky top-6 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-3">{t('booking.orderSummary', 'Order Summary')}</h3>
                
                {/* Display event details */}
                {eventDetails && (
                  <div className="mb-4 pb-3 border-b">
                    <h4 className="font-medium text-sm">{eventDetails.title}</h4>
                    <div className="text-sm text-muted-foreground mt-1">
                      {eventDetails.start_date || eventDetails.date}, {eventDetails.time || '18:00'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {eventDetails.location || eventDetails.venue}
                    </div>
                  </div>
                )}
                
                {selectedSeats.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Ticket className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>
                          {t('booking.selectedSeats', 'Selected Seats')}
                          <span className="ml-2 text-muted-foreground">
                            ({selectedSeats.length})
                          </span>
                        </span>
                      </div>
                      <span>{formatCurrency(totalPrice, 'INR')}</span>
                    </div>
                    
                    <div className="text-sm px-2 py-1.5 bg-muted/50 rounded-md">
                      <div className="font-medium mb-1">{t('booking.seatsSelected', 'Seats Selected:')}</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedSeats.map(seat => (
                          <Badge key={seat.id} variant="outline">
                            {seat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center font-medium">
                        <span>{t('booking.totalAmount', 'Total Amount')}</span>
                        <span className="text-lg">{formatCurrency(totalPrice, 'INR')}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleProceedToCheckout}
                      disabled={selectedSeats.length === 0}
                    >
                      {t('booking.proceedToCheckout', 'Proceed to Checkout')}
                    </Button>
                    
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {t('booking.otherViewers', '{{count}} other people viewing this event', { count: Math.floor(Math.random() * 20) + 5 })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      {t('booking.noSeatsSelected', 'No seats selected yet. Please select your preferred seats from the seating plan.')}
                    </p>
                    <Button 
                      variant="outline"
                      disabled
                    >
                      {t('booking.selectSeatsFirst', 'Select seats to continue')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <DynamicPricingInfo 
              eventId={eventId}
              ticketCategoryId={selectedTicketCategory}
              quantity={selectedSeats.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage; 