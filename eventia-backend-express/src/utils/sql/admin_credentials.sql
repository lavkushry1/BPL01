-- Reset admin credentials
DELETE FROM public.admins WHERE email = 'admin@example.com';

-- Insert admin with hashed password (admin123)
INSERT INTO public.admins (email, password_hash)
VALUES (
  'admin@example.com',
  '$2a$10$xJwJ5/vKPP9DPX4JqVDQjO4R.QkUmrCs.QjU2o/RPzQk1xNu9cKFi'
);

-- Create or update default UPI settings
INSERT INTO public.upi_settings (upivpa, discountamount, isactive, updated_at)
VALUES (
  'eventia@upi',
  100,
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET upivpa = 'eventia@upi',
    discountamount = 100,
    isactive = true,
    updated_at = NOW();

-- Function for incrementing counts (used for discount usage tracking)
CREATE OR REPLACE FUNCTION increment(row_id uuid)
RETURNS integer
LANGUAGE sql
AS $$
  UPDATE discounts
  SET uses_count = uses_count + 1
  WHERE id = row_id
  RETURNING uses_count;
$$;
