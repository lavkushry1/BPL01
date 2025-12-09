import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, MoreVertical, PlusCircle, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminEventForm from '@/components/admin/AdminEventForm';
import { fetchAdminEvents, deleteEvent, updateEvent } from '@/services/api/adminEventApi';
import { Event } from '@/services/api/eventApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const AdminEventsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  
  const queryClient = useQueryClient();
  
  // Load local events on component mount
  useEffect(() => {
    const storageKey = 'admin_created_events';
    const storedEvents = localStorage.getItem(storageKey);
    if (storedEvents) {
      try {
        const parsedEvents = JSON.parse(storedEvents);
        setLocalEvents(parsedEvents);
      } catch (e) {
        console.error('Error parsing stored events:', e);
      }
    }
  }, []);
  
  // Fetch events
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => fetchAdminEvents(),
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<any> }) => updateEvent(id, data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Event updated successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
      console.error('Update error:', error);
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Event deleted successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      setDeletingEventId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
      console.error('Delete error:', error);
    },
  });
  
  // Handle edit click
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
  };
  
  // Handle delete click
  const handleDeleteClick = (eventId: string) => {
    setDeletingEventId(eventId);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (deletingEventId) {
      deleteMutation.mutate(deletingEventId);
    }
  };
  
  // Handle form close
  const handleFormClose = () => {
    setIsCreateDialogOpen(false);
    setEditingEvent(null);
  };
  
  // Handle publish click - make event visible on public page
  const handlePublishClick = async (event: Event) => {
    // Update event status to published
    const updatedEvent = {
      ...event,
      status: 'published' as const
    };
    
    try {
      // Update via API if possible
      await updateMutation.mutateAsync({ 
        id: event.id, 
        data: { status: 'published' } 
      });
      
      // Update local storage regardless of API success/failure
      const storageKey = 'admin_created_events';
      const storedEvents = localStorage.getItem(storageKey);
      let events: Event[] = [];
      
      if (storedEvents) {
        events = JSON.parse(storedEvents);
      }
      
      // Check if event exists and update it
      const eventIndex = events.findIndex(e => e.id === event.id);
      if (eventIndex >= 0) {
        events[eventIndex] = { ...events[eventIndex], ...updatedEvent };
      } else {
        events.push(updatedEvent);
      }
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(events));
      setLocalEvents(events);
      
      toast({
        title: 'Success',
        description: 'Event published and now visible on public page',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({
        title: 'Note',
        description: 'Event published locally but API update failed',
        variant: 'default',
      });
    }
  };
  
  // Combine API events and local events
  const allEvents = useMemo(() => {
    const apiEvents = data?.data?.events || [];
    
    // Create a map to deduplicate events by ID
    const eventMap = new Map();
    
    // Add API events to the map
    apiEvents.forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Add or override with local events
    localEvents.forEach(event => {
      eventMap.set(event.id, event);
    });
    
    // Convert map back to array
    return Array.from(eventMap.values());
  }, [data?.data?.events, localEvents]);
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Events</h1>
          
          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            
            <Button
              onClick={() => window.open('/events', '_blank')}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              View Public Page
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <AdminEventForm onClose={handleFormClose} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p>Error loading events. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        ) : allEvents?.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first event</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" /> 
              Create Event
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvents?.map((event: Event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.category}</TableCell>
                    <TableCell>{formatDate(event.start_date)}</TableCell>
                    <TableCell>{event.venue || event.location}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {event.status === 'published' ? (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="View on public page"
                            onClick={() => window.open(`/events/${event.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            title="Publish event"
                            onClick={() => handlePublishClick(event)}
                          >
                            <Eye className="h-4 w-4 text-gray-400" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(event)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {event.status !== 'published' && (
                              <DropdownMenuItem onClick={() => handlePublishClick(event)}>
                                <Eye className="h-4 w-4 mr-2" /> Publish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(event.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Event: {editingEvent.title}</DialogTitle>
            </DialogHeader>
            <AdminEventForm event={editingEvent} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEventId} onOpenChange={(open) => !open && setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminEventsPage; 