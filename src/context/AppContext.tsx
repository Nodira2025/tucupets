import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  driverWhatsapp: boolean; // WhatsApp perm toggle
  useRealGPS: boolean; // Bind map to phone GPS
  selectRole: (role: 'owner' | 'driver' | 'none') => void;
  registerUser: (profile: UserProfile) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  deletePet: (id: string) => void;
  requestRide: (
    petId: string, 
    serviceClass: Ride['serviceClass'], 
    pickupAddr: string, 
    dropoffAddr: string,
    paymentMethod: Ride['paymentMethod']
  ) => void;
  cancelRide: () => void;
  acceptRide: (rideId: string) => void;
  verifyRidePin: (pin: string) => boolean; // Verification PIN logic
  advanceRideStatus: () => void;
  sendChatMessage: (msg: string, sender: 'owner' | 'driver') => void;
  toggleDriverOnline: () => void;
  toggleDriverWhatsapp: () => void;
  toggleUseRealGPS: () => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Base coordinates locked to San Miguel de Tucumán, Argentina (Plaza Independencia)
const TUCUMAN_COORDS: [number, number] = [-26.8241, -65.2226];

// Preloaded mock pets if empty
const DEFAULT_PETS: Pet[] = [
  {
    id: '1',
    name: 'Toby',
    type: 'Perro',
    size: 'Mediano',
    specialNotes: 'Le encanta asomarse por la ventana. Muy dócil.',
    photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    name: 'Mimi',
    type: 'Gato',
    size: 'Pequeño',
    specialNotes: 'Viaja únicamente dentro de su transportadora. Algo asustadiza.',
    photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<'owner' | 'driver' | 'none'>(() => {
    return (localStorage.getItem('tucupets_role') as any) || 'none';
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('tucupets_profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('tucupets_pets');
    return saved ? JSON.parse(saved) : DEFAULT_PETS;
  });

  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem('tucupets_rides');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeRide, setActiveRide] = useState<Ride | null>(() => {
    const saved = localStorage.getItem('tucupets_active_ride');
    return saved ? JSON.parse(saved) : null;
  });

  const [chatMessages, setChatMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('tucupets_chat');
    return saved ? JSON.parse(saved) : [];
  });

  // Driver metrics state
  const [driverOnline, setDriverOnline] = useState<boolean>(() => {
    return localStorage.getItem('tucupets_dr_online') === 'true';
  });
  const [driverLocation, setDriverLocation] = useState<[number, number]>(() => {
    const saved = localStorage.getItem('tucupets_dr_loc');
    return saved ? JSON.parse(saved) : [TUCUMAN_COORDS[0] + 0.003, TUCUMAN_COORDS[1] + 0.007];
  });
  const [driverEarnings, setDriverEarnings] = useState<number>(() => {
    return Number(localStorage.getItem('tucupets_dr_earnings') || '0');
  });
  const [driverRidesCompleted, setDriverRidesCompleted] = useState<number>(() => {
    return Number(localStorage.getItem('tucupets_dr_rides_count') || '0');
  });

  // Local Argentine WhatsApp & GPS options
  const [driverWhatsapp, setDriverWhatsapp] = useState<boolean>(() => {
    return localStorage.getItem('tucupets_dr_wa') !== 'false';
  });
  const [useRealGPS, setUseRealGPS] = useState<boolean>(() => {
    return localStorage.getItem('tucupets_dr_real_gps') === 'true';
  });

  // Keep references for animation loops & Geolocation watcher
  const animationRef = useRef<number | null>(null);
  const geoWatcherRef = useRef<number | null>(null);

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem('tucupets_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('tucupets_profile', userProfile ? JSON.stringify(userProfile) : '');
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('tucupets_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('tucupets_rides', JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem('tucupets_active_ride', activeRide ? JSON.stringify(activeRide) : '');
  }, [activeRide]);

  useEffect(() => {
    localStorage.setItem('tucupets_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('tucupets_dr_online', String(driverOnline));
  }, [driverOnline]);

  useEffect(() => {
    localStorage.setItem('tucupets_dr_loc', JSON.stringify(driverLocation));
  }, [driverLocation]);

  useEffect(() => {
    localStorage.setItem('tucupets_dr_earnings', String(driverEarnings));
    localStorage.setItem('tucupets_dr_rides_count', String(driverRidesCompleted));
  }, [driverEarnings, driverRidesCompleted]);

  useEffect(() => {
    localStorage.setItem('tucupets_dr_wa', String(driverWhatsapp));
  }, [driverWhatsapp]);

  useEffect(() => {
    localStorage.setItem('tucupets_dr_real_gps', String(useRealGPS));
  }, [useRealGPS]);

  // Geolocation watch listener for real GPS tracking
  useEffect(() => {
    if (useRealGPS && driverOnline && navigator.geolocation) {
      geoWatcherRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("GPS Tracking error:", error);
          alert("Error al obtener señal de GPS. Usando simulación local.");
          setUseRealGPS(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (geoWatcherRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatcherRef.current);
        geoWatcherRef.current = null;
      }
    };
  }, [useRealGPS, driverOnline]);

  // Simulated driver tracking movement
  useEffect(() => {
    if (!activeRide) {
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    const { status, pickupCoords, dropoffCoords } = activeRide;

    // Do NOT run simulated route updates if the driver is using real device GPS
    if (useRealGPS && userRole === 'driver') {
      return;
    }

    // Trigger auto-simulation for Owner mode only so the user sees action
    if (userRole === 'owner') {
      if (status === 'requested') {
        // Auto-accept after 5 seconds
        const timer = setTimeout(() => {
          const updated: Ride = {
            ...activeRide,
            status: 'accepted',
            driverId: 'd100',
            driverName: 'Marcos Pérez',
            driverRating: 4.95,
            driverPhone: '+5493815551234', // Tucumán number
            vehicleInfo: 'Kangoo Blanca (Habilitada Mascotas)',
            eta: 3
          };
          setActiveRide(updated);
          setChatMessages([
            {
              id: 'm-welcome',
              rideId: updated.id,
              senderId: 'driver',
              senderName: 'Marcos Pérez',
              message: '¡Hola! Ya voy en camino a buscar a ' + updated.petName + '. Llevo arnés de seguridad.',
              createdAt: new Date().toISOString()
            }
          ]);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }

    // Coordinates movement simulation for driver tracking
    if (status === 'accepted' || status === 'started') {
      const targetCoords = status === 'accepted' ? pickupCoords : dropoffCoords;
      
      const interval = setInterval(() => {
        setDriverLocation(current => {
          const latDiff = targetCoords[0] - current[0];
          const lngDiff = targetCoords[1] - current[1];
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          // Step size
          const step = 0.00035; 

          if (distance <= step) {
            clearInterval(interval);
            
            // Auto progress status in Owner mode
            if (userRole === 'owner') {
              setTimeout(() => {
                setActiveRide(prev => {
                  if (!prev) return null;
                  if (prev.status === 'accepted') {
                    // Send chat message and update status to arrived
                    setChatMessages(msgs => [
                      ...msgs,
                      {
                        id: 'm-arrived-' + Date.now(),
                        rideId: prev.id,
                        senderId: 'driver',
                        senderName: prev.driverName || 'Conductor',
                        message: '¡He llegado a la puerta! Recordá tener a mano el PIN de viaje: ' + prev.pinCode,
                        createdAt: new Date().toISOString()
                      }
                    ]);
                    
                    // Auto-start after 5 seconds (simulates giving PIN code)
                    setTimeout(() => {
                      setActiveRide(cur => cur ? { ...cur, status: 'started', eta: 6 } : null);
                    }, 5000);

                    return { ...prev, status: 'arrived', eta: 0 };
                  } else if (prev.status === 'started') {
                    // Complete ride
                    const completedRide: Ride = { ...prev, status: 'completed', eta: 0 };
                    setRides(all => [completedRide, ...all]);
                    return completedRide;
                  }
                  return prev;
                });
              }, 1500);
            }
            return targetCoords;
          }

          // Move closer to target
          return [
            current[0] + (latDiff / distance) * step,
            current[1] + (lngDiff / distance) * step
          ];
        });
      }, 1000);

      animationRef.current = interval as any;
      return () => clearInterval(interval);
    }
  }, [activeRide, userRole, useRealGPS]);

  // Actions
  const selectRole = (role: 'owner' | 'driver' | 'none') => {
    setUserRole(role);
    if (userProfile) {
      setUserProfile(prev => prev ? { ...prev, role } : null);
    }
  };

  const registerUser = (profile: UserProfile) => {
    setUserProfile(profile);
    setUserRole(profile.role);
  };

  const addPet = (newPet: Omit<Pet, 'id'>) => {
    const pet: Pet = {
      ...newPet,
      id: 'pet-' + Date.now()
    };
    setPets(prev => [...prev, pet]);
  };

  const deletePet = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  };

  const requestRide = (
    petId: string, 
    serviceClass: Ride['serviceClass'], 
    pickupAddr: string, 
    dropoffAddr: string,
    paymentMethod: Ride['paymentMethod']
  ) => {
    const petName = pets.find(p => p.id === petId)?.name || 'Mascota';
    
    // Create random coords centered around Plaza Independencia, Tucumán
    const pLat = TUCUMAN_COORDS[0] + (Math.random() - 0.5) * 0.012;
    const pLng = TUCUMAN_COORDS[1] + (Math.random() - 0.5) * 0.012;
    const dLat = TUCUMAN_COORDS[0] + (Math.random() - 0.5) * 0.012;
    const dLng = TUCUMAN_COORDS[1] + (Math.random() - 0.5) * 0.012;

    // Price calculation
    let basePrice = 1100;
    if (serviceClass === 'xl') basePrice = 1800;
    if (serviceClass === 'vet') basePrice = 2200;
    const distanceEst = Math.sqrt(Math.pow(pLat - dLat, 2) + Math.pow(pLng - dLng, 2)) * 100;
    const finalPrice = Math.round(basePrice + distanceEst * 200);

    // Generate random 4-digit safety PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();

    const newRide: Ride = {
      id: 'ride-' + Date.now(),
      ownerId: 'owner-current',
      ownerName: userProfile?.fullName || 'Cliente TucuPets',
      ownerPhone: userProfile?.phone || '+54 381 000-0000',
      petId,
      petName,
      status: 'requested',
      serviceClass,
      pickupAddress: pickupAddr || 'Plaza Independencia',
      pickupCoords: [pLat, pLng],
      dropoffAddress: dropoffAddr || 'Hospital Veterinario Tucumán',
      dropoffCoords: [dLat, dLng],
      price: finalPrice,
      eta: Math.round(3 + distanceEst * 8),
      createdAt: new Date().toISOString(),
      pinCode: generatedPin,
      paymentMethod
    };

    if (!useRealGPS) {
      setDriverLocation([
        pLat + (Math.random() > 0.5 ? 0.005 : -0.005),
        pLng + (Math.random() > 0.5 ? 0.005 : -0.005)
      ]);
    }

    setActiveRide(newRide);
    setChatMessages([]);
  };

  const cancelRide = () => {
    if (activeRide) {
      const cancelled: Ride = { ...activeRide, status: 'cancelled' };
      setRides(prev => [cancelled, ...prev]);
      setActiveRide(null);
      setChatMessages([]);
    }
  };

  const acceptRide = (rideId: string) => {
    if (activeRide && activeRide.id === rideId) {
      const updated: Ride = {
        ...activeRide,
        status: 'accepted',
        driverId: 'driver-current',
        driverName: userProfile?.fullName || 'Franco Conductor',
        driverRating: 5.0,
        driverPhone: userProfile?.phone || '+543816667777',
        vehicleInfo: userProfile?.vehicleInfo || 'Pet-Fiorino Habilitada (Tucumán)',
        eta: 4
      };
      setActiveRide(updated);
      setChatMessages([
        {
          id: 'm-welcome-dr',
          rideId: updated.id,
          senderId: 'driver',
          senderName: updated.driverName || 'Franco Conductor',
          message: '¡Hola! Acepté el viaje para transportar a ' + updated.petName + '. Voy para allá. Al subir, por favor indicame el PIN de viaje.',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  // Verification PIN logic
  const verifyRidePin = (pin: string): boolean => {
    if (!activeRide) return false;
    
    if (activeRide.pinCode === pin) {
      const updated: Ride = { ...activeRide, status: 'started', eta: 7 };
      setActiveRide(updated);
      setChatMessages(prev => [
        ...prev,
        {
          id: 'sys-pin-' + Date.now(),
          rideId: activeRide.id,
          senderId: 'driver',
          senderName: activeRide.driverName || 'Franco Conductor',
          message: '¡Código PIN validado con éxito! Viaje iniciado de forma segura.',
          createdAt: new Date().toISOString()
        }
      ]);
      return true;
    }
    return false;
  };

  // Manual status advancement for Driver Dashboard
  const advanceRideStatus = () => {
    if (!activeRide) return;
    
    let nextStatus: Ride['status'] = activeRide.status;
    let systemMsg = '';

    if (activeRide.status === 'accepted') {
      nextStatus = 'arrived';
      systemMsg = 'El chofer llegó al origen. Solicitando PIN de seguridad...';
    } else if (activeRide.status === 'started') {
      nextStatus = 'completed';
      
      // Update earnings
      setDriverEarnings(prev => prev + activeRide.price);
      setDriverRidesCompleted(prev => prev + 1);

      // Save to ride list
      const completed: Ride = { ...activeRide, status: 'completed' };
      setRides(prev => [completed, ...prev]);
      setActiveRide(null);
      setChatMessages([]);
      return;
    }

    const updated = { ...activeRide, status: nextStatus };
    setActiveRide(updated);

    if (systemMsg) {
      setChatMessages(prev => [
        ...prev,
        {
          id: 'sys-' + Date.now(),
          rideId: activeRide.id,
          senderId: 'driver',
          senderName: activeRide.driverName || 'Franco Conductor',
          message: systemMsg,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const sendChatMessage = (msg: string, sender: 'owner' | 'driver') => {
    if (!activeRide) return;

    const newMessage: Message = {
      id: 'msg-' + Date.now(),
      rideId: activeRide.id,
      senderId: sender,
      senderName: sender === 'owner' ? (userProfile?.fullName || 'Propietario') : (activeRide.driverName || 'Conductor'),
      message: msg,
      createdAt: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newMessage]);

    // Simple auto-reply from AI driver if owner speaks
    if (sender === 'owner' && userRole === 'owner') {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: 'msg-reply-' + Date.now(),
            rideId: activeRide.id,
            senderId: 'driver',
            senderName: activeRide.driverName || 'Conductor',
            message: '¡Entendido! Muchas gracias por el aviso.',
            createdAt: new Date().toISOString()
          }
        ]);
      }, 2500);
    }
  };

  const toggleDriverOnline = () => {
    setDriverOnline(prev => !prev);
  };

  const toggleDriverWhatsapp = () => {
    setDriverWhatsapp(prev => !prev);
  };

  const toggleUseRealGPS = () => {
    setUseRealGPS(prev => !prev);
  };

  const resetAll = () => {
    setUserRole('none');
    setUserProfile(null);
    setPets(DEFAULT_PETS);
    setRides([]);
    setActiveRide(null);
    setChatMessages([]);
    setDriverOnline(false);
    setDriverEarnings(0);
    setDriverRidesCompleted(0);
    setDriverWhatsapp(true);
    setUseRealGPS(false);
    localStorage.clear();
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
