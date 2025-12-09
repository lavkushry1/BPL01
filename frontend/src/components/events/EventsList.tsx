import { useState, useEffect } from 'react';
import { getEvents, Event } from '../../services/api/eventApi';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X, Loader2 } from 'lucide-react';

// Define filter form schema
const filterSchema = z.object({
  categoryId: z.string().optional(),
  priceRange: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface EventsListProps {
  categoryId?: string;
  limit?: number;
}

const EventsList = ({ categoryId, limit = 10 }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // Get initial filter values from URL search params
  const initialFilters: FilterFormValues = {
    categoryId: searchParams.get('categoryId') || categoryId || '',
    priceRange: searchParams.get('priceRange') || '',
    date: searchParams.get('date') || '',
    location: searchParams.get('location') || '',
  };
  
  // Initialize form with React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isDirty },
    setValue,
  } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: initialFilters,
  });
  
  // Apply initial values from props or URL
  useEffect(() => {
    if (categoryId) {
      setValue('categoryId', categoryId);
    }
  }, [categoryId, setValue]);

  // Fetch events with filters
  const fetchEvents = async (filters: FilterFormValues) => {
    try {
      setLoading(true);
      
      // Build filter object
      const filterParams: Record<string, any> = {
        limit
      };
      
      if (filters.categoryId) filterParams.category = filters.categoryId;
      if (filters.priceRange) filterParams.priceRange = filters.priceRange;
      if (filters.date) filterParams.date = filters.date;
      if (filters.location) filterParams.location = filters.location;
      
      const eventsData = await getEvents(filterParams);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch events when component mounts with initial filters
  useEffect(() => {
    fetchEvents(initialFilters);
  }, []);
  
  // Handle filter form submission
  const onSubmit = (data: FilterFormValues) => {
    // Update URL search params
    const params = new URLSearchParams();
    if (data.categoryId) params.set('categoryId', data.categoryId);
    if (data.priceRange) params.set('priceRange', data.priceRange);
    if (data.date) params.set('date', data.date);
    if (data.location) params.set('location', data.location);
    
    setSearchParams(params);
    
    // Fetch events with new filters
    fetchEvents(data);
  };
  
  // Clear all filters
  const clearFilters = () => {
    reset({
      categoryId: '',
      priceRange: '',
      date: '',
      location: '',
    });
    
    setSearchParams(new URLSearchParams());
    fetchEvents({});
  };
  
  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Filter controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Events</h2>
          <Button 
            variant="outline" 
            onClick={toggleFilters}
            className="flex items-center gap-2"
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        {showFilters && (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="concerts">Concerts</option>
                  <option value="sports">Sports</option>
                  <option value="theatre">Theatre</option>
                  <option value="comedy">Comedy</option>
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.categoryId.message)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Price Range</label>
                <select
                  {...register('priceRange')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Any Price</option>
                  <option value="0-500">Under ₹500</option>
                  <option value="500-1000">₹500 - ₹1000</option>
                  <option value="1000-5000">₹1000 - ₹5000</option>
                  <option value="5000+">Above ₹5000</option>
                </select>
                {errors.priceRange && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.priceRange.message)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  {...register('date')}
                  className="w-full h-10"
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.date.message)}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  {...register('location')}
                  placeholder="Enter city"
                  className="w-full h-10"
                />
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1">{String(errors.location.message)}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
              <Button type="submit" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-10 flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p>Loading events...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg border border-red-200 p-6">
          <p className="font-medium">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => fetchEvents(initialFilters)} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 p-6">
          <p className="text-gray-600 mb-2">No events found</p>
          <p className="text-sm text-gray-500 mb-4">Try changing your filters or check back later.</p>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      )}
      
      {/* Events grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {event.images && event.images.length > 0 && (
                <img 
                  src={event.images.find(img => img.is_featured)?.url || event.images[0].url}
                  alt={event.images[0].alt_text || event.title} 
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span>
                  <span className="text-sm font-semibold">{event.location}</span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-600">
                    {event.ticket_types && event.ticket_types.length > 0 
                      ? `From ${event.ticket_types.reduce((min, ticket) => 
                          ticket.price < min ? ticket.price : min, 
                          event.ticket_types[0].price
                        ).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`
                      : 'Tickets available soon'
                    }
                  </span>
                  <Link 
                    to={`/events/${event.id}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsList; 