
export interface Stadium {
  id: string;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  image_url?: string;
  ar_model_url?: string;
  created_at: string;
}

export interface Seat {
  id: string;
  stadium_id: string;
  section: string;
  row: string;
  number: string;
  price: number;
  category: 'general' | 'premium' | 'vip';
  is_available: boolean;
  created_at: string;
}
