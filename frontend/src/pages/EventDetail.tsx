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
import SeatMap from '@/components/booking/SeatMap';
import { EventDescription } from '@/components/events/EventDescription';
import { EventHeader } from '@/components/events/EventHeader';
import { EventImageGallery } from '@/components/events/EventImageGallery';
import { SimilarEvents } from '@/components/events/SimilarEvents';
import Footer from '@/components/layout/Footer';
import Navbar from '@/components/layout/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Loader2Icon, MapPin, MinusIcon, PlusIcon, ShoppingCart, Tag, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { EventInfo } from '../components/events/EventInfo';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useCart } from '../hooks/useCart';

// Import API services
import eventApi from '@/services/api/eventApi';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // State
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<DisplaySeat[]>([]);
  const [seatMap, setSeatMap] = useState<any>(null);
  const [hasSeating, setHasSeating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); // To force refresh seat map
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching event with ID: ${id}`);
        const eventData = await eventApi.getEvent(id);
        console.log('Event data received:', eventData);

        if (!eventData) {
          setError('Event not found');
          setLoading(false);
          return;
        }

        // Format data for display
        // Helper function to safely parse dates
        const safeFormatDate = (dateString: string | undefined, formatStr: string, fallback: string = 'TBD') => {
          if (!dateString) return fallback;
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return fallback;
            return format(date, formatStr);
          } catch {
            return fallback;
          }
        };

        // Get the date from either startDate or start_date
        const eventDateStr = eventData.startDate || eventData.start_date || eventData.date;

        const formattedEvent: DisplayEvent = {
          id: eventData.id,
          title: eventData.title,
          description: eventData.description || '',
          date: eventData.date || safeFormatDate(eventDateStr, 'EEE, MMM d, yyyy'),
          time: eventData.time || safeFormatDate(eventDateStr, 'h:mm a', 'TBA'),
          venue: eventData.venue || eventData.location,
          image: eventData.images && eventData.images.length > 0
            ? eventData.images[0].url
            : eventData.poster_image,
          posterImage: eventData.poster_image || (eventData.images && eventData.images.length > 0
            ? eventData.images[0].url
            : undefined),
          images: eventData.images
            ? eventData.images.map((img: any) => img.url)
            : undefined,
          category: eventData.category,
          ticketTypes: (eventData.ticket_types || eventData.ticketTypes || []).map((tt: any) => ({
            id: tt.id || `ticket-${Math.random().toString(36).substr(2, 9)}`,
            name: tt.name || tt.category,
            price: tt.price,
            description: tt.description || '',
            availableQuantity: tt.available || tt.quantity,
            maxPerOrder: 10
          })),
          venueInfo: {
            name: eventData.venue || eventData.location,
            address: eventData.venue || eventData.location,
            facilities: ['Parking', 'Food & Beverages', 'Wheelchair Access'],
            rules: ['No outside food and beverages', 'No smoking', 'Children below 5 years not allowed'],
          },
          schedule: eventData.schedule || [
            { time: '19:00', title: 'Doors Open' },
            { time: '19:30', title: 'Event Starts' },
            { time: '22:00', title: 'Event Ends' }
          ],
          organizer: eventData.organizer || {
            name: 'Eventia',
            description: 'Premier event organizers',
            logo: '/logo.png',
            website: 'https://eventia.example.com'
          }
        };

        setEvent(formattedEvent);

        // Check if event has seat map data
        if (eventData.seatMap) {
          console.log('Event has seat map data:', eventData.seatMap);
          setSeatMap(eventData.seatMap);
          setHasSeating(true);
        } else if (eventData.seat_map_id) {
          // Fetch seat map if not included in event data but ID is available
          fetchSeatMap(eventData.seat_map_id);
        } else {
          // No seat map available
          setHasSeating(false);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err?.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    const fetchSeatMap = async (seatMapId: string) => {
      try {
        const response = await seatMapApi.getSeatMapById(seatMapId);
        if (response.data && response.data.data) {
          setSeatMap(response.data.data);
          setHasSeating(true);
        } else {
          setHasSeating(false);
          console.warn('Seat map data not found');
        }
      } catch (error) {
        console.error('Error fetching seat map:', error);
        setHasSeating(false); // Disable seating if fetch fails
        toast({
          title: "Seat Map Unavailable",
          description: "Unable to load seat map. Please try again later.",
          variant: "destructive"
        });
      }
    };

    // Initialize seat selection socket connection if available
    if (id && websocketService.isAvailable) {
      try {
        console.log('Connecting to seat selection socket');
        websocketService.connect(`seat-selection-${id}`);
        websocketService.on('seat-status-change', handleSeatStatusChange);
      } catch (error) {
        console.error('Error connecting to websocket:', error);
      }
    }

    // Fetch event data and related events
    fetchEvent();
    fetchAllEvents();

    // Cleanup function
    return () => {
      if (websocketService.isAvailable) {
        websocketService.disconnect();
        websocketService.off('seat-status-change', handleSeatStatusChange);
      }
    };
  }, [id]);

  // Handle seat status changes from websocket
  const handleSeatStatusChange = (data: any) => {
    if (!seatMap) return;

    console.log('Seat status changed:', data);

    // Update local seat map state
    setSeatMap(prevSeatMap => {
      if (!prevSeatMap) return null;

      const updatedSections = prevSeatMap.sections.map((section: any) => {
        if (section.id !== data.section_id) return section;

        const updatedRows = section.rows.map((row: any) => {
          const updatedSeats = row.seats.map((seat: any) => {
            if (seat.id === data.seat_id) {
              return { ...seat, status: data.status };
            }
            return seat;
          });

          return { ...row, seats: updatedSeats };
        });

        return { ...section, rows: updatedRows };
      });

      return { ...prevSeatMap, sections: updatedSections };
    });

    // Remove selected seat if it was booked by someone else
    if (data.status === 'booked' || data.status === 'reserved') {
      setSelectedSeats(prevSelectedSeats =>
        prevSelectedSeats.filter(seat => seat.id !== data.seat_id)
      );
    }
  };

  // Handle seat selection in seat map
  const toggleSeatSelection = (seatId: string, sectionId: string, rowId: string, seat: any) => {
    // Don't allow selection of unavailable seats
    if (seat.status !== 'available' && !selectedSeats.some(s => s.id === seatId)) {
      return;
    }

    // Update selected seats
    const isSelected = selectedSeats.some(s => s.id === seatId);

    if (isSelected) {
      // Deselect the seat
      setSelectedSeats(prevSelectedSeats =>
        prevSelectedSeats.filter(seat => seat.id !== seatId)
      );
    } else {
      // Select the seat
      const seatSection = seatMap.sections.find((s: any) => s.id === sectionId);
      const seatRow = seatSection?.rows.find((r: any) => r.id === rowId);
      const seatInfo = seatRow?.seats.find((s: any) => s.id === seatId);

      if (seatInfo) {
        const newSelectedSeat: DisplaySeat = {
          id: seatId,
          section_id: sectionId,
          row: seatRow.name,
          number: seatInfo.name,
          status: 'selected',
          price: seatInfo.price,
          category: seatInfo.category
        };

        setSelectedSeats(prevSelectedSeats => [...prevSelectedSeats, newSelectedSeat]);
      }
    }
  };

  const handleSeatSelect = (seats: DisplaySeat[]) => {
    setSelectedSeats(seats);
  };

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets(prevSelectedTickets => {
      // Find if ticket type already exists in selection
      const existing = prevSelectedTickets.find(ticket => ticket.id === ticketId);

      if (quantity === 0) {
        // Remove ticket if quantity is 0
        return prevSelectedTickets.filter(ticket => ticket.id !== ticketId);
      } else if (existing) {
        // Update quantity if ticket exists
        return prevSelectedTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, quantity } : ticket
        );
      } else {
        // Add new ticket selection
        return [...prevSelectedTickets, { id: ticketId, quantity }];
      }
    });
  };

  const calculateTotal = () => {
    if (!event) return 0;

    // Calculate total from regular tickets
    const ticketsTotal = selectedTickets.reduce((sum, selectedTicket) => {
      const ticketType = event.ticketTypes.find(tt => tt.id === selectedTicket.id);
      return sum + (ticketType?.price || 0) * selectedTicket.quantity;
    }, 0);

    // Add total from selected seats
    const seatsTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

    return ticketsTotal + seatsTotal;
  };

  const handleAddToCart = async () => {
    if (!event) return;

    setIsProcessing(true);

    try {
      // Prepare tickets for cart
      const cartTickets: CartTicket[] = [];

      // Add regular tickets
      selectedTickets.forEach(selectedTicket => {
        const ticketType = event.ticketTypes.find(tt => tt.id === selectedTicket.id);
        if (ticketType) {
          cartTickets.push({
            id: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            quantity: selectedTicket.quantity
          });
        }
      });

      // Add seat tickets
      selectedSeats.forEach(seat => {
        cartTickets.push({
          id: seat.id,
          name: `${seat.category} - ${seat.row} ${seat.number}`,
          price: seat.price,
          quantity: 1
        });
      });

      // Create cart item
      const cartItem: CartItem = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventImage: event.image,
        tickets: cartTickets,
        totalAmount: calculateTotal()
      };

      // Add to cart
      addToCart(cartItem);

      // Show success message
      toast({
        title: "Added to Cart",
        description: "Event tickets have been added to your cart.",
        variant: "default"
      });

      // Navigate to cart or stay on page
      // navigate('/cart'); // Uncomment to navigate directly to cart
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Cart Error",
        description: "There was a problem adding tickets to your cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToSeats = () => {
    if (!event || !hasSeating) return;
    setShowSeatMap(true);
    setActiveTab('seats');
  };

  // Fetch all events to show similar events
  const fetchAllEvents = async () => {
    try {
      const events = await eventApi.getEvents({ limit: 10 });
      setAllEvents(events || []);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  };

  // Get similar events based on category
  const similarEvents = event && allEvents.length > 0
    ? allEvents
      .filter(e =>
        e.id !== event.id &&
        (e.category === event.category ||
          (e.location === event.venue || e.venue === event.venue))
      )
      .slice(0, 3)
    : [];

  // Get ticket quantity for display
  const getTicketQuantity = (ticketId: string): number => {
    const ticket = selectedTickets.find(t => t.id === ticketId);
    return ticket?.quantity || 0;
  };

  // Check if there are any selected tickets or seats
  const hasAnySelection = selectedTickets.some(t => t.quantity > 0) || selectedSeats.length > 0;

  // Total selected tickets count
  const totalSelectedTickets = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0) + selectedSeats.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="my-8">
            <AlertTitle>Unable to load event</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
            <div className="mt-4 flex gap-4">
              <Button variant="outline" onClick={() => navigate('/events')}>
                Back to Events
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </Alert>
        ) : event ? (
          <div className="flex flex-col">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              className="self-start mb-4"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('eventDetail.backToEvents')}
            </Button>

            {/* Event Header with Title, Date, Time, Venue */}
            <EventHeader
              title={event.title}
              date={event.date}
              time={event.time}
              venue={event.venue}
              category={event.category || ''}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Main Content Area - 2/3 width on desktop */}
              <div className="lg:col-span-2 space-y-8">
                {/* Event Image Gallery */}
                <EventImageGallery
                  mainImage={event.image || event.posterImage || ''}
                  images={event.images || []}
                />

                {/* Tabs for Details/Tickets/Seats */}
                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">{t('eventDetail.details')}</TabsTrigger>
                    <TabsTrigger value="tickets" className="flex-1">{t('eventDetail.tickets')}</TabsTrigger>
                    {hasSeating && (
                      <TabsTrigger value="seats" className="flex-1">{t('eventDetail.seats')}</TabsTrigger>
                    )}
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="mt-6">
                    <div className="space-y-8">
                      {/* Event Description */}
                      <EventDescription description={event.description} />

                      {/* Event Schedule */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl">{t('eventDetail.schedule')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {event.schedule?.map((item, i) => (
                              <div key={`schedule-${i}`} className="flex items-start">
                                <div className="bg-primary/10 text-primary rounded p-2 font-medium">
                                  {item.time}
                                </div>
                                <div className="ml-4">
                                  <h4 className="font-medium">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Venue Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl">{t('eventDetail.venueInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">{event.venueInfo.name}</h4>
                            <p className="text-muted-foreground">{event.venueInfo.address}</p>
                          </div>

                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="facilities">
                              <AccordionTrigger>{t('eventDetail.facilities')}</AccordionTrigger>
                              <AccordionContent>
                                <ul className="list-disc pl-5 space-y-1">
                                  {event.venueInfo.facilities?.map((facility, i) => (
                                    <li key={`facility-${i}`}>{facility}</li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="rules">
                              <AccordionTrigger>{t('eventDetail.rules')}</AccordionTrigger>
                              <AccordionContent>
                                <ul className="list-disc pl-5 space-y-1">
                                  {event.venueInfo.rules?.map((rule, i) => (
                                    <li key={`rule-${i}`}>{rule}</li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </CardContent>
                      </Card>

                      {/* Organizer Information */}
                      {event.organizer && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-xl">{t('eventDetail.organizer')}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <h4 className="font-medium">{event.organizer.name}</h4>
                            {event.organizer.description && (
                              <p className="text-muted-foreground">{event.organizer.description}</p>
                            )}
                            {event.organizer.website && (
                              <a
                                href={event.organizer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center"
                              >
                                {t('eventDetail.visitWebsite')}
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tickets Tab */}
                  <TabsContent value="tickets" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">{t('eventDetail.selectTickets')}</CardTitle>
                        <CardDescription>
                          {t('eventDetail.ticketsDescription')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {event.ticketTypes.map(ticket => (
                            <div
                              key={ticket.id}
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg"
                            >
                              <div className="mb-2 sm:mb-0">
                                <h4 className="font-medium">{ticket.name}</h4>
                                {ticket.description && (
                                  <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                )}
                                <div className="mt-1 text-sm">
                                  <span className="text-green-600 font-medium">
                                    {ticket.availableQuantity} {t('eventDetail.available')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                                <div className="text-right">
                                  <span className="text-2xl font-bold">₹{ticket.price}</span>
                                </div>

                                <div className="flex items-center">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={getTicketQuantity(ticket.id) === 0}
                                    onClick={() => handleTicketChange(
                                      ticket.id,
                                      Math.max(0, getTicketQuantity(ticket.id) - 1)
                                    )}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </Button>

                                  <span className="w-10 text-center">
                                    {getTicketQuantity(ticket.id)}
                                  </span>

                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                      getTicketQuantity(ticket.id) >= ticket.availableQuantity ||
                                      getTicketQuantity(ticket.id) >= (ticket.maxPerOrder || 10)
                                    }
                                    onClick={() => handleTicketChange(
                                      ticket.id,
                                      getTicketQuantity(ticket.id) + 1
                                    )}
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between flex-col sm:flex-row gap-4">
                        <div>
                          {hasAnySelection && (
                            <div className="text-lg font-semibold">
                              Total: ₹{calculateTotal()}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          {hasSeating && (
                            <Button onClick={handleContinueToSeats} disabled={!hasAnySelection}>
                              {t('eventDetail.selectSeats')}
                            </Button>
                          )}

                          <Button
                            onClick={handleAddToCart}
                            disabled={!hasAnySelection || isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            {t('eventDetail.addToCart')}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  {/* Seats Tab */}
                  {hasSeating && (
                    <TabsContent value="seats" className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl">{t('eventDetail.selectSeats')}</CardTitle>
                          <CardDescription>
                            {t('eventDetail.seatsDescription')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {seatMap ? (
                            <div className="space-y-6">
                              <div className="flex gap-4 flex-wrap">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-green-100 border border-green-500 rounded-sm mr-2"></div>
                                  <span className="text-sm">Available</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-primary border border-primary rounded-sm mr-2"></div>
                                  <span className="text-sm">Selected</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded-sm mr-2"></div>
                                  <span className="text-sm">Unavailable</span>
                                </div>
                              </div>

                              <div className="max-w-full overflow-x-auto pb-4">
                                <SeatMap
                                  seatMap={seatMap}
                                  selectedSeats={selectedSeats}
                                  onSeatSelect={toggleSeatSelection}
                                />
                              </div>

                              {selectedSeats.length > 0 && (
                                <div className="mt-6 space-y-4">
                                  <h3 className="font-medium">{t('eventDetail.selectedSeats')}</h3>
                                  <div className="space-y-2">
                                    {selectedSeats.map(seat => (
                                      <div
                                        key={seat.id}
                                        className="flex justify-between items-center p-2 border rounded"
                                      >
                                        <span>
                                          {seat.category} - {seat.row} {seat.number}
                                        </span>
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium">₹{seat.price}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedSeats(prevSeats =>
                                                prevSeats.filter(s => s.id !== seat.id)
                                              );
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <LoadingSpinner size="md" />
                              <p className="mt-4 text-muted-foreground">Loading seat map...</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between flex-col sm:flex-row gap-4">
                          <div>
                            {hasAnySelection && (
                              <div className="text-lg font-semibold">
                                Total: ₹{calculateTotal()}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={handleAddToCart}
                            disabled={!hasAnySelection || isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 mr-2" />
                            )}
                            {t('eventDetail.addToCart')}
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              </div>

              {/* Sidebar - 1/3 width on desktop */}
              <div className="space-y-6">
                {/* Event Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">{t('eventDetail.summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EventInfo
                      icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
                      label={t('eventDetail.dateAndTime')}
                      value={`${event.date} at ${event.time}`}
                    />

                    <Separator />

                    <EventInfo
                      icon={<MapPin className="h-5 w-5 text-muted-foreground" />}
                      label={t('eventDetail.venue')}
                      value={event.venue}
                    />

                    {event.category && (
                      <>
                        <Separator />
                        <EventInfo
                          icon={<Tag className="h-5 w-5 text-muted-foreground" />}
                          label={t('eventDetail.category')}
                          value={event.category}
                        />
                      </>
                    )}

                    <Separator />

                    <EventInfo
                      icon={<Users className="h-5 w-5 text-muted-foreground" />}
                      label={t('eventDetail.tickets')}
                      value={hasAnySelection
                        ? `${totalSelectedTickets} selected`
                        : t('eventDetail.noTicketsSelected')
                      }
                    />
                  </CardContent>
                  <CardFooter>
                    {activeTab !== 'tickets' && (
                      <Button
                        className="w-full"
                        onClick={() => setActiveTab('tickets')}
                      >
                        {hasAnySelection
                          ? t('eventDetail.modifySelection')
                          : t('eventDetail.selectTickets')
                        }
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Similar Events */}
                <SimilarEvents
                  events={similarEvents}
                  title={t('eventDetail.similarEvents')}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold mb-4">{t('eventDetail.eventNotFound')}</h3>
            <Button onClick={() => navigate('/events')}>
              {t('eventDetail.browseEvents')}
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;
