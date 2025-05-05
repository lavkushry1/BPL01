import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { IPLMatch } from '@/services/api/eventApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, Tag } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form schema for IPL match validation
const iplMatchSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  venue: z.string().min(1, "Venue is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  team1Name: z.string().min(1, "Team 1 name is required"),
  team1ShortName: z.string().min(1, "Team 1 short name is required"),
  team2Name: z.string().min(1, "Team 2 name is required"),
  team2ShortName: z.string().min(1, "Team 2 short name is required"),
  generalPrice: z.coerce.number().min(100, "Price must be at least ₹100"),
  generalAvailable: z.coerce.number().min(1, "Available tickets must be at least 1"),
  premiumPrice: z.coerce.number().min(100, "Price must be at least ₹100"),
  premiumAvailable: z.coerce.number().min(1, "Available tickets must be at least 1"),
  vipPrice: z.coerce.number().min(100, "Price must be at least ₹100"),
  vipAvailable: z.coerce.number().min(1, "Available tickets must be at least 1"),
});

type IPLMatchFormValues = z.infer<typeof iplMatchSchema>;

const AdminEventManagement = () => {
  const [matches, setMatches] = useState<IPLMatch[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<IPLMatch | null>(null);

  const form = useForm<IPLMatchFormValues>({
    resolver: zodResolver(iplMatchSchema),
    defaultValues: {
      id: '',
      title: '',
      venue: '',
      date: '',
      time: '',
      team1Name: '',
      team1ShortName: '',
      team2Name: '',
      team2ShortName: '',
      generalPrice: 1000,
      generalAvailable: 1000,
      premiumPrice: 3000,
      premiumAvailable: 500,
      vipPrice: 8000,
      vipAvailable: 100
    }
  });

  const handleAddMatch = () => {
    setIsAddDialogOpen(true);
    form.reset();
  };

  const handleEditMatch = (match: IPLMatch) => {
    setCurrentMatch(match);
    setIsEditDialogOpen(true);
    form.reset({
      id: match.id,
      title: match.title,
      venue: match.venue,
      date: match.date,
      time: match.time,
      team1Name: match.teams.team1.name,
      team1ShortName: match.teams.team1.shortName,
      team2Name: match.teams.team2.name,
      team2ShortName: match.teams.team2.shortName,
      generalPrice: match.ticketTypes[0].price,
      generalAvailable: match.ticketTypes[0].available,
      premiumPrice: match.ticketTypes[1].price,
      premiumAvailable: match.ticketTypes[1].available,
      vipPrice: match.ticketTypes[2].price,
      vipAvailable: match.ticketTypes[2].available
    });
  };

  const handleDeleteMatch = (match: IPLMatch) => {
    setCurrentMatch(match);
    setIsDeleteDialogOpen(true);
  };

  // Save events to localStorage for public display
  const saveToLocalStorage = (eventData: IPLMatch[]) => {
    try {
      const storageKey = 'admin_created_events';

      // Generate a more reliable UUID-like string
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Convert IPL match format to the Event format expected by the Events page
      const eventsForStorage = eventData.map(match => {
        // Generate a truly unique ID using UUID approach
        const uniqueId = generateUUID();

        return {
          id: uniqueId,
          title: `${match.teams.team1.name} vs ${match.teams.team2.name}`,
          description: `IPL match between ${match.teams.team1.name} and ${match.teams.team2.name}`,
          start_date: match.date,
          location: match.venue,
          organizer_id: 'admin',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: 'Cricket',
          teams: match.teams,
          venue: match.venue,
          time: match.time,
          ticket_types: match.ticketTypes.map(tt => ({
            id: `${uniqueId}-${tt.category.toLowerCase().replace(/\s+/g, '-')}`,
            name: tt.category,
            price: tt.price,
            quantity: tt.available + 100, // Total capacity is more than available
            available: tt.available
          })),
          images: [{
            id: `${uniqueId}-img1`,
            url: (match.posterImage || (match.images && match.images.length > 0 ? match.images[0].url : '/placeholder.svg')),
            alt_text: `${match.teams.team1.name} vs ${match.teams.team2.name}`,
            is_featured: true
          }],
          poster_image: match.posterImage || (match.images && match.images.length > 0 ? match.images[0].url : '/placeholder.svg'),
          source: 'admin', // Explicitly mark as admin-created
          original_id: match.id // Store the original ID for reference
        };
      });

      localStorage.setItem(storageKey, JSON.stringify(eventsForStorage));

      // Dispatch both a storage event and a custom event for better cross-component communication
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('admin-events-updated'));

      console.log('Saved admin events to localStorage:', eventsForStorage.length);

      toast({
        title: "Success",
        description: `${eventsForStorage.length} events saved and will appear on the public page`,
      });
    } catch (e) {
      console.error('Error saving admin events to localStorage:', e);
      toast({
        title: "Error",
        description: "Failed to save events to localStorage. Events may not appear on the public page.",
        variant: "destructive"
      });
    }
  };

  const onSubmitAdd = (data: IPLMatchFormValues) => {
    // Generate a unique UUID for the match
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const uniqueId = generateUUID();

    const newMatch: IPLMatch = {
      id: uniqueId,
      title: data.title,
      description: `IPL match between ${data.team1Name} and ${data.team2Name}`,
      category: "IPL",
      teams: {
        team1: {
          name: data.team1Name,
          shortName: data.team1ShortName,
          logo: "/placeholder.svg"
        },
        team2: {
          name: data.team2Name,
          shortName: data.team2ShortName,
          logo: "/placeholder.svg"
        }
      },
      venue: data.venue,
      date: data.date,
      time: data.time,
      ticketTypes: [
        {
          category: "General Stand",
          price: data.generalPrice,
          available: data.generalAvailable,
          capacity: data.generalAvailable * 2
        },
        {
          category: "Premium Stand",
          price: data.premiumPrice,
          available: data.premiumAvailable,
          capacity: data.premiumAvailable * 2
        },
        {
          category: "VIP Box",
          price: data.vipPrice,
          available: data.vipAvailable,
          capacity: data.vipAvailable * 2
        }
      ],
      images: [{
        id: `${uniqueId}-img1`,
        url: "/placeholder.svg",
        alt_text: `${data.team1Name} vs ${data.team2Name}`,
        is_featured: true
      }],
      status: 'draft',
      start_date: data.date,
      organizer_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedMatches = [...matches, newMatch];
    setMatches(updatedMatches);

    // Save to localStorage for public display
    saveToLocalStorage(updatedMatches);

    setIsAddDialogOpen(false);
    toast({
      title: "Success",
      description: "New IPL match has been added. It is now visible on the public events page.",
    });
  };

  const onSubmitEdit = (data: IPLMatchFormValues) => {
    if (!currentMatch) return;

    // Generate a unique UUID for the match
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Generate a new unique ID
    const uniqueId = generateUUID();

    const updatedMatch: IPLMatch = {
      id: uniqueId,
      title: data.title,
      description: `IPL match between ${data.team1Name} and ${data.team2Name}`,
      category: "IPL",
      teams: {
        team1: {
          name: data.team1Name,
          shortName: data.team1ShortName,
          logo: "/placeholder.svg"
        },
        team2: {
          name: data.team2Name,
          shortName: data.team2ShortName,
          logo: "/placeholder.svg"
        }
      },
      venue: data.venue,
      date: data.date,
      time: data.time,
      ticketTypes: [
        {
          category: "General Stand",
          price: data.generalPrice,
          available: data.generalAvailable,
          capacity: data.generalAvailable * 2
        },
        {
          category: "Premium Stand",
          price: data.premiumPrice,
          available: data.premiumAvailable,
          capacity: data.premiumAvailable * 2
        },
        {
          category: "VIP Box",
          price: data.vipPrice,
          available: data.vipAvailable,
          capacity: data.vipAvailable * 2
        }
      ],
      images: [{
        id: `${uniqueId}-img1`,
        url: "/placeholder.svg",
        alt_text: `${data.team1Name} vs ${data.team2Name}`,
        is_featured: true
      }],
      status: 'draft',
      start_date: data.date,
      organizer_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Replace the edited match in the array
    const updatedMatches = matches.map(match =>
      match.id === currentMatch.id ? updatedMatch : match
    );

    setMatches(updatedMatches);

    // Save to localStorage for public display
    saveToLocalStorage(updatedMatches);

    setIsEditDialogOpen(false);
    toast({
      title: "Success",
      description: "IPL match has been updated. Changes are visible on the public events page.",
    });
  };

  const confirmDelete = () => {
    if (currentMatch) {
      const updatedMatches = matches.filter(match => match.id !== currentMatch.id);
      setMatches(updatedMatches);

      // Save the updated list (without the deleted match) to localStorage
      saveToLocalStorage(updatedMatches);

      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "IPL match has been deleted. It has been removed from the public events page.",
      });
    }
  };

  // Load existing admin events from localStorage on component mount
  useEffect(() => {
    try {
      // First, load the default IPL matches if no localStorage data is available
      const initialMatches = [];
      setMatches(initialMatches);

      // Then try to load from localStorage
      const storageKey = 'admin_created_events';
      const savedEventsJson = localStorage.getItem(storageKey);

      if (savedEventsJson) {
        try {
          const savedEvents = JSON.parse(savedEventsJson);

          if (Array.isArray(savedEvents) && savedEvents.length > 0) {
            // Convert stored events back to IPLMatch format
            const convertedMatches: IPLMatch[] = savedEvents.map((event: any) => {
              // Verify that this is an event with the expected properties
              if (!event.id || !event.title) {
                console.warn('Found invalid event in localStorage:', event);
                return null;
              }

              // Create a proper IPLMatch object
              const match: IPLMatch = {
                id: event.id,
                title: event.title,
                description: event.description || '',
                category: event.category || 'Cricket',
                venue: event.venue || event.location || '',
                date: event.start_date || event.date || new Date().toISOString().split('T')[0],
                time: event.time || '19:00',
                teams: event.teams || {
                  team1: { name: 'Team 1', shortName: 'T1', logo: '/placeholder.svg' },
                  team2: { name: 'Team 2', shortName: 'T2', logo: '/placeholder.svg' }
                },
                ticketTypes: (event.ticket_types || []).map((tt: any) => ({
                  category: tt.name || 'General',
                  price: tt.price || 1000,
                  available: tt.available || 100,
                  capacity: tt.quantity || tt.available * 2 || 200
                })),
                images: event.images || [{
                  id: `${event.id}-img1`,
                  url: event.poster_image || (event.images && event.images.length > 0 ? event.images[0].url : '/placeholder.svg'),
                  alt_text: `${event.teams?.team1?.name || 'Team 1'} vs ${event.teams?.team2?.name || 'Team 2'}`,
                  is_featured: true
                }],
                start_date: event.start_date || event.date || new Date().toISOString().split('T')[0],
                organizer_id: event.organizer_id || '',
                status: event.status || 'draft',
                created_at: event.created_at || new Date().toISOString(),
                updated_at: event.updated_at || new Date().toISOString(),
              };

              return match;
            }).filter(Boolean) as IPLMatch[]; // Remove any null entries

            if (convertedMatches.length > 0) {
              console.log('Loaded admin events from localStorage:', convertedMatches.length);
              setMatches(convertedMatches);

              // Save back to localStorage to ensure proper format for next load
              saveToLocalStorage(convertedMatches);
            }
          }
        } catch (e) {
          console.error('Error parsing saved events from localStorage:', e);

          // If we fail to load from localStorage, ensure we save the default matches
          saveToLocalStorage(initialMatches);
        }
      } else {
        // If no events in localStorage, initialize with default matches
        console.log('No saved events found, initializing with default matches');
        saveToLocalStorage(initialMatches);
      }
    } catch (e) {
      console.error('Error in useEffect:', e);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow bg-gray-50 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IPL Event Management</h1>
              <p className="text-gray-600 mt-1">Add, edit, or delete IPL matches and events</p>
            </div>
            <Button onClick={handleAddMatch} className="mt-4 md:mt-0 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add New Match
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-primary/5 pb-2">
                  <CardTitle className="text-xl">{match.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                          {match.teams.team1.shortName}
                        </span>
                        <span>vs</span>
                        <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center ml-2">
                          {match.teams.team2.shortName}
                        </span>
                      </div>
                      <div className="text-gray-500 font-medium">
                        {new Date(match.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {match.venue}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {match.time}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Tag className="h-4 w-4 mr-2 text-gray-400" />
                      Tickets from ₹{Math.min(...match.ticketTypes.map(type => type.price))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-3">
                  <Button variant="ghost" size="sm" onClick={() => handleEditMatch(match)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMatch(match)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Add Match Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New IPL Match</DialogTitle>
            <DialogDescription>
              Enter the details for the new IPL match.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ipl-2025-05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IPL 2025: Match 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Wankhede Stadium, Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium mb-3">Team Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="team1Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1 Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mumbai Indians" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team1ShortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1 Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2 Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chennai Super Kings" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team2ShortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2 Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CSK" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium mb-3">Ticket Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="generalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Stand Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Stand Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="premiumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Stand Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="premiumAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Stand Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vipPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIP Box Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vipAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIP Box Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Match
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit IPL Match</DialogTitle>
            <DialogDescription>
              Update the details for this IPL match.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match ID</FormLabel>
                      <FormControl>
                        <Input disabled placeholder="e.g., ipl-2025-05" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., IPL 2025: Match 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Wankhede Stadium, Mumbai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium mb-3">Team Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="team1Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1 Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mumbai Indians" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team1ShortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 1 Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team2Name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2 Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chennai Super Kings" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="team2ShortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team 2 Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CSK" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium mb-3">Ticket Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="generalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Stand Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Stand Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="premiumPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Stand Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="premiumAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium Stand Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vipPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIP Box Price (₹)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vipAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIP Box Available</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Match
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this match? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-3 rounded-md border border-red-100">
            <p className="text-sm font-medium text-red-800">
              {currentMatch?.title}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {currentMatch?.venue} - {new Date(currentMatch?.date || '').toLocaleDateString()}
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Match
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminEventManagement;
