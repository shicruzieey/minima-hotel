-- Create enum types
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE public.room_type AS ENUM ('standard', 'deluxe', 'suite', 'presidential');
CREATE TYPE public.room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'refunded', 'cancelled');
CREATE TYPE public.inventory_category AS ENUM ('housekeeping', 'amenities', 'f_and_b', 'maintenance');

-- Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL UNIQUE,
  room_type room_type NOT NULL DEFAULT 'standard',
  status room_status NOT NULL DEFAULT 'available',
  floor INTEGER NOT NULL DEFAULT 1,
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  max_guests INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  id_type TEXT,
  id_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS Categories
CREATE TABLE public.pos_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS Products
CREATE TABLE public.pos_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.pos_categories(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS Transactions
CREATE TABLE public.pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- POS Transaction Items
CREATE TABLE public.pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.pos_products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category inventory_category NOT NULL DEFAULT 'housekeeping',
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (staff)
CREATE POLICY "Staff can view all rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage rooms" ON public.rooms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view all guests" ON public.guests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage guests" ON public.guests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage bookings" ON public.bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view pos categories" ON public.pos_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage pos categories" ON public.pos_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view pos products" ON public.pos_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage pos products" ON public.pos_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view pos transactions" ON public.pos_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage pos transactions" ON public.pos_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view transaction items" ON public.pos_transaction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage transaction items" ON public.pos_transaction_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pos_products_updated_at BEFORE UPDATE ON public.pos_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate booking number function
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number = 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.generate_booking_number();

-- Generate transaction number function
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.transaction_number = 'TX' || TO_CHAR(NOW(), 'YYYYMMDDHH24MI') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_number BEFORE INSERT ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_number();