
export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  seats: string[]; // Array of seat IDs
  total_amount: number;
  discount_applied?: number;
  final_amount: number;
  booking_date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_id?: string;
  created_at: string;
}

export interface DeliveryDetails {
  id: string;
  booking_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  created_at: string;
}
