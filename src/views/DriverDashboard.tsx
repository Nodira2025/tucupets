import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Ride } from '../context/AppContext';
import { MapView } from '../components/MapView';
import { RideChat } from '../components/RideChat';
import { Power, TrendingUp, Award, MessageSquare, Phone, ArrowLeft, Navigation, Copy, Check } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const {
    activeRide,
    driverOnline,
    driverEarnings,
    driverRidesCompleted,
    driverWhatsapp,
    useRealGPS,
    toggleDriverOnline,
    toggleDriverWhatsapp,
    toggleUseRealGPS,
    acceptRide,
    verifyRidePin,
    advanceRideStatus,
    selectRole,
    rides
  } = useApp();

  const [chatOpen, setChatOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Local checkout receipt state
  const [lastFinishedRide, setLastFinishedRide] = useState<Ride | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter completed rides for the driver
  const completedDriverRides = rides.filter(r => r.driverId === 'driver-current' && r.status === 'completed');

  // Swipe slider logic (Simplified & highly reliable React click-to-slide simulation)
  const [slidePercent, setSlidePercent] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSliding) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const container = document.getElementById('swipe-track');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width - 50; // Subtract handle width
    const currentX = clientX - rect.left - 25; // Center of handle
    const percent = Math.max(0, Math.min(100, (currentX / width) * 100));
    setSlidePercent(percent);

    if (percent >= 98) {
      setIsSliding(false);
      setSlidePercent(0);
      handleStatusAdvance();
    }
  };

  const handleSwipeStart = () => {
    setIsSliding(true);
  };

  const handleSwipeEnd = () => {
    setIsSliding(false);
    if (slidePercent < 98) {
      setSlidePercent(0); // Snap back
    }
  };

  // Handles state transitions with intercept for receipt modal
  const handleStatusAdvance = () => {
    if (!activeRide) return;
    
    if (activeRide.status === 'started') {
      // Capture data for receipt modal before activeRide is cleared
      setLastFinishedRide(activeRide);
    }
    advanceRideStatus();
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    
    const isValid = verifyRidePin(pinInput);
    if (isValid) {
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Copy MP alias to clipboard
  const handleCopyAlias = () => {
    navigator.clipboard.writeText('tucupets.chofer.mp');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get current button description for status slider
  const getSliderText = () => {
    if (!activeRide) return '';
    switch (activeRide.status) {
      case 'accepted':
        return 'DESLIZAR AL LLEGAR AL ORIGEN 📍';
      case 'started':
        return 'DESLIZAR AL COMPLETAR DESTINO 🏁';
      default:
        return 'DESLIZAR';
    }
  };

  return (
    <div className="driver-container animate-fade-in"
      onMouseMove={handleSwipeMove}
      onMouseUp={handleSwipeEnd}
      onTouchMove={handleSwipeMove}
      onTouchEnd={handleSwipeEnd}
    >
      {/* Top Header */}
      <div className="driver-header glass">
        <button className="back-btn" onClick={() => selectRole('none')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="driver-header-title">TucuDriver 🚐</div>
        <button className="switch-role-btn-owner" onClick={() => selectRole('owner')}>
          Modo Cliente 🐾
        </button>
      </div>

      {/* Main interface depending on ride existence */}
      {activeRide && activeRide.driverId === 'driver-current' ? (
        // Active Driving Navigation Screen
        <div className="nav-layout">
          <div className="map-view-wrapper">
            <MapView />
          </div>

          {/* Navigation instruction banner */}
          <div className="nav-banner glass animate-fade-in">
            <div className="nav-banner-icon">
              <Navigation size={22} className="rotate-nav" />
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--neutral-grey)', fontWeight: '600' }}>
                {activeRide.status === 'accepted' && 'Navegando a origen'}
                {activeRide.status === 'arrived' && 'Esperando validación PIN'}
                {activeRide.status === 'started' && 'Viajando al destino'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeRide.status === 'accepted' || activeRide.status === 'arrived'
                  ? activeRide.pickupAddress
                  : activeRide.dropoffAddress
                }
              </div>
            </div>
            <div className="nav-banner-eta">
              {activeRide.eta} min
            </div>
          </div>

          {/* Bottom Control Sheet */}
          <div className="driver-bottom-sheet glass animate-slide-up">
            <div className="pet-passenger-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="pet-emoji-avatar">🐶</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{activeRide.petName} (Pasajero)</div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-grey)', marginTop: '2px' }}>
                    Pago: {activeRide.paymentMethod === 'mercadopago' ? '📱 Mercado Pago' : '💵 Efectivo'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="action-circle-btn" onClick={() => setChatOpen(true)} title="Chat con Dueño">
                  <MessageSquare size={18} />
                </button>
                <a className="action-circle-btn" href={`tel:${activeRide.driverPhone}`} title="Llamar">
                  <Phone size={18} />
                </a>
              </div>
            </div>

            {/* In-app warnings/details */}
            <div className="care-notes-box">
              <strong>Instrucciones Especiales:</strong>
              <p style={{ marginTop: '4px', fontSize: '12px' }}>
                "El perro viaja en el asiento trasero. Sujetar arnés."
              </p>
            </div>

            {/* Conditional Action Section: PIN verification if arrived */}
            {activeRide.status === 'arrived' ? (
              <div className="pin-verification-container">
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--neutral-dark)' }}>
                  🔑 Solicita el PIN de Viaje al pasajero
                </div>
                <form onSubmit={handlePinSubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="tel"
                    maxLength={4}
                    className={`input-field pin-input ${pinError ? 'pin-error-border' : ''}`}
                    placeholder="Código 4 dígitos"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, padding: '10px 16px' }}>
                    Validar PIN
                  </button>
                </form>
                {pinError && (
                  <div style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: '600', marginTop: '4px', textAlign: 'left' }}>
                    ❌ El PIN ingresado es incorrecto. Reintente.
                  </div>
                )}
              </div>
            ) : (
              /* Simulated Interactive Slider */
              <div 
                id="swipe-track"
                className="swipe-container"
                style={{ marginTop: '16px' }}
              >
                <div 
                  className="swipe-fill"
                  style={{ width: `${slidePercent}%` }}
                ></div>
                <div 
                  className="swipe-handle"
                  style={{ transform: `translateX(${slidePercent * 3.1}px)` }} // Fits swipe constraints
                  onMouseDown={handleSwipeStart}
                  onTouchStart={handleSwipeStart}
                >
                  ➔
                </div>
                <span className="swipe-text">{getSliderText()}</span>
              </div>
            )}
          </div>

          {/* Chat with Client */}
          {chatOpen && (
            <RideChat onClose={() => setChatOpen(false)} senderRole="driver" />
          )}
        </div>
      ) : (
        // Earnings & Request Screen
        <div className="driver-dashboard-scrollable">
          
          {/* Status Switch & Features Settings Bar */}
          <div className="online-toggle-bar glass" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`status-dot ${driverOnline ? 'online' : 'offline'}`}></span>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>
                  {driverOnline ? 'Conectado y Recibiendo Viajes' : 'Desconectado'}
                </span>
              </div>
              <button 
                className={`online-btn ${driverOnline ? 'active' : ''}`}
                onClick={toggleDriverOnline}
              >
                <Power size={18} />
              </button>
            </div>

            {/* Feature Sub-settings (GPS and WhatsApp) */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px', justifyContent: 'space-between' }}>
              <button 
                className={`setting-toggle-btn ${driverWhatsapp ? 'active-wa' : ''}`}
                onClick={toggleDriverWhatsapp}
                title="Habilitar contacto por WhatsApp"
              >
                💬 WhatsApp: {driverWhatsapp ? 'Permitido' : 'Bloqueado'}
              </button>

              <button 
                className={`setting-toggle-btn ${useRealGPS ? 'active-gps' : ''}`}
                onClick={toggleUseRealGPS}
                title="Usar GPS real del celular"
              >
                📡 GPS Real: {useRealGPS ? 'ACTIVO' : 'SIMULADO'}
              </button>
            </div>
          </div>

          {/* Earnings summary */}
          <div className="driver-metrics-grid" style={{ marginTop: '16px' }}>
            <div className="metric-card">
              <TrendingUp size={24} style={{ color: 'var(--success)' }} />
              <div className="metric-val">${driverEarnings}</div>
              <div className="metric-lbl">Ganancias Hoy</div>
            </div>

            <div className="metric-card">
              <Award size={24} style={{ color: 'var(--primary-dark)' }} />
              <div className="metric-val">{driverRidesCompleted}</div>
              <div className="metric-lbl">Viajes Completados</div>
            </div>
          </div>

          {/* Active incoming requests simulator */}
          {driverOnline && activeRide && activeRide.status === 'requested' ? (
            <div className="request-card animate-slide-up" style={{ marginTop: '16px' }}>
              <div className="request-card-header">
                <span className="badge-new">¡NUEVO VIAJE!</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>
                  +${activeRide.price}
                </span>
              </div>

              <div className="request-pet-info" style={{ marginTop: '14px' }}>
                <span className="request-avatar">🐾</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{activeRide.petName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--neutral-grey)' }}>
                    Transporte TucuPet {activeRide.serviceClass.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="route-details" style={{ marginTop: '16px' }}>
                <div className="route-point">
                  <span className="point-dot-p">●</span>
                  <div className="point-text">
                    <strong>Origen:</strong> {activeRide.pickupAddress}
                  </div>
                </div>
                <div className="route-point" style={{ marginTop: '8px' }}>
                  <span className="point-dot-d">●</span>
                  <div className="point-text">
                    <strong>Destino:</strong> {activeRide.dropoffAddress}
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => acceptRide(activeRide.id)}
              >
                Aceptar Viaje 🐾
              </button>
            </div>
          ) : (
            // Offline/Waiting state info
            <div className="waiting-placeholder glass" style={{ marginTop: '16px' }}>
              {driverOnline ? (
                <>
                  <div className="radar-circle-mini">
                    <div className="radar-ring-mini"></div>
                    <span style={{ fontSize: '24px' }}>📡</span>
                  </div>
                  <h3 style={{ fontSize: '15px', marginTop: '12px' }}>Buscando pedidos...</h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-grey)', marginTop: '4px', padding: '0 20px' }}>
                    Tip: Para probar el flujo completo, cambia a Modo Cliente y solicita un viaje. Luego regresa a esta pantalla.
                  </p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '32px' }}>💤</span>
                  <h3 style={{ fontSize: '15px', marginTop: '12px' }}>Estás fuera de línea</h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                    Ponte en línea con el botón superior para empezar a recibir viajes.
                  </p>
                </>
              )}
            </div>
          )}

          {/* History */}
          {completedDriverRides.length > 0 && (
            <div className="completed-rides-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Viajes de Hoy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completedDriverRides.map(r => (
                  <div key={r.id} className="completed-ride-row">
                    <span style={{ fontSize: '20px' }}>🚐</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>Viaje de {r.petName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--neutral-grey)' }}>{r.dropoffAddress}</div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--success)' }}>
                      +${r.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Checkout/Billing Receipt Modal (Argentine Localized) */}
      {lastFinishedRide && (
        <div className="modal-backdrop animate-fade-in" style={{ zIndex: 5000 }}>
          <div className="modal-sheet animate-slide-up glass" style={{ borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '42px' }}>🎉</span>
              <h3 style={{ fontSize: '20px', color: 'var(--neutral-dark)', marginTop: '8px' }}>¡Viaje Completado!</h3>
              <p style={{ color: 'var(--neutral-grey)', fontSize: '13px', marginTop: '4px' }}>
                Transporte de <strong>{lastFinishedRide.petName}</strong> finalizado con éxito.
              </p>
            </div>

            {/* Payment instruction card */}
            <div className="payment-receipt-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>Método de Pago:</span>
                <span style={{ fontWeight: '700', color: lastFinishedRide.paymentMethod === 'mercadopago' ? 'var(--secondary)' : 'var(--success)' }}>
                  {lastFinishedRide.paymentMethod === 'mercadopago' ? '📱 MERCADO PAGO' : '💵 EFECTIVO'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700' }}>Monto a Cobrar:</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--neutral-dark)' }}>
                  ${lastFinishedRide.price}
                </span>
              </div>

              {lastFinishedRide.paymentMethod === 'mercadopago' ? (
                <div className="mp-alias-box" style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-grey)', textAlign: 'left' }}>
                    Mostrale este ALIAS al cliente para transferir:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eef2f6', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginTop: '6px' }}>
                    <code style={{ fontSize: '14px', fontWeight: '700', color: 'var(--neutral-dark)' }}>tucupets.chofer.mp</code>
                    <button onClick={handleCopyAlias} className="copy-btn">
                      {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px', borderRadius: '8px', marginTop: '14px', fontSize: '12px', fontWeight: '500' }}>
                  📢 Por favor, cobrá el total de <strong>${lastFinishedRide.price}</strong> en efectivo directamente al pasajero antes de que descienda la mascota.
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '18px' }}
              onClick={() => setLastFinishedRide(null)}
            >
              Cerrar y Volver a En Línea 🚐
            </button>
          </div>
        </div>
      )}

      <style>{`
        .driver-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--neutral-light);
          overflow: hidden;
        }
        .driver-header {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          z-index: 1000;
        }
        .driver-header-title {
          font-family: var(--font-title);
          font-size: 18px;
          font-weight: 700;
          color: var(--neutral-dark);
        }
        .switch-role-btn-owner {
          background-color: var(--secondary-light);
          color: var(--secondary);
          border: 1px solid rgba(99, 102, 241, 0.3);
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .switch-role-btn-owner:hover {
          background-color: var(--secondary);
          color: white;
        }
        .driver-dashboard-scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        .online-toggle-bar {
          display: flex;
          background-color: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 14px 20px;
          box-shadow: var(--shadow-sm);
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .status-dot.online {
          background-color: var(--success);
          box-shadow: 0 0 8px var(--success);
        }
        .status-dot.offline {
          background-color: var(--neutral-grey);
        }
        .online-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background-color: white;
          color: var(--danger);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .online-btn.active {
          background-color: var(--success);
          color: white;
          border-color: var(--success);
          box-shadow: 0 4px 10px rgba(74, 222, 128, 0.4);
        }
        .setting-toggle-btn {
          flex: 1;
          background-color: #f1f5f9;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--neutral-grey);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .setting-toggle-btn.active-wa {
          background-color: #25d36622;
          border-color: #25d36688;
          color: #15803d;
        }
        .setting-toggle-btn.active-gps {
          background-color: #e0f2fe;
          border-color: #bae6fd;
          color: #0369a1;
        }
        .driver-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .metric-card {
          background-color: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }
        .metric-val {
          font-size: 20px;
          font-weight: 700;
          color: var(--neutral-dark);
          margin-top: 8px;
        }
        .metric-lbl {
          font-size: 11px;
          color: var(--neutral-grey);
          margin-top: 2px;
        }
        .waiting-placeholder {
          background-color: white;
          border: 1px dashed var(--border);
          border-radius: var(--radius-md);
          padding: 30px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          justify-content: center;
        }
        .radar-circle-mini {
          position: relative;
          width: 60px;
          height: 60px;
          background: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-ring-mini {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid var(--primary);
          border-radius: 50%;
          animation: pulse-ring 2s infinite;
        }
        .request-card {
          background-color: white;
          border: 2px solid var(--success);
          border-radius: var(--radius-md);
          padding: 20px;
          box-shadow: var(--shadow-md);
          text-align: left;
        }
        .request-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge-new {
          background-color: var(--success-light);
          color: var(--success);
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
        .request-pet-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .request-avatar {
          width: 50px;
          height: 50px;
          background-color: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .route-details {
          position: relative;
          padding-left: 16px;
        }
        .route-details::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background-color: #cbd5e1;
        }
        .route-point {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
        }
        .point-dot-p {
          color: var(--primary);
          margin-left: -17px;
          font-size: 14px;
        }
        .point-dot-d {
          color: var(--danger);
          margin-left: -17px;
          font-size: 14px;
        }
        .point-text {
          text-align: left;
          color: var(--neutral-dark);
          line-height: 1.3;
        }
        .nav-layout {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .nav-banner {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          background-color: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 100;
          box-shadow: var(--shadow-md);
        }
        .nav-banner-icon {
          width: 38px;
          height: 38px;
          background-color: var(--secondary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rotate-nav {
          transform: rotate(45deg);
        }
        .nav-banner-eta {
          font-size: 14px;
          font-weight: 700;
          background-color: var(--secondary-light);
          color: var(--secondary);
          padding: 6px 10px;
          border-radius: 8px;
        }
        .driver-bottom-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: white;
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
          padding: 16px 24px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          box-shadow: 0 -10px 30px rgba(0,0,0,0.08);
          z-index: 100;
        }
        .pet-passenger-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pet-emoji-avatar {
          width: 44px;
          height: 44px;
          background-color: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .care-notes-box {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          margin-top: 10px;
          font-size: 12px;
          text-align: left;
          color: #b45309;
        }
        .pin-verification-container {
          margin-top: 14px;
          padding: 12px;
          background-color: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .pin-input {
          flex: 1;
          height: 44px;
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 4px;
          padding: 0;
          background-color: white;
        }
        .pin-error-border {
          border-color: var(--danger) !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        }
        .completed-rides-section {
          display: flex;
          flex-direction: column;
        }
        .completed-ride-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          box-shadow: var(--shadow-sm);
        }
        .payment-receipt-card {
          background-color: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          text-align: left;
        }
        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .copy-btn:hover {
          background-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};
