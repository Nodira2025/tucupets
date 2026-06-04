import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Ride } from '../context/AppContext';
import { MapView } from '../components/MapView';
import { DriverMatching } from '../components/DriverMatching';
import { ActiveRideStatus } from '../components/ActiveRideStatus';
import { RideChat } from '../components/RideChat';
import { Plus, Trash2, X, ArrowLeft } from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { 
    pets, 
    addPet, 
    deletePet, 
    activeRide, 
    requestRide, 
    selectRole,
    rides 
  } = useApp();

  const [chatOpen, setChatOpen] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  
  // Pet form state
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Perro');
  const [petSize, setPetSize] = useState('Mediano');
  const [petNotes, setPetNotes] = useState('');

  // Booking state (Tucumán default locations)
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');
  const [serviceClass, setServiceClass] = useState<Ride['serviceClass']>('standard');
  const [pickupAddr, setPickupAddr] = useState('Plaza Urquiza, Barrio Norte');
  const [dropoffAddr, setDropoffAddr] = useState('Plaza Independencia, Centro');
  const [paymentMethod, setPaymentMethod] = useState<Ride['paymentMethod']>('cash');

  // Trigger pet selection fallback
  React.useEffect(() => {
    if (pets.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const handleAddPetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) return;

    // Fetch a random dog/cat photo placeholder
    const isDog = petType === 'Perro';
    const photoUrl = isDog
      ? `https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80`
      : `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80`;

    addPet({
      name: petName,
      type: petType,
      size: petSize,
      specialNotes: petNotes,
      photoUrl
    });

    // Reset Form
    setPetName('');
    setPetNotes('');
    setShowAddPet(false);
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) {
      alert('Por favor, agrega o selecciona una mascota primero.');
      return;
    }
    requestRide(selectedPetId, serviceClass, pickupAddr, dropoffAddr, paymentMethod);
  };

  // Determine estimated cost for preview
  const getEstimatedCost = () => {
    let base = 1100;
    if (serviceClass === 'xl') base = 1800;
    if (serviceClass === 'vet') base = 2200;
    return base;
  };

  return (
    <div className="owner-container animate-fade-in">
      {/* Top Header Navigation */}
      <div className="owner-header glass">
        <button className="back-btn" onClick={() => selectRole('none')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="owner-header-title">TucuOwner 🐾</div>
        <button className="switch-role-btn" onClick={() => selectRole('driver')}>
          Modo Chofer 🚐
        </button>
      </div>

      {/* Main dashboard content depending on ride state */}
      {activeRide ? (
        // Active ride panel
        <div className="active-ride-layout">
          {/* Map view covers screen */}
          <div className="map-view-wrapper">
            <MapView />
          </div>

          {/* Overlays */}
          {activeRide.status === 'requested' && <DriverMatching />}
          {activeRide.status !== 'requested' && (
            <ActiveRideStatus onOpenChat={() => setChatOpen(true)} />
          )}

          {/* Chat Window */}
          {chatOpen && (
            <RideChat onClose={() => setChatOpen(false)} senderRole="owner" />
          )}
        </div>
      ) : (
        // Standard view: Manage pets & Book ride
        <div className="dashboard-scrollable">
          
          {/* Section 1: Pet Profiles */}
          <div className="section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px' }}>Mis Mascotas</h2>
              <button className="add-pet-small-btn" onClick={() => setShowAddPet(true)}>
                <Plus size={16} /> Agregar
              </button>
            </div>

            {pets.length === 0 ? (
              <div className="empty-pets">
                <span style={{ fontSize: '28px' }}>🐶🐱</span>
                <p style={{ fontSize: '13px', color: 'var(--neutral-grey)', marginTop: '6px' }}>
                  No tenés mascotas registradas. Agrega una para viajar.
                </p>
              </div>
            ) : (
              <div className="pets-row-scroll">
                {pets.map((pet) => (
                  <div 
                    key={pet.id} 
                    className={`pet-mini-card ${selectedPetId === pet.id ? 'pet-mini-card-selected' : ''}`}
                    onClick={() => setSelectedPetId(pet.id)}
                  >
                    <img src={pet.photoUrl} alt={pet.name} className="pet-mini-avatar" />
                    <div className="pet-mini-name">{pet.name}</div>
                    <div className="pet-mini-type">{pet.type} ({pet.size[0]})</div>
                    <button className="pet-delete-btn" onClick={(e) => {
                      e.stopPropagation();
                      if (selectedPetId === pet.id) setSelectedPetId('');
                      deletePet(pet.id);
                    }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Booking Form */}
          <div className="section-card" style={{ marginTop: '16px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>Pedir un TucuPet</h2>
            
            <form onSubmit={handleBooking}>
              {/* Pet selection dropdown */}
              <div className="input-group">
                <label>¿Quién viaja?</label>
                <select 
                  className="input-field"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecciona una mascota</option>
                  {pets.map(pet => (
                    <option key={pet.id} value={pet.id}>{pet.name} ({pet.type})</option>
                  ))}
                </select>
              </div>

              {/* Service Class Selector */}
              <div className="service-selector-grid">
                <div 
                  className={`service-card ${serviceClass === 'standard' ? 'selected' : ''}`}
                  onClick={() => setServiceClass('standard')}
                >
                  <span className="service-emoji">🐕</span>
                  <div className="service-name">TucuStandard</div>
                  <div className="service-desc">Mascota común</div>
                </div>

                <div 
                  className={`service-card ${serviceClass === 'xl' ? 'selected' : ''}`}
                  onClick={() => setServiceClass('xl')}
                >
                  <span className="service-emoji">🦮🦮</span>
                  <div className="service-name">Tucu XL</div>
                  <div className="service-desc">Grandes/Múltiples</div>
                </div>

                <div 
                  className={`service-card ${serviceClass === 'vet' ? 'selected' : ''}`}
                  onClick={() => setServiceClass('vet')}
                >
                  <span className="service-emoji">🏥</span>
                  <div className="service-name">Vet Express</div>
                  <div className="service-desc">Prioridad + Asistente</div>
                </div>
              </div>

              {/* Pickup & Dropoff Address */}
              <div className="input-group" style={{ marginTop: '14px' }}>
                <label>Dirección de Origen</label>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon">📍</span>
                  <input 
                    type="text" 
                    className="input-field-icon"
                    value={pickupAddr}
                    onChange={(e) => setPickupAddr(e.target.value)}
                    placeholder="Calle, Número, Barrio"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Dirección de Destino</label>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon">🏥</span>
                  <input 
                    type="text" 
                    className="input-field-icon"
                    value={dropoffAddr}
                    onChange={(e) => setDropoffAddr(e.target.value)}
                    placeholder="¿A dónde llevamos a tu mascota?"
                    required
                  />
                </div>
              </div>

              {/* Argentine Payment Method Selector */}
              <div className="input-group">
                <label>Método de Pago</label>
                <div className="payment-selector-row">
                  <button 
                    type="button"
                    className={`pay-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    💵 Efectivo
                  </button>
                  <button 
                    type="button"
                    className={`pay-method-btn ${paymentMethod === 'mercadopago' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('mercadopago')}
                  >
                    📱 Mercado Pago
                  </button>
                </div>
              </div>

              {/* Price Preview & Book Button */}
              <div className="pricing-preview glass" style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '13px', color: 'var(--neutral-grey)' }}>Costo aproximado</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--neutral-dark)' }}>${getEstimatedCost()}</div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '16px', display: 'flex', justifyContent: 'center' }}
                disabled={pets.length === 0}
              >
                Pedir TucuPet 🚐
              </button>
            </form>
          </div>

          {/* Section 3: History list */}
          {rides.length > 0 && (
            <div className="section-card" style={{ marginTop: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Viajes Recientes</h2>
              <div className="history-list">
                {rides.slice(0, 3).map((r) => (
                  <div key={r.id} className="history-item">
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      Viaje de {r.petName} ({r.serviceClass.toUpperCase()})
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--neutral-grey)' }}>
                      Desde: {r.pickupAddress} | Destino: {r.dropoffAddress}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className={`hist-badge ${r.status}`} style={{ fontSize: '10px' }}>
                        {r.status}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '12px' }}>${r.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal/Overlay to Add Pet */}
      {showAddPet && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-sheet animate-slide-up glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '20px' }}>Nueva Mascota 🐾</h3>
              <button className="close-modal-btn" onClick={() => setShowAddPet(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPetSubmit}>
              <div className="input-group">
                <label>Nombre de la Mascota</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Luna, Simón"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select 
                    className="input-field"
                    value={petType}
                    onChange={(e) => setPetType(e.target.value)}
                  >
                    <option value="Perro">Perro 🐶</option>
                    <option value="Gato">Gato 🐱</option>
                    <option value="Ave">Ave 🦜</option>
                    <option value="Otro">Otro 🦎</option>
                  </select>
                </div>

                <div className="input-group" style={{ flex: 1 }}>
                  <label>Tamaño</label>
                  <select 
                    className="input-field"
                    value={petSize}
                    onChange={(e) => setPetSize(e.target.value)}
                  >
                    <option value="Pequeño">Pequeño (&lt; 10kg)</option>
                    <option value="Mediano">Mediano (10-25kg)</option>
                    <option value="Grande">Grande (&gt; 25kg)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Notas especiales o Cuidados</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="Ej: Es asustadiza, necesita pretal doble, se marea en auto."
                  value={petNotes}
                  onChange={(e) => setPetNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Guardar Mascota
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .owner-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--neutral-light);
          overflow: hidden;
        }
        .owner-header {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          z-index: 1000;
        }
        .back-btn {
          background: none;
          border: none;
          color: var(--neutral-grey);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .owner-header-title {
          font-family: var(--font-title);
          font-size: 18px;
          font-weight: 700;
          color: var(--neutral-dark);
        }
        .switch-role-btn {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          border: 1px solid rgba(247, 185, 87, 0.3);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .switch-role-btn:hover {
          background-color: var(--primary);
          color: var(--neutral-dark);
        }
        .dashboard-scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .section-card {
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .add-pet-small-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-dark);
          background-color: var(--primary-light);
          border: none;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
        }
        .empty-pets {
          padding: 18px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
        }
        .pets-row-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .pet-mini-card {
          flex-shrink: 0;
          width: 95px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px;
          text-align: center;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pet-mini-card-selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
          box-shadow: 0 4px 8px rgba(247, 185, 87, 0.1);
        }
        .pet-mini-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
        }
        .pet-mini-name {
          font-weight: 600;
          font-size: 12px;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pet-mini-type {
          font-size: 9px;
          color: var(--neutral-grey);
        }
        .pet-delete-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: none;
          border: none;
          color: var(--neutral-grey);
          cursor: pointer;
          padding: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .pet-mini-card:hover .pet-delete-btn {
          opacity: 0.8;
        }
        .pet-delete-btn:hover {
          color: var(--danger);
          opacity: 1 !important;
        }
        .service-selector-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }
        .service-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 4px;
          text-align: center;
          cursor: pointer;
          background-color: white;
          transition: all 0.2s ease;
        }
        .service-card:hover {
          border-color: var(--primary);
        }
        .service-card.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
        }
        .service-emoji {
          font-size: 20px;
        }
        .service-name {
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
        }
        .service-desc {
          font-size: 9px;
          color: var(--neutral-grey);
          margin-top: 2px;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
        }
        .input-field-icon {
          width: 100%;
          padding: 14px 18px;
          padding-left: 40px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: white;
          color: var(--neutral-dark);
          transition: all 0.2s ease;
        }
        .input-field-icon:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(247, 185, 87, 0.2);
        }
        .payment-selector-row {
          display: flex;
          gap: 10px;
          width: 100%;
        }
        .pay-method-btn {
          flex: 1;
          padding: 12px;
          border: 1px solid var(--border);
          background-color: white;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pay-method-btn.active {
          border-color: var(--primary);
          background-color: var(--primary-light);
          color: var(--primary-dark);
        }
        .pricing-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          background-color: var(--neutral-light);
          border: 1px solid var(--border);
        }
        .active-ride-layout {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .map-view-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }
        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.4);
          z-index: 2000;
          display: flex;
          align-items: flex-end;
        }
        .modal-sheet {
          width: 100%;
          background: white;
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
          padding: 24px;
          text-align: left;
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
        }
        .close-modal-btn {
          background: none;
          border: none;
          color: var(--neutral-grey);
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .history-item {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          text-align: left;
        }
        .hist-badge {
          display: inline-block;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .hist-badge.completed {
          background-color: var(--success-light);
          color: var(--success);
        }
        .hist-badge.cancelled {
          background-color: var(--danger-light);
          color: var(--danger);
        }
      `}</style>
    </div>
  );
};
