import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Ticket, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleExploreEvents = () => {
    navigate('/events');
  };

  // Featured events (would come from an API in a real app)
  const featuredEvents = [
    {
      id: '1',
      title: 'Summer Music Festival',
      date: 'June 15-18, 2023',
      location: 'Central Park, NY',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      id: '2',
      title: 'Tech Conference 2023',
      date: 'July 5-8, 2023',
      location: 'Convention Center, SF',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      id: '3',
      title: 'International Food Festival',
      date: 'August 12-14, 2023',
      location: 'Downtown Plaza, Chicago',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300&h=200'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero section */}
      <div className="py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Your Next Experience Awaits
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover and book tickets for the most exciting events happening near you. No account required.
        </p>
        <Button 
          onClick={handleExploreEvents} 
          size="lg" 
          className="gap-2"
        >
          <Calendar className="h-5 w-5" />
          Explore Events
        </Button>
      </div>

      {/* Featured events */}
      <div className="my-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Events</h2>
          <Button variant="link" onClick={handleExploreEvents} className="gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map(event => (
            <div key={event.id} className="rounded-lg border overflow-hidden group hover:border-primary transition-colors">
              <div className="h-48 overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold">{event.title}</h3>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Ticket className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="my-16 bg-muted/50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">1</div>
            <h3 className="font-bold mb-2">Browse Events</h3>
            <p className="text-muted-foreground">Find events you're interested in from our wide selection.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">2</div>
            <h3 className="font-bold mb-2">Select Tickets</h3>
            <p className="text-muted-foreground">Choose your preferred tickets and seating options.</p>
          </div>
          <div className="text-center">
            <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">3</div>
            <h3 className="font-bold mb-2">Checkout & Enjoy</h3>
            <p className="text-muted-foreground">Complete your purchase and get ready for an amazing experience!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 