import { useState, useEffect, Suspense } from 'react';
import { 
  useEvents, 
  useCreateEvent, 
  useUpdateEvent, 
  useDeleteEvent,
  usePrefetchEvents,
  useSuspenseEvents
} from '@/hooks/api/useEvents';
import { EVENTS_QUERY_KEYS } from '@/hooks/api/useEvents';
import { EventFilters, EventInput } from '@/types/events';
import { Button } from '@/components/ui/button';
import { QueryProvider } from '@/providers/QueryProvider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, Plus, Edit, Trash, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Event form schema with Zod validation
const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['draft', 'published', 'cancelled'])
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// ----- Regular Events List Component -----

function EventsList() {
  const [filters, setFilters] = useState<EventFilters>({
    status: 'published',
    limit: 10
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { prefetchEvents } = usePrefetchEvents();
  
  // The main events query
  const { 
    data: events, 
    isLoading, 
    isError, 
    error 
  } = useEvents(filters);
  
  // Mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchQuery || undefined }));
      }
    }, 400);
    
    return () => clearTimeout(timer);
  }, [searchQuery, filters.search]);

  // Prefetch next page when close to bottom
  const prefetchNextPage = () => {
    if (events && events.length >= filters.limit!) {
      prefetchEvents({
        ...filters,
        page: (filters.page || 1) + 1
      });
    }
  };

  // Handle event creation
  const handleCreateEvent = (data: EventFormValues) => {
    createEvent.mutate(data as EventInput, {
      onSuccess: () => {
        toast({
          title: 'Event created',
          description: 'Your event has been created successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Failed to create event',
          description: error.message,
          variant: 'destructive'
        });
      }
    });
  };

  // Handle event update
  const handleUpdateEvent = (id: string, data: Partial<EventFormValues>) => {
    updateEvent.mutate({ id, data: data as Partial<EventInput> }, {
      onSuccess: () => {
        toast({
          title: 'Event updated',
          description: 'Your event has been updated successfully',
        });
      }
    });
  };

  // Handle event deletion
  const handleDeleteEvent = (id: string) => {
    deleteEvent.mutate(id, {
      onSuccess: () => {
        toast({
          title: 'Event deleted',
          description: 'Your event has been deleted successfully',
        });
      }
    });
  };

  // Error handling
  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h3 className="font-bold">Error loading events</h3>
        <p>{error?.message || 'An unknown error occurred'}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => setFilters({...filters})}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events Explorer</h1>
        
        <CreateEventDialog onSubmit={handleCreateEvent} isCreating={createEvent.isPending} />
      </div>
      
      {/* Search and filter */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search events..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Events list */}
      <div className="space-y-4" onScroll={prefetchNextPage}>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-8 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24 mr-2" />
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))
        ) : events && events.length > 0 ? (
          // Events list
          events.map(event => (
            <Card key={event.id} className={event.isOptimistic ? 'opacity-70' : 'opacity-100'}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>{event.title}</span>
                  <span className="text-sm text-muted-foreground">{event.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                <div className="flex space-x-2 text-xs">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {new Date(event.startDate).toLocaleDateString()}
                  </span>
                  <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-md">
                    {event.status}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={event.isOptimistic}
                    onClick={() => handleUpdateEvent(event.id, { 
                      title: `${event.title} (Updated)` 
                    })}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={event.isOptimistic}
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                
                <Button variant="ghost" size="sm" asChild>
                  <a href={`/events/${event.id}`}>
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="text-center py-12 border border-dashed rounded-md border-muted-foreground/30">
            <p className="text-muted-foreground">No events found</p>
            <Button variant="outline" className="mt-4" onClick={() => setFilters({ status: 'published', limit: 10 })}>
              Reset filters
            </Button>
          </div>
        )}
        
        {/* Pagination */}
        {events && events.length > 0 && (
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              disabled={!filters.page || filters.page <= 1}
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              disabled={events.length < (filters.limit || 10)}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Suspense-enabled Events List Component -----

function EventsListWithSuspense() {
  const [filters, setFilters] = useState<EventFilters>({
    status: 'published',
    limit: 10
  });
  
  // This component relies on the parent using <Suspense>
  const { data: events } = useSuspenseEvents(filters);
  const deleteEvent = useDeleteEvent();
  
  return (
    <div className="space-y-4">
      {events && events.length > 0 ? (
        events.map(event => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteEvent.mutate(event.id)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No events found</p>
        </div>
      )}
    </div>
  );
}

// ----- Create Event Dialog -----

function CreateEventDialog({ 
  onSubmit, 
  isCreating = false 
}: { 
  onSubmit: (data: EventFormValues) => void;
  isCreating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'draft'
    }
  });
  
  function handleSubmit(data: EventFormValues) {
    onSubmit(data);
    if (!isCreating) {
      setOpen(false);
      form.reset();
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new event
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Event description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Event category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md"
                      {...field}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ----- Main Component with both implementations -----

export default function EventsExplorer() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Standard React Query Implementation</h2>
          <EventsList />
        </div>
        
        <div className="border-t pt-8">
          <h2 className="text-lg font-semibold mb-4">Suspense React Query Implementation</h2>
          <QueryProvider withSuspense={true}>
            <Suspense fallback={
              <div className="p-8 w-full flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <EventsListWithSuspense />
            </Suspense>
          </QueryProvider>
        </div>
      </div>
    </div>
  );
} 