import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Sparkles, User, Phone, Car } from 'lucide-react';

const AVATARS = ['🐶', '🐱', '🦜', '🦁', '🦊', '🧑‍💻', '👩‍⚕️', '🚗'];

export const WelcomeScreen: React.FC = () => {
  const { registerUser, userProfile, selectRole, resetAll } = useApp();

  // Form states
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '+54 9 381 123-4567');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '🐶');
  const [role, setRole] = useState<'owner' | 'driver'>('owner');
  const [vehicleInfo, setVehicleInfo] = useState(userProfile?.vehicleInfo || 'Kangoo Blanca Habilitada');
  const [isNewUser, setIsNewUser] = useState(!userProfile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    registerUser({
      fullName,
      phone,
      role,
      avatar,
      vehicleInfo: role === 'driver' ? vehicleInfo : undefined
    });
  };

  const handleQuickDemo = (demoRole: 'owner' | 'driver') => {
    registerUser({
      fullName: demoRole === 'owner' ? 'Franco Pasajero' : 'Marcos Chofer',
      phone: demoRole === 'owner' ? '+54 9 381 555-1111' : '+54 9 381 555-9999',
      role: demoRole,
      avatar: demoRole === 'owner' ? '🐶' : '🚗',
      vehicleInfo: demoRole === 'driver' ? 'Pet-Van Fiorino Habilitada' : undefined
    });
  };

  return (
    <div className="welcome-container animate-fade-in">
      {/* Brand logo & title */}
      <div className="logo-section">
        <div className="brand-badge">
          <span>🐾</span>
        </div>
        <h1 className="brand-title">TUCUPETS</h1>
        <p className="brand-subtitle">El Uber de las Mascotas con Cuidado Especializado</p>
        <span className="tucuman-tag">📍 San Miguel de Tucumán</span>
      </div>

      {isNewUser ? (
        /* Registration / Profile Form Card */
        <div className="registration-card glass animate-slide-up">
          <h2 style={{ fontSize: '18px', marginBottom: '14px', textAlign: 'center' }}>Crear Perfil Local 👤</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Avatar Select Row */}
            <div className="input-group">
              <label>Seleccioná tu Avatar</label>
              <div className="avatar-grid">
                {AVATARS.map((av) => (
                  <button 
                    key={av}
                    type="button"
                    className={`avatar-btn ${avatar === av ? 'selected' : ''}`}
                    onClick={() => setAvatar(av)}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="input-group">
              <label>Nombre y Apellido</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><User size={16} /></span>
                <input 
                  type="text" 
                  className="input-field-icon"
                  placeholder="Ej: Franco Martínez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div className="input-group">
              <label>Teléfono Celular</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Phone size={16} /></span>
                <input 
                  type="tel" 
                  className="input-field-icon"
                  placeholder="Ej: +54 9 381 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Select Buttons */}
            <div className="input-group">
              <label>¿Cómo querés ingresar?</label>
              <div className="role-selector-row">
                <button 
                  type="button"
                  className={`role-btn-choice ${role === 'owner' ? 'active-owner' : ''}`}
                  onClick={() => setRole('owner')}
                >
                  🐕 Dueño (Pedir Viajes)
                </button>
                <button 
                  type="button"
                  className={`role-btn-choice ${role === 'driver' ? 'active-driver' : ''}`}
                  onClick={() => setRole('driver')}
                >
                  🚐 Chofer (Transportar)
                </button>
              </div>
            </div>

            {/* Driver Additional Fields */}
            {role === 'driver' && (
              <div className="input-group animate-fade-in">
                <label>Detalles del Vehículo (Habilitado)</label>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon-field"><Car size={16} /></span>
                  <input 
                    type="text" 
                    className="input-field-icon"
                    placeholder="Ej: Partner Gris Habilitada Mascotas"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Registrarse y Entrar 🚀
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="quick-demo-divider">
            <span>O entrar rápido para pruebas</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '10px 4px', fontSize: '12px' }} onClick={() => handleQuickDemo('owner')}>
              🔑 Demo Cliente
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '10px 4px', fontSize: '12px' }} onClick={() => handleQuickDemo('driver')}>
              🔑 Demo Chofer
            </button>
          </div>
        </div>
      ) : (
        /* Returning User role selector */
        <div className="cards-section animate-slide-up">
          <div className="profile-greeting glass">
            <span style={{ fontSize: '32px' }}>{userProfile?.avatar}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: 'var(--neutral-grey)' }}>Bienvenido de nuevo,</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{userProfile?.fullName}</div>
            </div>
            <button className="change-user-btn" onClick={() => setIsNewUser(true)}>Cambiar</button>
          </div>

          <button 
            className="role-card" 
            onClick={() => selectRole('owner')}
          >
            <div className="role-card-icon owner-bg">
              <span>🐕</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Modo Dueño</h3>
              <p style={{ fontSize: '13px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                Quiero transportar a mi mascota con amor en Tucumán.
              </p>
            </div>
            <div className="arrow-indicator">➔</div>
          </button>

          <button 
            className="role-card" 
            onClick={() => selectRole('driver')}
          >
            <div className="role-card-icon driver-bg">
              <span>🚐</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Modo Conductor</h3>
              <p style={{ fontSize: '13px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                Quiero ganar dinero transportando mascotas con mi vehículo.
              </p>
            </div>
            <div className="arrow-indicator">➔</div>
          </button>

          <button className="reset-btn-link" onClick={resetAll} style={{ marginTop: '20px' }}>
            Limpiar Datos de Simulación
          </button>
        </div>
      )}

      {/* Trust factors */}
      <div className="trust-footer" style={{ marginTop: '30px' }}>
        <div className="trust-item">
          <Shield size={14} style={{ color: 'var(--success)' }} />
          <span>Soporte Local</span>
        </div>
        <div className="trust-item">
          <Sparkles size={14} style={{ color: 'var(--primary-dark)' }} />
          <span>Tucumán Habilitado</span>
        </div>
      </div>

      <style>{`
        .welcome-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          padding: 24px 20px;
          background: linear-gradient(180deg, #fff7ed 0%, #fff 60%);
          overflow-y: auto;
        }
        .logo-section {
          margin-top: 10px;
          margin-bottom: 20px;
          text-align: center;
        }
        .brand-badge {
          width: 64px;
          height: 64px;
          background-color: var(--primary);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto;
          box-shadow: var(--shadow-md);
          animation: bounce 3s infinite;
        }
        .brand-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--neutral-dark);
          margin-top: 10px;
          letter-spacing: 0.5px;
        }
        .brand-subtitle {
          font-size: 13px;
          color: var(--neutral-grey);
          margin-top: 4px;
          padding: 0 10px;
          line-height: 1.4;
        }
        .tucuman-tag {
          display: inline-block;
          background-color: var(--primary-light);
          color: var(--primary-dark);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          margin-top: 6px;
          border: 1px solid rgba(247, 185, 87, 0.2);
        }
        .registration-card {
          width: 100%;
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 20px;
          box-shadow: var(--shadow-md);
        }
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 4px;
        }
        .avatar-btn {
          height: 44px;
          background-color: #f1f5f9;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .avatar-btn:hover {
          background-color: var(--primary-light);
        }
        .avatar-btn.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
          box-shadow: 0 2px 6px rgba(247, 185, 87, 0.2);
        }
        .input-icon-field {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--neutral-grey);
          display: flex;
          align-items: center;
        }
        .role-selector-row {
          display: flex;
          gap: 8px;
        }
        .role-btn-choice {
          flex: 1;
          padding: 10px 4px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background-color: white;
          font-size: 11px;
          font-weight: 700;
          color: var(--neutral-grey);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-btn-choice.active-owner {
          background-color: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary-dark);
        }
        .role-btn-choice.active-driver {
          background-color: var(--secondary-light);
          border-color: var(--secondary);
          color: var(--secondary);
        }
        .quick-demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-top: 14px;
          color: var(--neutral-grey);
          font-size: 10px;
        }
        .quick-demo-divider::before, .quick-demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border);
        }
        .quick-demo-divider:not(:empty)::before {
          margin-right: .5em;
        }
        .quick-demo-divider:not(:empty)::after {
          margin-left: .5em;
        }
        .profile-greeting {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background-color: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          width: 100%;
          margin-bottom: 16px;
        }
        .change-user-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--primary-dark);
          font-weight: 700;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
        }
        .cards-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }
        .role-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: var(--radius-md);
          background-color: white;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .role-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }
        .role-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 24px;
        }
        .owner-bg {
          background-color: var(--primary-light);
        }
        .driver-bg {
          background-color: var(--secondary-light);
        }
        .arrow-indicator {
          position: absolute;
          right: 16px;
          color: var(--neutral-grey);
          font-size: 16px;
        }
        .trust-footer {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
          font-size: 11px;
          color: var(--neutral-grey);
          font-weight: 500;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .reset-btn-link {
          background: none;
          border: none;
          color: var(--neutral-grey);
          text-decoration: underline;
          font-size: 11px;
          cursor: pointer;
          opacity: 0.7;
        }
        .reset-btn-link:hover {
          color: var(--danger);
        }
      `}</style>
    </div>
  );
};
