-- Create payment_settings table
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_vpa TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  discount_code TEXT,
  discount_amount INTEGER DEFAULT 0,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_payments table
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  utr_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table (placeholder for now)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  price_range TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for these tables
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Default policies (can be refined later)
CREATE POLICY "Allow read access for all users" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON public.payment_settings FOR SELECT USING (true);
CREATE POLICY "Allow admins to update payment settings" ON public.payment_settings FOR UPDATE USING (true);  -- Note: This should be restricted to admins later
CREATE POLICY "Allow admins to insert payment settings" ON public.payment_settings FOR INSERT WITH CHECK (true);  -- Note: This should be restricted to admins later
