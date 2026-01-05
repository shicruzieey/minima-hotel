-- Drop existing restrictive policies and recreate as permissive
-- Rooms
DROP POLICY IF EXISTS "Staff can manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff can view all rooms" ON public.rooms;
CREATE POLICY "Allow read access to rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow write access to rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

-- Guests
DROP POLICY IF EXISTS "Staff can manage guests" ON public.guests;
DROP POLICY IF EXISTS "Staff can view all guests" ON public.guests;
CREATE POLICY "Allow read access to guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Allow write access to guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Staff can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON public.bookings;
CREATE POLICY "Allow read access to bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow write access to bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- POS Categories
DROP POLICY IF EXISTS "Staff can manage pos categories" ON public.pos_categories;
DROP POLICY IF EXISTS "Staff can view pos categories" ON public.pos_categories;
CREATE POLICY "Allow read access to pos_categories" ON public.pos_categories FOR SELECT USING (true);
CREATE POLICY "Allow write access to pos_categories" ON public.pos_categories FOR ALL USING (true) WITH CHECK (true);

-- POS Products
DROP POLICY IF EXISTS "Staff can manage pos products" ON public.pos_products;
DROP POLICY IF EXISTS "Staff can view pos products" ON public.pos_products;
CREATE POLICY "Allow read access to pos_products" ON public.pos_products FOR SELECT USING (true);
CREATE POLICY "Allow write access to pos_products" ON public.pos_products FOR ALL USING (true) WITH CHECK (true);

-- POS Transactions
DROP POLICY IF EXISTS "Staff can manage pos transactions" ON public.pos_transactions;
DROP POLICY IF EXISTS "Staff can view pos transactions" ON public.pos_transactions;
CREATE POLICY "Allow read access to pos_transactions" ON public.pos_transactions FOR SELECT USING (true);
CREATE POLICY "Allow write access to pos_transactions" ON public.pos_transactions FOR ALL USING (true) WITH CHECK (true);

-- POS Transaction Items
DROP POLICY IF EXISTS "Staff can manage transaction items" ON public.pos_transaction_items;
DROP POLICY IF EXISTS "Staff can view transaction items" ON public.pos_transaction_items;
CREATE POLICY "Allow read access to pos_transaction_items" ON public.pos_transaction_items FOR SELECT USING (true);
CREATE POLICY "Allow write access to pos_transaction_items" ON public.pos_transaction_items FOR ALL USING (true) WITH CHECK (true);

-- Inventory
DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can view inventory" ON public.inventory;
CREATE POLICY "Allow read access to inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Allow write access to inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);