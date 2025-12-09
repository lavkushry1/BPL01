import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/styles/ThemeProvider';
import { Search, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

// Define types for the carousel events
interface CarouselEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
}

interface HeroProps {
  events?: CarouselEvent[];
  isLoading?: boolean;
}

// Define search form schema
const searchFormSchema = z.object({
  query: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export const Hero: React.FC<HeroProps> = ({ 
  events = [], 
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { t } = useTranslation();
  
  // Initialize form with React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setError,
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: '',
      date: '',
      location: '',
    }
  });
  
  // Default placeholder events for demo purposes
  const defaultEvents: CarouselEvent[] = [
    {
      id: '1',
      title: 'Mumbai Indians vs Chennai Super Kings',
      description: 'Experience the intense rivalry at Wankhede Stadium!',
      imageUrl: '/assets/events/mi-csk.jpg',
      date: '2023-05-15',
    },
    {
      id: '2',
      title: 'Royal Challengers Bangalore vs Kolkata Knight Riders',
      description: 'Watch the explosive batting display at Chinnaswamy Stadium!',
      imageUrl: '/assets/events/rcb-kkr.jpg',
      date: '2023-05-18',
    },
    {
      id: '3',
      title: 'Delhi Capitals vs Rajasthan Royals',
      description: 'Witness the clash of titans at Arun Jaitley Stadium!',
      imageUrl: '/assets/events/dc-rr.jpg',
      date: '2023-05-20',
    },
  ];

  // Use provided events or defaults
  const displayEvents = events.length > 0 ? events : defaultEvents;
  
  useEffect(() => {
    // Auto rotate carousel every 5 seconds
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeIndex, displayEvents.length]);

  const handleNextSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const nextIndex = (activeIndex + 1) % displayEvents.length;
    
    setTimeout(() => {
      setActiveIndex(nextIndex);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrevSlide = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const prevIndex = (activeIndex - 1 + displayEvents.length) % displayEvents.length;
    
    setTimeout(() => {
      setActiveIndex(prevIndex);
      setIsTransitioning(false);
    }, 300);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning) return;
    setActiveIndex(index);
  };

  const handleExploreEvent = () => {
    const currentEvent = events[activeIndex];
    if (currentEvent && currentEvent.id) {
      console.log(`Navigating to event: /events/${currentEvent.id}`);
      navigate(`/events/${currentEvent.id}`);
    } else {
      console.error("Cannot navigate: Event ID is missing");
      try {
        const toast = require('@/hooks/use-toast').toast;
        toast({
          title: "Error",
          description: "Cannot navigate to event details: Event ID is missing.",
          variant: "destructive"
        });
      } catch (e) {
        alert("Cannot navigate to event details: Event ID is missing.");
      }
    }
  };

  const navigateToEvents = () => {
    navigate('/events');
  };
  
  // Handle search form submission
  const onSubmit = async (data: SearchFormValues) => {
    setIsSearching(true);
    
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      if (data.query) params.append('q', data.query);
      if (data.date) params.append('date', data.date);
      if (data.location) params.append('location', data.location);
      
      // Navigate to events page with search params
      navigate({
        pathname: '/events',
        search: params.toString()
      });
      
    } catch (error) {
      console.error('Search error:', error);
      
      if (error instanceof Error) {
        setError('root', {
          type: 'server',
          message: error.message
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[500px] bg-neutral-100 rounded-lg my-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-primary-800 to-primary-900 text-white overflow-hidden">
      {/* Background dots pattern */}
      <div className="absolute inset-0 bg-[url('/dots-pattern.svg')] opacity-20"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {t('hero.title', 'Discover, Book, and Experience')}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8">
            {t('hero.subtitle', 'Find the most exciting events happening near you')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/events">
              <Button className="bg-white text-primary hover:bg-white/90 px-6 py-2.5 text-lg font-semibold focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary">
                {t('hero.browse', 'Browse Events')}
              </Button>
            </Link>
            
            <Link to="/ipl-tickets">
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 px-6 py-2.5 text-lg font-semibold relative focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
              >
                {t('hero.iplTickets', 'IPL 2025 Tickets')}
                <Badge className="absolute -top-3 -right-3 bg-red-500 text-white">
                  NEW
                </Badge>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-6 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-white/60" />
                <Input 
                  {...register('query')}
                  placeholder={t('hero.search', 'Search events')}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-primary-300 focus-visible:ring-offset-0 h-12"
                  aria-invalid={errors.query ? 'true' : 'false'}
                />
                {errors.query && (
                  <div className="text-red-300 text-xs mt-1">
                    {String(errors.query.message)}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-white/60" />
                <Input 
                  {...register('date')}
                  placeholder={t('hero.when', 'When')}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-primary-300 focus-visible:ring-offset-0 h-12"
                  type="date"
                  aria-invalid={errors.date ? 'true' : 'false'}
                />
                {errors.date && (
                  <div className="text-red-300 text-xs mt-1">
                    {String(errors.date.message)}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/60" />
                <Input 
                  {...register('location')}
                  placeholder={t('hero.where', 'Where')}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-primary-300 focus-visible:ring-offset-0 h-12"
                  aria-invalid={errors.location ? 'true' : 'false'}
                />
                {errors.location && (
                  <div className="text-red-300 text-xs mt-1">
                    {String(errors.location.message)}
                  </div>
                )}
              </div>
              <Button 
                type="submit"
                className="h-12 px-6 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                disabled={isSearching}
              >
                {isSearching ? t('hero.searching', 'Searching...') : t('hero.find', 'Find Events')}
              </Button>
            </div>
            
            {/* Form-level error */}
            {errors.root && (
              <div className="mt-2 text-red-300 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{String(errors.root.message)}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
