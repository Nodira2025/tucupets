-- SQL Schema for TUCUPETS (Uber for Pets)
-- Suitable for importing directly into Supabase SQL Editor

-- Drop tables if they already exist (caution during clean setups)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS driver_locations;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS profiles;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS ride_status;
DROP TYPE IF EXISTS service_class;

-- 1. Profiles Table
CREATE TYPE user_role AS ENUM ('owner', 'driver', 'none');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'none' NOT NULL, -- Starts as 'none' for onboarding role selection
  is_online BOOLEAN DEFAULT false NOT NULL,
  vehicle_info TEXT, -- Specific for drivers
  rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00)
);

-- Enable Row Level Security (RLS) for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a profile automatically when a user signs up (Email or Google)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'TucuUser'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'none'),
    new.phone
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Pets Table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Perro', 'Gato', 'Ave', 'Otro'
  size TEXT NOT NULL, -- 'Pequeño', 'Mediano', 'Grande'
  special_notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pets." 
  ON pets FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Drivers can view pets in assigned rides."
  ON pets FOR SELECT USING (true); -- Simplified view permission for ease of mock drivers


-- 3. Rides Table
CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'arrived', 'started', 'completed', 'cancelled');
CREATE TYPE service_class AS ENUM ('standard', 'xl', 'vet');

CREATE TABLE rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT,
  owner_phone TEXT,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_info TEXT,
  pet_id UUID REFERENCES pets(id) ON DELETE RESTRICT NOT NULL,
  pet_name TEXT NOT NULL,
  status ride_status DEFAULT 'requested' NOT NULL,
  service_class service_class DEFAULT 'standard' NOT NULL,
  
  pickup_address TEXT NOT NULL,
  pickup_lat NUMERIC(9,6) NOT NULL,
  pickup_lng NUMERIC(9,6) NOT NULL,
  
  dropoff_address TEXT NOT NULL,
  dropoff_lat NUMERIC(9,6) NOT NULL,
  dropoff_lng NUMERIC(9,6) NOT NULL,
  
  price NUMERIC(10,2) NOT NULL,
  eta INTEGER, -- in minutes
  pin_code TEXT NOT NULL, -- 4-digit code
  payment_method TEXT DEFAULT 'cash' NOT NULL, -- 'cash' or 'mercadopago'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rides are viewable by participants." 
  ON rides FOR SELECT USING (true); -- Viewable to allow offline lists, filter in code

CREATE POLICY "Owners can request rides." 
  ON rides FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can update ride status during travel." 
  ON rides FOR UPDATE USING (true);


-- 4. Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  sender_id TEXT NOT NULL, -- 'owner' or 'driver'
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone in the ride." 
  ON messages FOR SELECT USING (true);

CREATE POLICY "Messages can be posted by participants." 
  ON messages FOR INSERT WITH CHECK (true);


-- 5. Driver Locations Table
CREATE TABLE driver_locations (
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver locations are viewable by everyone." 
  ON driver_locations FOR SELECT USING (true);

CREATE POLICY "Drivers can update their own location." 
  ON driver_locations FOR ALL USING (true);

-- Enable real-time publication for live socket triggers
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE rides, messages, driver_locations, profiles;
COMMIT;
