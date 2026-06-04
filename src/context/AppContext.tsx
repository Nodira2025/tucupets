import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export interface Pet {
  id: string;
  name: string;
  type: string; // 'Perro' | 'Gato' | 'Ave' | 'Otro'
  size: string; // 'Pequeño' | 'Mediano' | 'Grande'
  specialNotes: string;
  photoUrl: string;
}

export interface UserProfile {
  fullName: string;
  phone: string;
  role: 'owner' | 'driver' | 'none';
  vehicleInfo?: string;
  avatar: string;
}

export interface Ride {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string;
  driverId?: string;
  driverName?: string;
  driverRating?: number;
  driverPhone?: string;
  vehicleInfo?: string;
  petId: string;
  petName: string;
  status: 'requested' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
  serviceClass: 'standard' | 'xl' | 'vet';
  pickupAddress: string;
  pickupCoords: [number, number];
  dropoffAddress: string;
  dropoffCoords: [number, number];
  price: number;
  eta: number;
  createdAt: string;
  pinCode: string; // 4-digit safety code
  paymentMethod: 'cash' | 'mercadopago';
}

export interface Message {
  id: string;
  rideId: string;
  senderId: 'owner' | 'driver';
  senderName: string;
  message: string;
  createdAt: string;
}

interface AppContextType {
  userRole: 'owner' | 'driver' | 'none';
  userProfile: UserProfile | null;
  pets: Pet[];
  rides: Ride[];
  activeRide: Ride | null;
  chatMessages: Message[];
  driverOnline: boolean;
  driverLocation: [number, number];
  driverEarnings: number;
  driverRidesCompleted: number;
  driverWhatsapp: boolean;
  useRealGPS: boolean;
  session: Session | null;
  user: User | null;
  loading: boolean;
  
  selectRole: (role: 'owner' | 'driver' | 'none') => void;
  registerUser: (profile: UserProfile) => Promise<void>;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  requestRide: (
    petId: string, 
    serviceClass: Ride['serviceClass'], 
    pickupAddr: string, 
    dropoffAddr: string,
    paymentMethod: Ride['paymentMethod']
  ) => Promise<void>;
  cancelRide: () => Promise<void>;
  acceptRide: (rideId: string) => Promise<void>;
  verifyRidePin: (pin: string) => Promise<boolean>;
  advanceRideStatus: () => Promise<void>;
  sendChatMessage: (msg: string, sender: 'owner' | 'driver') => Promise<void>;
  toggleDriverOnline: () => void;
  toggleDriverWhatsapp: () => void;
  toggleUseRealGPS: () => void;
  
  // Auth Triggers
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  loginWithGoogle: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TUCUMAN_COORDS: [number, number] = [-26.8241, -65.2226];

const mapDbRideToModel = (r: any): Ride => ({
  id: r.id,
  ownerId: r.owner_id,
  ownerName: r.owner_name,
  ownerPhone: r.owner_phone,
  driverId: r.driver_id,
  driverName: r.driver_name,
  driverPhone: r.driver_phone,
  vehicleInfo: r.vehicle_info,
  petId: r.pet_id,
  petName: r.pet_name,
  status: r.status,
  serviceClass: r.service_class,
  pickupAddress: r.pickup_address,
  pickupCoords: [Number(r.pickup_lat), Number(r.pickup_lng)],
  dropoffAddress: r.dropoff_address,
  dropoffCoords: [Number(r.dropoff_lat), Number(r.dropoff_lng)],
  price: Number(r.price),
  eta: r.eta,
  createdAt: r.created_at,
  pinCode: r.pin_code,
  paymentMethod: r.payment_method as any
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App domain states
  const [userRole, setUserRole] = useState<'owner' | 'driver' | 'none'>('none');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // Driver metrics
  const [driverOnline, setDriverOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState<[number, number]>(TUCUMAN_COORDS);
  const [driverEarnings, setDriverEarnings] = useState(0);
  const [driverRidesCompleted, setDriverRidesCompleted] = useState(0);
  
  // Custom toggles
  const [driverWhatsapp, setDriverWhatsapp] = useState(true);
  const [useRealGPS, setUseRealGPS] = useState(false);

  // Ref channels for unsubscribing
  const rideChannelRef = useRef<any>(null);
  const chatChannelRef = useRef<any>(null);
  const locChannelRef = useRef<any>(null);
  const reqChannelRef = useRef<any>(null);
  
  const geoWatcherRef = useRef<number | null>(null);

  // 1. Hook: Handle Supabase Auth Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setUserRole('none');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch User Profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserProfile({
          fullName: data.full_name || '',
          phone: data.phone || '',
          role: data.role || 'none',
          vehicleInfo: data.vehicle_info || '',
          avatar: data.avatar_url || '🐶'
        });
        setUserRole(data.role);
        setDriverOnline(data.is_online);
      }
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Load user pets and ride history upon profile initialization
  useEffect(() => {
    if (!user) return;
    fetchPets();
    fetchRidesHistory();
    fetchActiveRide();
  }, [user, userRole]);

  const fetchPets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id);
    if (data) {
      setPets(data.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        size: p.size,
        specialNotes: p.special_notes,
        photoUrl: p.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'
      })));
    }
  };

  const fetchRidesHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .or(`owner_id.eq.${user.id},driver_id.eq.${user.id}`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (data) {
      setRides(data.map(mapDbRideToModel));
      // Calculate earnings if driver
      if (userRole === 'driver') {
        const sum = data.reduce((acc, curr) => acc + Number(curr.price), 0);
        setDriverEarnings(sum);
        setDriverRidesCompleted(data.length);
      }
    }
  };

  // Find if there's any active ride in progress
  const fetchActiveRide = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rides')
      .select('*')
      .or(`owner_id.eq.${user.id},driver_id.eq.${user.id}`)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const active = mapDbRideToModel(data[0]);
      setActiveRide(active);
      setupRideSubscriptions(active.id, active.driverId);
    }
  };

  // 4. Setup Database Real-Time listeners
  const setupRideSubscriptions = (rideId: string, driverId?: string) => {
    // Unsubscribe previous
    if (rideChannelRef.current) rideChannelRef.current.unsubscribe();
    if (chatChannelRef.current) chatChannelRef.current.unsubscribe();
    if (locChannelRef.current) locChannelRef.current.unsubscribe();

    // Subscribe to ride edits
    rideChannelRef.current = supabase
      .channel(`ride-view-${rideId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
        (payload) => {
          const updated = mapDbRideToModel(payload.new);
          setActiveRide(updated);
          
          if (updated.status === 'completed' || updated.status === 'cancelled') {
            setRides(all => [updated, ...all]);
            setActiveRide(null);
            setChatMessages([]);
            
            if (rideChannelRef.current) rideChannelRef.current.unsubscribe();
            if (chatChannelRef.current) chatChannelRef.current.unsubscribe();
            if (locChannelRef.current) locChannelRef.current.unsubscribe();
          }
        }
      )
      .subscribe();

    // Subscribe to messages in this ride
    chatChannelRef.current = supabase
      .channel(`chat-view-${rideId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const m = payload.new;
          setChatMessages(prev => {
            if (prev.some(x => x.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              rideId: m.ride_id,
              senderId: m.sender_id as any,
              senderName: m.sender_name,
              message: m.message,
              createdAt: m.created_at
            }];
          });
        }
      )
      .subscribe();

    // Load initial chat history
    supabase
      .from('messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setChatMessages(data.map(m => ({
            id: m.id,
            rideId: m.ride_id,
            senderId: m.sender_id as any,
            senderName: m.sender_name,
            message: m.message,
            createdAt: m.created_at
          })));
        }
      });

    // Subscribe to driver location coordinates
    if (driverId && userRole === 'owner') {
      locChannelRef.current = supabase
        .channel(`driver-loc-${driverId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` },
          (payload) => {
            if (payload.new) {
              const pNew = payload.new as any;
              setDriverLocation([Number(pNew.lat), Number(pNew.lng)]);
            }
          }
        )
        .subscribe();

      // Load initial coordinates
      supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single()
        .then(({ data }) => {
          if (data) {
            setDriverLocation([Number(data.lat), Number(data.lng)]);
          }
        });
    }
  };

  // Driver listen to requested rides in real-time
  useEffect(() => {
    if (userRole !== 'driver' || !driverOnline) {
      if (reqChannelRef.current) reqChannelRef.current.unsubscribe();
      return;
    }

    // Load existing pending requests
    supabase
      .from('rides')
      .select('*')
      .eq('status', 'requested')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0 && !activeRide) {
          setActiveRide(mapDbRideToModel(data[0]));
        }
      });

    // Real-time requested rides channel
    reqChannelRef.current = supabase
      .channel('driver-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.requested' },
        (payload) => {
          if (!activeRide) {
            setActiveRide(mapDbRideToModel(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides' },
        (payload) => {
          const r = payload.new;
          // Clear active request if accepted by someone else
          if (r.status !== 'requested') {
            setActiveRide(prev => prev && prev.id === r.id ? null : prev);
          }
        }
      )
      .subscribe();

    return () => {
      if (reqChannelRef.current) reqChannelRef.current.unsubscribe();
    };
  }, [userRole, driverOnline, activeRide]);

  // Geolocation trigger watch loop for driver Location Updates
  useEffect(() => {
    if (useRealGPS && driverOnline && navigator.geolocation) {
      geoWatcherRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setDriverLocation([lat, lng]);
          
          // Write directly to DB
          supabase
            .from('driver_locations')
            .upsert({
              driver_id: user?.id,
              lat,
              lng,
              updated_at: new Date().toISOString()
            })
            .then();
        },
        (error) => {
          console.error("GPS Watch Position error:", error);
          alert("Error de GPS. Usando ubicación simulada local.");
          setUseRealGPS(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (geoWatcherRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatcherRef.current);
        geoWatcherRef.current = null;
      }
    };
  }, [useRealGPS, driverOnline, user]);

  // Simulated location progression (if NOT using real GPS)
  useEffect(() => {
    if (!activeRide || useRealGPS) return;

    const { status, pickupCoords, dropoffCoords } = activeRide;

    if (userRole === 'driver' && (status === 'accepted' || status === 'started')) {
      const targetCoords = status === 'accepted' ? pickupCoords : dropoffCoords;
      const interval = setInterval(() => {
        setDriverLocation(current => {
          const latDiff = targetCoords[0] - current[0];
          const lngDiff = targetCoords[1] - current[1];
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          const step = 0.00035;

          if (distance <= step) {
            clearInterval(interval);
            return targetCoords;
          }

          const next: [number, number] = [
            current[0] + (latDiff / distance) * step,
            current[1] + (lngDiff / distance) * step
          ];

          // Push new coordinates to Database
          supabase
            .from('driver_locations')
            .upsert({
              driver_id: user?.id,
              lat: next[0],
              lng: next[1],
              updated_at: new Date().toISOString()
            })
            .then();

          return next;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeRide, userRole, useRealGPS, user]);

  // 5. Actions / DB Integrations
  const selectRole = async (role: 'owner' | 'driver' | 'none') => {
    setUserRole(role);
    if (user) {
      await supabase.from('profiles').update({ role }).eq('id', user.id);
    }
  };

  const registerUser = async (profile: UserProfile) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.fullName,
        phone: profile.phone,
        role: profile.role,
        vehicle_info: profile.role === 'driver' ? profile.vehicleInfo : null,
        avatar_url: profile.avatar,
        updated_at: new Date().toISOString()
      });

    if (!error) {
      setUserProfile(profile);
      setUserRole(profile.role);
    } else {
      alert("Error al registrar: " + error.message);
    }
  };

  const addPet = async (newPet: Omit<Pet, 'id'>) => {
    if (!user) return;
    const { data } = await supabase
      .from('pets')
      .insert({
        owner_id: user.id,
        name: newPet.name,
        type: newPet.type,
        size: newPet.size,
        special_notes: newPet.specialNotes,
        photo_url: newPet.photoUrl
      })
      .select()
      .single();
    
    if (data) {
      setPets(prev => [...prev, {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        specialNotes: data.special_notes,
        photoUrl: data.photo_url
      }]);
    }
  };

  const deletePet = async (id: string) => {
    await supabase.from('pets').delete().eq('id', id);
    setPets(prev => prev.filter(p => p.id !== id));
  };

  const requestRide = async (
    petId: string, 
    serviceClass: Ride['serviceClass'], 
    pickupAddr: string, 
    dropoffAddr: string,
    paymentMethod: Ride['paymentMethod']
  ) => {
    if (!user) return;
    const petName = pets.find(p => p.id === petId)?.name || 'Mascota';
    
    // Generate random coordinates in Tucumán
    const pLat = TUCUMAN_COORDS[0] + (Math.random() - 0.5) * 0.012;
    const pLng = TUCUMAN_COORDS[1] + (Math.random() - 0.5) * 0.012;
    const dLat = TUCUMAN_COORDS[0] + (Math.random() - 0.5) * 0.012;
    const dLng = TUCUMAN_COORDS[1] + (Math.random() - 0.5) * 0.012;

    const basePrice = serviceClass === 'standard' ? 1100 : serviceClass === 'xl' ? 1800 : 2200;
    const dist = Math.sqrt(Math.pow(pLat - dLat, 2) + Math.pow(pLng - dLng, 2)) * 100;
    const price = Math.round(basePrice + dist * 200);

    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    const { data, error } = await supabase
      .from('rides')
      .insert({
        owner_id: user.id,
        owner_name: userProfile?.fullName || 'Pasajero',
        owner_phone: userProfile?.phone || '',
        pet_id: petId,
        pet_name: petName,
        status: 'requested',
        service_class: serviceClass,
        pickup_address: pickupAddr,
        pickup_lat: pLat,
        pickup_lng: pLng,
        dropoff_address: dropoffAddr,
        dropoff_lat: dLat,
        dropoff_lng: dLng,
        price,
        eta: Math.round(3 + dist * 8),
        pin_code: pin,
        payment_method: paymentMethod
      })
      .select()
      .single();

    if (data) {
      const active = mapDbRideToModel(data);
      setActiveRide(active);
      setupRideSubscriptions(active.id);
    } else {
      console.error(error);
    }
  };

  const cancelRide = async () => {
    if (!activeRide) return;
    await supabase.from('rides').update({ status: 'cancelled' }).eq('id', activeRide.id);
    setActiveRide(null);
  };

  const acceptRide = async (rideId: string) => {
    if (!user || !userProfile) return;
    
    // Position driver near pickup location
    const { data: rideData } = await supabase.from('rides').select('pickup_lat, pickup_lng').eq('id', rideId).single();
    if (rideData) {
      const startLat = Number(rideData.pickup_lat) + 0.004;
      const startLng = Number(rideData.pickup_lng) - 0.004;
      setDriverLocation([startLat, startLng]);
      await supabase.from('driver_locations').upsert({ driver_id: user.id, lat: startLat, lng: startLng });
    }

    const { data } = await supabase
      .from('rides')
      .update({
        status: 'accepted',
        driver_id: user.id,
        driver_name: userProfile.fullName,
        driver_phone: userProfile.phone,
        vehicle_info: userProfile.vehicleInfo,
        eta: 4
      })
      .eq('id', rideId)
      .select()
      .single();

    if (data) {
      const updated = mapDbRideToModel(data);
      setActiveRide(updated);
      setupRideSubscriptions(updated.id, updated.driverId);
      
      // Post automatic welcome chat message
      await supabase.from('messages').insert({
        ride_id: updated.id,
        sender_id: 'driver',
        sender_name: userProfile.fullName,
        message: '¡Hola! Acepté el viaje para tu mascota. Ya voy en camino. Indicame el PIN al subir.'
      });
    }
  };

  const verifyRidePin = async (pin: string): Promise<boolean> => {
    if (!activeRide) return false;
    
    if (activeRide.pinCode === pin) {
      const { data } = await supabase
        .from('rides')
        .update({ status: 'started', eta: 6 })
        .eq('id', activeRide.id)
        .select()
        .single();
      
      if (data) {
        setActiveRide(mapDbRideToModel(data));
        await supabase.from('messages').insert({
          ride_id: activeRide.id,
          sender_id: 'driver',
          sender_name: activeRide.driverName || 'Chofer',
          message: '¡PIN Validado! Viaje iniciado de forma segura.'
        });
        return true;
      }
    }
    return false;
  };

  const advanceRideStatus = async () => {
    if (!activeRide) return;
    
    if (activeRide.status === 'accepted') {
      const { data } = await supabase.from('rides').update({ status: 'arrived', eta: 0 }).eq('id', activeRide.id).select().single();
      if (data) {
        setActiveRide(mapDbRideToModel(data));
        await supabase.from('messages').insert({
          ride_id: activeRide.id,
          sender_id: 'driver',
          sender_name: activeRide.driverName || 'Chofer',
          message: '¡He llegado a la puerta del domicilio! Estoy afuera.'
        });
      }
    } else if (activeRide.status === 'started') {
      const { data } = await supabase.from('rides').update({ status: 'completed', eta: 0 }).eq('id', activeRide.id).select().single();
      if (data) {
        const completed = mapDbRideToModel(data);
        setRides(all => [completed, ...all]);
        setActiveRide(null);
        setChatMessages([]);
      }
    }
  };

  const sendChatMessage = async (msg: string, sender: 'owner' | 'driver') => {
    if (!activeRide || !userProfile) return;
    await supabase.from('messages').insert({
      ride_id: activeRide.id,
      sender_id: sender,
      sender_name: userProfile.fullName || 'Usuario',
      message: msg
    });
  };

  const toggleDriverOnline = async () => {
    if (!user) return;
    const nextState = !driverOnline;
    setDriverOnline(nextState);
    await supabase.from('profiles').update({ is_online: nextState }).eq('id', user.id);
  };

  const toggleDriverWhatsapp = () => {
    setDriverWhatsapp(prev => !prev);
  };

  const toggleUseRealGPS = () => {
    setUseRealGPS(prev => !prev);
  };

  // Auth Operations
  const signUpWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return { error };
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error };
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const resetAll = async () => {
    if (geoWatcherRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatcherRef.current);
    }
    await supabase.auth.signOut();
    setUserProfile(null);
    setUserRole('none');
    setPets([]);
    setRides([]);
    setActiveRide(null);
    setChatMessages([]);
    setDriverOnline(false);
  };

  return (
    <AppContext.Provider value={{
      userRole,
      userProfile,
      pets,
      rides,
      activeRide,
      chatMessages,
      driverOnline,
      driverLocation,
      driverEarnings,
      driverRidesCompleted,
      driverWhatsapp,
      useRealGPS,
      session,
      user,
      loading,
      
      selectRole,
      registerUser,
      addPet,
      deletePet,
      requestRide,
      cancelRide,
      acceptRide,
      verifyRidePin,
      advanceRideStatus,
      sendChatMessage,
      toggleDriverOnline,
      toggleDriverWhatsapp,
      toggleUseRealGPS,
      signUpWithEmail,
      signInWithEmail,
      loginWithGoogle,
      resetAll
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
