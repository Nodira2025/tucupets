import React from 'react';
import { useApp } from '../context/AppContext';

export const DriverMatching: React.FC = () => {
  const { activeRide, cancelRide } = useApp();

  if (!activeRide) return null;

  return (
    <div className="radar-container animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--neutral-dark)' }}>Buscando Conductor...</h2>
        <p style={{ color: 'var(--neutral-grey)', marginTop: '8px', fontSize: '15px' }}>
          Conectando con choferes especializados para <strong>{activeRide.petName}</strong>
        </p>
      </div>

      <div className="radar-circle">
        <div className="radar-ring"></div>
        <div className="radar-ring"></div>
        <div className="radar-ring"></div>
        <div className="radar-avatar">
          🐾
        </div>
      </div>

      <div className="info-card glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚐</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>TucuPet {activeRide.serviceClass.toUpperCase()}</div>
            <div style={{ fontSize: '12px', color: 'var(--neutral-grey)' }}>Precio Estimado: ${activeRide.price}</div>
          </div>
        </div>
      </div>

      <button 
        className="btn btn-secondary" 
        onClick={cancelRide}
        style={{ marginTop: 'auto', width: '100%', maxWidth: '280px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: 'none' }}
      >
        Cancelar Solicitud
      </button>

      <style>{`
        .info-card {
          padding: 16px 20px;
          border-radius: var(--radius-md);
          width: 100%;
          max-width: 280px;
          margin-bottom: 30px;
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
};
