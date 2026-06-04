import React from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Phone, Shield, XCircle } from 'lucide-react';

interface ActiveRideStatusProps {
  onOpenChat: () => void;
}

export const ActiveRideStatus: React.FC<ActiveRideStatusProps> = ({ onOpenChat }) => {
  const { activeRide, cancelRide, driverWhatsapp } = useApp();

  if (!activeRide) return null;

  const { status, driverName, driverRating, vehicleInfo, price, eta, petName, pinCode, paymentMethod } = activeRide;

  // Determine label and color for different states
  let statusText = '';
  let statusColor = 'var(--secondary)';
  let progressWidth = '0%';

  switch (status) {
    case 'accepted':
      statusText = 'Chofer en camino a buscar a ' + petName;
      statusColor = 'var(--secondary)';
      progressWidth = '25%';
      break;
    case 'arrived':
      statusText = '¡El chofer llegó! Decile el PIN de viaje.';
      statusColor = 'var(--primary-dark)';
      progressWidth = '50%';
      break;
    case 'started':
      statusText = 'En viaje con ' + petName;
      statusColor = 'var(--success)';
      progressWidth = '75%';
      break;
    case 'completed':
      statusText = 'Viaje finalizado con éxito';
      statusColor = 'var(--success)';
      progressWidth = '100%';
      break;
    default:
      statusText = 'Solicitando viaje...';
      progressWidth = '10%';
  }

  // Construct WhatsApp Link
  const driverPhoneClean = activeRide.driverPhone ? activeRide.driverPhone.replace(/[+\s-]/g, '') : '';
  const waMessage = encodeURIComponent(`Hola ${driverName || 'Chofer'}, soy el dueño de ${petName} por el viaje de TucuPets. Mi PIN es ${pinCode}.`);
  const waLink = `https://wa.me/${driverPhoneClean}?text=${waMessage}`;

  return (
    <div className="active-ride-sheet glass animate-slide-up">
      {/* Indicator handle for dragging visual */}
      <div className="sheet-handle"></div>

      {/* Main Status Header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="status-badge" style={{ backgroundColor: statusColor + '22', color: statusColor }}>
            ● {status.toUpperCase()}
          </span>
          {eta > 0 && (
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--neutral-grey)' }}>
              ETA: <strong style={{ color: 'var(--neutral-dark)' }}>{eta} min</strong>
            </span>
          )}
        </div>
        <h3 style={{ fontSize: '16px', marginTop: '6px', fontWeight: '600' }}>{statusText}</h3>
      </div>

      {/* PIN Code Box (Safety Indicator) */}
      {(status === 'accepted' || status === 'arrived') && (
        <div className="pin-indicator-box">
          <div style={{ fontSize: '11px', color: 'var(--primary-dark)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔑 PIN de Seguridad para Iniciar Viaje
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--neutral-dark)', letterSpacing: '8px', marginTop: '4px' }}>
            {pinCode}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--neutral-grey)', marginTop: '2px' }}>
            Dale este código al chofer cuando llegue para que pueda iniciar el viaje.
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-container" style={{ marginTop: '10px' }}>
        <div className="progress-bar" style={{ width: progressWidth, backgroundColor: statusColor }}></div>
      </div>

      {/* Driver & Car Details */}
      {driverName && (
        <div className="driver-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="driver-avatar-circle">🧑‍✈️</div>
            <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '15px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{driverName}</div>
              <div style={{ fontSize: '12px', color: 'var(--neutral-grey)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                ⭐ {driverRating} • {vehicleInfo}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
            <button className="action-circle-btn" onClick={onOpenChat} title="Chat Interno">
              <MessageSquare size={18} />
            </button>
            {driverWhatsapp && (
              <a 
                className="action-circle-btn wa-btn" 
                href={waLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Contactar por WhatsApp"
              >
                💬
              </a>
            )}
            <a className="action-circle-btn" href={`tel:${activeRide.driverPhone}`} title="Llamar Conductor">
              <Phone size={18} />
            </a>
          </div>
        </div>
      )}

      {/* Quick Details & Safe Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '12px', color: 'var(--neutral-grey)' }}>
            Pago: <strong style={{ color: 'var(--neutral-dark)' }}>{paymentMethod === 'mercadopago' ? 'Mercado Pago 📱' : 'Efectivo 💵'}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--success)', fontWeight: '600', marginTop: '2px' }}>
            <Shield size={12} /> Seguro TucuCare Activo
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--neutral-grey)' }}>Costo del Viaje</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--neutral-dark)' }}>${price}</div>
        </div>
      </div>

      {/* Cancel Button */}
      {(status === 'accepted' || status === 'arrived') && (
        <button className="cancel-ride-btn" onClick={cancelRide}>
          <XCircle size={14} /> Cancelar Viaje
        </button>
      )}

      <style>{`
        .active-ride-sheet {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          padding-bottom: calc(16px + env(safe-area-inset-bottom));
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.08);
          z-index: 100;
          text-align: left;
          background-color: white;
        }
        .sheet-handle {
          width: 36px;
          height: 5px;
          background-color: #e2e8f0;
          border-radius: 3px;
          margin: 0 auto;
          margin-bottom: 10px;
        }
        .status-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .pin-indicator-box {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #fde68a;
          border-radius: var(--radius-md);
          padding: 10px 14px;
          text-align: center;
          margin-top: 10px;
        }
        .progress-container {
          width: 100%;
          height: 6px;
          background-color: #f1f5f9;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .progress-bar {
          height: 100%;
          border-radius: 10px;
          transition: width 0.5s ease, background-color 0.5s ease;
        }
        .driver-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
        }
        .driver-avatar-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .action-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: white;
          color: var(--neutral-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .action-circle-btn:hover {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          border-color: var(--primary);
        }
        .action-circle-btn.wa-btn {
          background-color: #25d36622;
          border-color: #25d36644;
          font-size: 16px;
        }
        .action-circle-btn.wa-btn:hover {
          background-color: #25d366;
          color: white;
          border-color: #25d366;
        }
        .cancel-ride-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          background: none;
          border: none;
          color: var(--danger);
          font-size: 13px;
          font-weight: 600;
          margin-top: 10px;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }
        .cancel-ride-btn:hover {
          background-color: var(--danger-light);
        }
      `}</style>
    </div>
  );
};
