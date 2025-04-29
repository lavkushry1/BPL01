import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, Users, Ticket } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Seat } from '@/services/api/seatMapApi';
import InteractiveSeatMap from '@/components/booking/InteractiveSeatMap';
import DynamicPricingInfo from '@/components/booking/DynamicPricingInfo';
import { formatCurrency } from '@/utils/formatters';

const SeatSelectionPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId') || 'default-event';
  const venueId = searchParams.get('venueId') || 'default-venue';
  
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [selectedTicketCategory, setSelectedTicketCategory] = useState('premium');

  const handleProceedToCheckout = () => {
    // In a real implementation, we would navigate to checkout with the selected seats
    navigate(`/checkout?eventId=${eventId}&seatIds=${selectedSeats.map(s => s.id).join(',')}`);
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  
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
        <h1 className="text-2xl md:text-3xl font-bold mt-2">{t('booking.selectSeats', 'Select Your Seats')}</h1>
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
                      className="w-full"
                    >
                      {t('booking.proceedToCheckout', 'Proceed to Checkout')}
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