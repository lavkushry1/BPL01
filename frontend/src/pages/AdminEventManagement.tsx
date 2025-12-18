import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { defaultApiClient } from '@/services/api';
import { IPLMatch } from '@/services/api/eventApi';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Edit, MapPin, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Form schema for IPL match validation
const iplMatchSchema = z.object({
  id: z.string().optional(), // ID is optional for new matches
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
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      // Use the public IPL endpoint for now as it formats data correctly
      // In a real admin scenario, we might want to use /api/admin/events and map it manually
      const response = await defaultApiClient.get('/public/events/ipl');
      if (response.data.success) {
        setMatches(response.data.data.matches);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch matches from server.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleAddMatch = () => {
    setIsAddDialogOpen(true);
    form.reset();
  };

  const handleEditMatch = (match: IPLMatch) => {
    setCurrentMatch(match);
    setIsEditDialogOpen(true);

    // Extract team names from match data or title if needed
    const team1Name = match.teams?.team1?.name || match.title.split(' vs ')[0] || '';
    const team2Name = match.teams?.team2?.name || match.title.split(' vs ')[1] || '';

    form.reset({
      id: match.id,
      title: match.title,
      venue: match.venue,
      date: match.start_date.split('T')[0],
      time: match.time || '19:00',
      team1Name: team1Name,
      team1ShortName: match.teams?.team1?.shortName || team1Name.substring(0, 3).toUpperCase(),
      team2Name: team2Name,
      team2ShortName: match.teams?.team2?.shortName || team2Name.substring(0, 3).toUpperCase(),
      generalPrice: match.ticketTypes?.find(t => t.category === 'General Stand')?.price || 1000,
      generalAvailable: match.ticketTypes?.find(t => t.category === 'General Stand')?.available || 1000,
      premiumPrice: match.ticketTypes?.find(t => t.category === 'Premium Stand')?.price || 3000,
      premiumAvailable: match.ticketTypes?.find(t => t.category === 'Premium Stand')?.available || 500,
      vipPrice: match.ticketTypes?.find(t => t.category === 'VIP Box')?.price || 8000,
      vipAvailable: match.ticketTypes?.find(t => t.category === 'VIP Box')?.available || 100
    });
  };

  const handleDeleteMatch = (match: IPLMatch) => {
    setCurrentMatch(match);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitAdd = async (data: IPLMatchFormValues) => {
    try {
      // Construct the payload for the backend
      const payload = {
        title: `${data.team1Name} vs ${data.team2Name}`,
        description: `IPL match between ${data.team1Name} and ${data.team2Name}`,
        startDate: new Date(`${data.date}T${data.time}:00`).toISOString(),
        endDate: new Date(`${data.date}T${parseInt(data.time.split(':')[0]) + 3}:${data.time.split(':')[1]}:00`).toISOString(), // Approx 3 hours
        location: data.venue,
        status: 'PUBLISHED', // Auto-publish for now
        ticketCategories: [
          {
            name: "General Stand",
            price: data.generalPrice,
            totalSeats: data.generalAvailable
          },
          {
            name: "Premium Stand",
            price: data.premiumPrice,
            totalSeats: data.premiumAvailable
          },
          {
            name: "VIP Box",
            price: data.vipPrice,
            totalSeats: data.vipAvailable
          }
        ],
        imageUrl: "/placeholder.svg" // Default image
      };

      await defaultApiClient.post('/admin/events', payload);

      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "New IPL match has been added.",
      });
      fetchMatches(); // Refresh list
    } catch (error) {
      console.error('Error adding match:', error);
      toast({
        title: "Error",
        description: "Failed to add match.",
        variant: "destructive"
      });
    }
  };

  const onSubmitEdit = async (data: IPLMatchFormValues) => {
    if (!currentMatch) return;

    try {
      const payload = {
        title: `${data.team1Name} vs ${data.team2Name}`,
        description: `IPL match between ${data.team1Name} and ${data.team2Name}`,
        startDate: new Date(`${data.date}T${data.time}:00`).toISOString(),
        endDate: new Date(`${data.date}T${parseInt(data.time.split(':')[0]) + 3}:${data.time.split(':')[1]}:00`).toISOString(),
        location: data.venue,
        ticketCategories: [
          {
            name: "General Stand",
            price: data.generalPrice,
            totalSeats: data.generalAvailable
          },
          {
            name: "Premium Stand",
            price: data.premiumPrice,
            totalSeats: data.premiumAvailable
          },
          {
            name: "VIP Box",
            price: data.vipPrice,
            totalSeats: data.vipAvailable
          }
        ]
      };

      await defaultApiClient.put(`/admin/events/${currentMatch.id}`, payload);

      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "IPL match has been updated.",
      });
      fetchMatches();
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: "Error",
        description: "Failed to update match.",
        variant: "destructive"
      });
    }
  };

  const confirmDelete = async () => {
    if (currentMatch) {
      try {
        await defaultApiClient.delete(`/admin/events/${currentMatch.id}`);
        setIsDeleteDialogOpen(false);
        toast({
          title: "Success",
          description: "IPL match has been deleted.",
        });
        fetchMatches();
      } catch (error) {
        console.error('Error deleting match:', error);
        toast({
          title: "Error",
          description: "Failed to delete match.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow pt-16 pb-12 district-shell">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--district-text)]">IPL Event Management</h1>
              <p className="text-[var(--district-muted)] mt-1">Add, edit, or delete IPL matches and events</p>
            </div>
            <Button onClick={handleAddMatch} className="mt-4 md:mt-0 flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add New Match
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                  <Card key={match.id} className="overflow-hidden hover:shadow-xl transition-shadow district-panel border border-[var(--district-border)]">
                    <CardHeader className="bg-white/5 pb-2 border-b border-[var(--district-border)]">
                      <CardTitle className="text-xl text-[var(--district-text)]">{match.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                            {match.teams?.team1?.shortName || 'T1'}
                          </span>
                          <span>vs</span>
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center ml-2">
                            {match.teams?.team2?.shortName || 'T2'}
                          </span>
                        </div>
                        <div className="text-[var(--district-muted)] font-medium">
                          {new Date(match.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="flex items-center text-[var(--district-text)]">
                        <MapPin className="h-4 w-4 mr-2 text-[var(--district-accent)]" />
                        {match.venue}
                      </div>
                      <div className="flex items-center text-[var(--district-text)]">
                        <Clock className="h-4 w-4 mr-2 text-[var(--district-accent)]" />
                        {match.time}
                      </div>
                      <div className="flex items-center text-[var(--district-text)]">
                        <Tag className="h-4 w-4 mr-2 text-[var(--district-accent)]" />
                        Tickets from ₹{match.ticketTypes && match.ticketTypes.length > 0 ? Math.min(...match.ticketTypes.map(type => type.price)) : 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-[var(--district-border)] bg-white/5 px-6 py-3">
                    <Button variant="ghost" size="sm" className="text-[var(--district-text)]" onClick={() => handleEditMatch(match)}>
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
          )}
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
                      <FormLabel>Match ID (Auto-generated)</FormLabel>
                      <FormControl>
                        <Input disabled placeholder="Auto-generated" {...field} />
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
            <DialogTitle>Delete Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this match? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventManagement;
