/**
 * @component EventDetail
 * @description Detailed view of a specific event with options to select tickets or seats
 * and proceed to booking. Provides event information, ticket selection, and seating map.
 * 
 * @apiDependencies
 * - GET event by ID from eventApi.getEventById(id)
 * - POST to create booking using bookingApi.createBooking()
 * - Fetch seat map with seatMapApi if event has seating
 * - Real-time seat updates via websocket service
 * 
 * @stateManagement
 * - event - Event details
 * - selectedTickets - Selected ticket types and quantities
 * - selectedSeats - Selected seats (when using seating map)
 * - seatMap - Seat map configuration for the event
 * - hasSeating - Whether the event uses seat selection
 * 
 * @requiredParams
 * - id - Event ID from URL parameters
 * 
 * @navigationFlow
 * - After successful booking creation → Checkout page with booking ID
 * - User can also navigate back to Events listing
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { iplMatches } from '@/data/iplData';
import { events as mockEvents, Event as EventData } from '@/data/eventsData';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeatMap from '@/components/booking/SeatMap';
import { Calendar, Clock, MapPin, Tag, ArrowLeft, ShoppingCart, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EventHeader } from '@/components/events/EventHeader';
import { EventDescription } from '@/components/events/EventDescription';
import { TicketSelector } from '../components/events/TicketSelector';
import { EventInfo } from '../components/events/EventInfo';
import { TicketSelection } from '../components/events/TicketSelection';
import { useCart } from '../hooks/useCart';
import { EventImageGallery } from '@/components/events/EventImageGallery';
import { SimilarEvents } from '@/components/events/SimilarEvents';

// Import API services
import eventApi from '@/services/api/eventApi';
import bookingApi from '@/services/api/bookingApi';
import seatMapApi from '@/services/api/seatMapApi';
import { websocketService } from '@/services/websocket.service';

// Define local interfaces to avoid conflicts
interface DisplayTicketType {
  id: string;
  name: string;
  price: number;
  description?: string;
  availableQuantity: number;
  maxPerOrder?: number;
}

interface DisplayEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image?: string;
  posterImage?: string;
  images?: string[];
  category?: string;
  ticketTypes: DisplayTicketType[];
  venueInfo: {
    name: string;
    address: string;
    facilities?: string[];
    rules?: string[];
    map?: string;
  };
  schedule?: { time: string; title: string; description?: string }[];
  organizer?: {
    name: string;
    description?: string;
    logo?: string;
    website?: string;
  };
}

interface DisplaySeat {
  id: string;
  row: string;
  number: string;
  status: 'available' | 'reserved' | 'booked' | 'blocked' | 'selected';
  price: number;
  category: string;
  section_id: string;
}

interface SelectedTicket {
  id: string;
  quantity: number;
}

interface CartTicket {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Define a type compatible with the CartItem interface from useCart.tsx
interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventImage?: string;
  tickets: CartTicket[];
  totalAmount: number;
}

const EventDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // State
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<DisplaySeat[]>([]);
  const [seatMap, setSeatMap] = useState<any | null>(null);
  const [hasSeating, setHasSeating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); // To force refresh seat map
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        if (!id) {
          setError("Event ID is missing");
          setLoading(false);
          return;
        }

        try {
          // Try to fetch from API
          const response = await eventApi.getEvent(id);
          
          // Map API response to display format
          const formattedEvent: DisplayEvent = {
            id: response.id,
            title: response.title,
            description: response.description,
            date: response.start_date ? format(new Date(response.start_date), 'yyyy-MM-dd') : '',
            time: response.start_date ? format(new Date(response.start_date), 'HH:mm') : '',
            venue: response.location,
            image: response.images?.find((img: any) => img.is_featured)?.url || response.images?.[0]?.url,
            posterImage: response.poster_image,
            images: response.images?.map((img: any) => img.url) || [],
            category: response.category,
            ticketTypes: response.ticket_types.map((tt: any) => ({
              id: tt.id,
              name: tt.name,
              price: tt.price,
              description: tt.description,
              availableQuantity: tt.available,
              maxPerOrder: Math.min(tt.available, 10)
            })),
            venueInfo: {
              name: response.location,
              address: response.location
            },
            schedule: response.schedule?.map((s: any) => ({
              time: s.time,
              title: s.title,
              description: s.description
            })),
            organizer: {
              name: response.organizer?.name || 'Eventia Events',
              description: response.organizer?.description || 'Premier event management company for all your entertainment needs',
              logo: response.organizer?.logo || 'https://placehold.co/100x100',
              website: response.organizer?.website || 'https://eventia.example.com'
            }
          };
          
          setEvent(formattedEvent);
        } catch (apiError) {
          console.warn('API fetch failed, using fallback data');
          fallbackToMockData();
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error loading event",
          description: "Failed to load event details. Please try again.",
          variant: "destructive"
        });
        
        // Fallback to mock data if API fails
        fallbackToMockData();
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSeatMap = async (seatMapId: string) => {
      try {
        const response = await seatMapApi.getSeatMapById(seatMapId);
        setSeatMap(response.data.data);
      } catch (error) {
        console.error('Error fetching seat map:', error);
        setHasSeating(false); // Disable seating if fetch fails
        toast({
          title: "Seat Map Unavailable",
          description: "Seat selection is not available at this time. Please continue with regular tickets.",
          variant: "destructive"
        });
      }
    };
    
    // Fallback to mock data if API fails
    const fallbackToMockData = () => {
      if (!id) return;
      
      // Try to find in mock data
      const mockEvent = mockEvents.find(e => e.id === id);
      const foundMatch = iplMatches.find(m => m.id === id);
      
      if (mockEvent) {
        const displayEvent: DisplayEvent = {
          id: mockEvent.id,
          title: mockEvent.title,
          description: mockEvent.description || '',
          date: mockEvent.date,
          time: mockEvent.time,
          venue: mockEvent.venue,
          image: mockEvent.image,
          posterImage: mockEvent.posterImage || mockEvent.image,
          images: mockEvent.image ? [mockEvent.image] : [],
          category: mockEvent.category,
          ticketTypes: (mockEvent.ticketTypes || []).map((tt: any) => ({
            id: tt.id || tt.category,
            name: tt.name || tt.category,
            price: tt.price,
            description: tt.description || '',
            availableQuantity: tt.available || 100,
            maxPerOrder: 10
          })),
          venueInfo: {
            name: mockEvent.venue,
            address: mockEvent.venue,
            facilities: ['Parking', 'Food Court', 'Wheelchair Access'],
            rules: ['No outside food', 'No photography', 'No re-entry without stamp']
          },
          schedule: [],
          organizer: {
            name: 'Eventia Events',
            description: 'Premier event management company for all your entertainment needs',
            logo: 'https://placehold.co/100x100',
            website: 'https://eventia.example.com'
          }
        };
        
        setEvent(displayEvent);
      } else if (foundMatch) {
        const displayEvent: DisplayEvent = {
          id: foundMatch.id,
          title: foundMatch.title,
          description: foundMatch.description || "Exciting IPL match",
          date: foundMatch.date,
          time: foundMatch.time || "19:30",
          venue: foundMatch.venue,
          image: foundMatch.image,
          posterImage: foundMatch.image,
          images: foundMatch.image ? [foundMatch.image] : [],
          category: 'IPL',
          ticketTypes: (foundMatch.ticketTypes || []).map((type: any) => ({
            id: type.category || 'Standard',
            name: type.category || 'Standard',
            price: type.price || 500,
            availableQuantity: type.available || 100,
            maxPerOrder: 10
          })),
          venueInfo: {
            name: foundMatch.venue,
            address: foundMatch.venue || 'Stadium',
            facilities: ['Parking', 'Food Court', 'Fan Zone'],
            rules: ['No outside food', 'No photography without permission', 'No re-entry']
          },
          organizer: {
            name: 'BCCI',
            description: 'Board of Control for Cricket in India',
            logo: 'https://placehold.co/100x100',
            website: 'https://www.iplt20.com'
          }
        };
        
        setEvent(displayEvent);
      } else {
        setError("Event not found");
      }
    };

    fetchEvent();
    
    // Cleanup function
    return () => {
      if (websocketService) {
        websocketService.off('seat-status-changed', handleSeatStatusChange);
        websocketService.disconnect();
      }
    };
  }, [id]);

  // Handle real-time seat status updates
  const handleSeatStatusChange = (data: any) => {
    if (!seatMap) return;
    
    // Update seat map with new statuses
    const updatedSeatMap = { ...seatMap };
    
    // Update sections and seats with new status
    updatedSeatMap.sections = updatedSeatMap.sections.map((section: any) => {
      section.rows = section.rows.map((row: any) => {
        row.seats = row.seats.map((seat: any) => {
          if (data.seatIds.includes(seat.id)) {
            return { ...seat, status: data.status };
          }
          return seat;
        });
        return row;
      });
      return section;
    });
    
    // Update selected seats if any of them have changed status
    const updatedSelectedSeats = selectedSeats.filter(seat => {
      const seatIdChanged = data.seatIds.includes(seat.id);
      if (seatIdChanged && data.status !== 'selected') {
        // If seat is no longer available, remove from selection
        toast({
          title: "Seat no longer available",
          description: `Seat ${seat.row}${seat.number} has been ${data.status} by someone else.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    if (updatedSelectedSeats.length !== selectedSeats.length) {
      setSelectedSeats(updatedSelectedSeats);
    }
    
    setSeatMap(updatedSeatMap);
    // Force refresh the seat map component
    setRefreshKey(prev => prev + 1);
  };

  const handleSeatSelect = (seats: DisplaySeat[]) => {
    setSelectedSeats(seats);
  };

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => {
      const existing = prev.findIndex(t => t.id === ticketId);
      
      if (existing >= 0) {
        if (quantity === 0) {
          return prev.filter(t => t.id !== ticketId);
        }
        return prev.map(t => t.id === ticketId ? { ...t, quantity } : t);
      } else if (quantity > 0) {
        return [...prev, { id: ticketId, quantity }];
      }
      return prev;
    });
  };

  const calculateTotal = () => {
    if (!event) return 0;
    
    return selectedTickets.reduce((sum, selectedTicket) => {
      const ticketType = event.ticketTypes.find(tt => tt.id === selectedTicket.id);
      if (ticketType) {
        return sum + (ticketType.price * selectedTicket.quantity);
      }
      return sum;
    }, 0);
  };

  const handleAddToCart = async () => {
    if (!event || selectedTickets.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Add to cart context
      addToCart({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventImage: event.image,
        tickets: selectedTickets.map(st => {
          const ticketType = event.ticketTypes.find(tt => tt.id === st.id);
          return {
            id: st.id,
            name: ticketType?.name || '',
            price: ticketType?.price || 0,
            quantity: st.quantity
          };
        }),
        totalAmount: calculateTotal()
      });
      
      toast({
        title: "Tickets added to cart",
        description: "Proceeding to checkout...",
      });
      
      navigate('/checkout');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      toast({
        title: "Booking Error",
        description: error?.response?.data?.message || "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToSeats = () => {
    if (!showSeatMap) {
      // Simulate loading seat map
      setLoading(true);
      setTimeout(() => {
        setSeatMap(seatMap);
        setShowSeatMap(true);
        setLoading(false);
      }, 1000);
    }
  };

  // Add this to fetch all events for similar events recommendations
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        // Try to fetch from API
        const response = await eventApi.getEvents({
          limit: 20 // Limit to a reasonable number for recommendations
        });
        
        if (response) {
          setAllEvents(response.map((event: any) => ({
            id: event.id,
            title: event.title,
            image: event.images?.find((img: any) => img.is_featured)?.url || event.images?.[0]?.url,
            date: event.start_date ? format(new Date(event.start_date), 'MMM d, yyyy') : '',
            venue: event.location || event.venue || '',
            category: event.category || ''
          })));
        }
      } catch (error) {
        console.error('Error fetching events for recommendations:', error);
        // Fallback to mock data if API fails
        setAllEvents(mockEvents.map(event => ({
          id: event.id,
          title: event.title,
          image: event.image,
          date: event.date,
          venue: event.venue,
          category: event.category
        })));
      }
    };
    
    fetchAllEvents();
  }, []);

  // Convert selectedTickets array to Record<string, number> for TicketSelector
  const selectedTicketsRecord = selectedTickets.reduce((acc, ticket) => {
    acc[ticket.id] = ticket.quantity;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Event Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                {error || "We couldn't find the event you're looking for."}
              </p>
              <Link to="/events">
                <Button variant="default">Browse Events</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Event Header */}
        <div 
          className="bg-cover bg-center py-16 text-white relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${event.posterImage || event.image})`,
            backgroundSize: 'cover'
          }}
        >
          <div className="container mx-auto px-4 relative z-10">
            <Link to="/events" className="inline-flex items-center text-white/80 hover:text-white mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/90 mb-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{event.venue}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/venue-preview/${event.id}`}>
                <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Venue in AR
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event images gallery */}
              <EventImageGallery 
                images={(event.images && event.images.length > 0) 
                  ? event.images 
                  : [event.image, event.posterImage].filter(Boolean) as string[]}
                alt={event.title}
                className="mb-6"
              />
              
              {/* Event description */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <div className="prose max-w-none">
                  {event.description.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <Accordion type="single" collapsible className="mb-8">
                <AccordionItem value="venue-details">
                  <AccordionTrigger>Venue Information</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-gray-700 mb-2">
                      The event will take place at <strong>{event.venue}</strong>.
                    </p>
                    <p className="text-sm text-gray-700">
                      Please arrive 30 minutes before the start time. Entry gates close 15 minutes after the event starts.
                    </p>
                    {/* Add venue map or location info here if available */}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq">
                  <AccordionTrigger>Frequently Asked Questions</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">What is the refund policy?</h4>
                        <p className="text-sm text-gray-700">Tickets are non-refundable once purchased, but can be transferred to another person.</p>
                      </div>
                      <div>
                        <h4 className="font-medium">How will I receive my tickets?</h4>
                        <p className="text-sm text-gray-700">You will receive an e-ticket via email after your payment is confirmed. You'll need to present this ticket (either printed or on your mobile device) at the venue.</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Is there parking available?</h4>
                        <p className="text-sm text-gray-700">Limited parking is available at the venue on a first-come, first-served basis.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            {/* Booking Section */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Book Tickets</CardTitle>
                  <CardDescription>
                    Select tickets or seats to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showSeatMap ? (
                    <>
                      <TicketSelector
                        ticketTypes={event.ticketTypes}
                        selectedTickets={selectedTicketsRecord}
                        onTicketChange={handleTicketChange}
                      />
                      
                      {selectedTickets.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div className="flex justify-between mb-2">
                            <span>Selected Tickets:</span>
                            <span>{selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0)}</span>
                          </div>
                          {selectedTickets.map((ticket) => (
                            <div key={ticket.id} className="flex justify-between items-center pb-4 border-b border-gray-100">
                              <div>
                                <h4 className="font-medium">{ticket.id}</h4>
                                <p className="text-sm text-gray-600">
                                  ₹{(event.ticketTypes.find(t => t.id === ticket.id)?.price || 0).toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {event.ticketTypes.find(t => t.id === ticket.id)?.availableQuantity} available
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const current = ticket.quantity;
                                    if (current > 0) {
                                      handleTicketChange(ticket.id, current - 1);
                                    }
                                  }}
                                  disabled={ticket.quantity === 0}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center">
                                  {ticket.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const current = ticket.quantity;
                                    const maxAvailable = event.ticketTypes.find(t => t.id === ticket.id)?.availableQuantity || 0;
                                    if (current < maxAvailable) {
                                      handleTicketChange(ticket.id, current + 1);
                                    }
                                  }}
                                  disabled={
                                    ticket.quantity >= (event.ticketTypes.find(t => t.id === ticket.id)?.availableQuantity || 0)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Select Your Seats</h3>
                        <p className="text-sm text-gray-600">
                          Click on available seats to select them. Selected seats will be highlighted.
                        </p>
                      </div>
                      
                      <div className="seat-map-container bg-gray-100 p-4 rounded">
                        {/* Placeholder for seat map */}
                        <div className="flex justify-center items-center p-8">
                          <p className="text-gray-500">Seat map loading...</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <div className="w-full border-t border-gray-200 pt-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-bold">₹{calculateTotal().toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={showSeatMap ? handleAddToCart : handleContinueToSeats}
                    disabled={
                      isProcessing || 
                      (selectedTickets.length === 0 && selectedSeats.length === 0)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {showSeatMap ? (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        {showSeatMap ? t('common.booknow', 'Book Now') : t('common.continue', 'Continue')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <div className="container mx-auto px-4 pb-16">
        {/* Similar Events section */}
        <SimilarEvents 
          currentEventId={event.id}
          category={event.category || ''}
          events={allEvents}
          isLoading={loading}
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default EventDetail;
