import { useState, useEffect } from 'react';
import { getEvents, Event } from '../../services/api/eventApi';

interface EventsListProps {
  categoryId?: string;
  limit?: number;
}

const EventsList = ({ categoryId, limit = 10 }: EventsListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents({
          category: categoryId,
          limit
        });
        setEvents(response.data.items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [categoryId, limit]);

  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-center py-10">No events found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div 
          key={event.id} 
          className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
        >
          {event.imageUrl && (
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-48 object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
              <span className="text-sm font-semibold">{event.location}</span>
            </div>
            <div className="mt-4">
              <a 
                href={`/events/${event.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                View Details
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventsList; 