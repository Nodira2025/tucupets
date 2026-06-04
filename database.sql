-- SQL Schema for TUCUPETS (Uber for Pets)
-- Suitable for importing directly into Supabase SQL Editor

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TYPE user_role AS ENUM ('owner', 'driver', 'admin');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'owner' NOT NULL,
  is_online BOOLEAN DEFAULT false NOT NULL,
  rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00)
);

-- Enable Row Level Security (RLS) for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'TucuUser'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'owner')
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
  type TEXT NOT NULL, -- 'dog', 'cat', 'bird', 'other'
  size TEXT NOT NULL, -- 'small', 'medium', 'large'
  special_notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can see their own pets." 
  ON pets FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can manage their own pets." 
  ON pets FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Drivers can view pets assigned to rides."
  ON pets FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE (rides.driver_id = auth.uid() OR rides.owner_id = auth.uid()) 
      AND rides.pet_id = pets.id
    )
  );


-- 3. Rides Table
CREATE TYPE ride_status AS ENUM ('requested', 'accepted', 'arrived', 'started', 'completed', 'cancelled');
CREATE TYPE service_class AS ENUM ('standard', 'xl', 'vet');

CREATE TABLE rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE RESTRICT NOT NULL,
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rides." 
  ON rides FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = driver_id);

CREATE POLICY "Owners can request rides." 
  ON rides FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Drivers can see requested rides." 
  ON rides FOR SELECT USING (status = 'requested' OR auth.uid() = driver_id);

CREATE POLICY "Drivers and owners can update active rides." 
  ON rides FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = driver_id);


-- 4. Messages Table (Real-time in-app chat)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their active rides." 
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = messages.ride_id 
      AND (rides.owner_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can post messages in their active rides." 
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_id 
      AND (rides.owner_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );


-- 5. Driver Locations Table (Real-time tracking)
CREATE TABLE driver_locations (
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view driver locations." 
  ON driver_locations FOR SELECT USING (true);

CREATE POLICY "Drivers can update their own location." 
  ON driver_locations FOR ALL USING (auth.uid() = driver_id);

-- Turn on Realtime for Rides and Messages tables to enable instant updates on screens
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
