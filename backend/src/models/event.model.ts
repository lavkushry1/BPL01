
export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_id?: string;
  image_url?: string;
  price_range?: string;
  categories?: string[];
  seats_available: number;
  total_seats: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}
