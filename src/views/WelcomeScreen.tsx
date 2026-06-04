import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Sparkles, User, Phone, Car, Mail, Lock } from 'lucide-react';

const AVATARS = ['🐶', '🐱', '🦜', '🦁', '🦊', '🧑‍💻', '👩‍⚕️', '🚗'];

export const WelcomeScreen: React.FC = () => {
  const { 
    registerUser, 
    userProfile, 
    selectRole, 
    resetAll, 
    user, 
    loading,
    signUpWithEmail,
    signInWithEmail,
    loginWithGoogle
  } = useApp();

  // Auth panel states
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Onboarding form states (shown if logged in but role is 'none')
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '+54 9 381 ');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '🐶');
  const [role, setRole] = useState<'owner' | 'driver'>('owner');
  const [vehicleInfo, setVehicleInfo] = useState(userProfile?.vehicleInfo || 'Renault Kangoo');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage('¡Registro exitoso! Por favor revisá tu casilla de correo para confirmar tu email o ingresá.');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setAuthError(error.message);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al autenticar');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    setAuthLoading(true);
    await registerUser({
      fullName,
      phone,
      role,
      avatar,
      vehicleInfo: role === 'driver' ? vehicleInfo : undefined
    });
    setAuthLoading(false);
  };

  // Render Loader if authentication profile is verifying
  if (loading) {
    return (
      <div className="welcome-container animate-fade-in" style={{ justifyContent: 'center' }}>
        <div className="radar-circle-mini">
          <div className="radar-ring-mini"></div>
          <span style={{ fontSize: '24px' }}>🐾</span>
        </div>
        <p style={{ marginTop: '14px', color: 'var(--neutral-grey)', fontSize: '14px', fontWeight: '600' }}>
          Cargando perfiles seguros...
        </p>
      </div>
    );
  }

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

      {!user ? (
        /* ================= PHASE 1: LOGIN / SIGNUP SCREEN ================= */
        <div className="registration-card glass animate-slide-up">
          <div className="auth-toggle-row">
            <button 
              className={`auth-toggle-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signin'); setAuthError(''); }}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signup'); setAuthError(''); }}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ marginTop: '16px' }}>
            {/* Email field */}
            <div className="input-group">
              <label>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Mail size={16} /></span>
                <input 
                  type="email" 
                  className="input-field-icon"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="input-group">
              <label>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Lock size={16} /></span>
                <input 
                  type="password" 
                  className="input-field-icon"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {authError && (
              <div className="auth-alert error">
                ⚠️ {authError}
              </div>
            )}

            {authMessage && (
              <div className="auth-alert success">
                📧 {authMessage}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={authLoading}
            >
              {authLoading ? 'Procesando...' : authMode === 'signin' ? 'Ingresar 🚀' : 'Crear Cuenta 🚀'}
            </button>
          </form>

          {/* Social Sign-in option */}
          <div className="quick-demo-divider" style={{ margin: '18px 0' }}>
            <span>O continuar con</span>
          </div>

          <button 
            type="button" 
            className="google-signin-btn btn"
            onClick={loginWithGoogle}
            disabled={authLoading}
          >
            <span style={{ fontSize: '18px', marginRight: '6px' }}>🌐</span> Google OAuth
          </button>
        </div>
      ) : userProfile && userProfile.role === 'none' ? (
        /* ================= PHASE 2: ONBOARDING ROLE FORM ================= */
        <div className="registration-card glass animate-slide-up">
          <h2 style={{ fontSize: '18px', marginBottom: '10px', textAlign: 'center' }}>Completar tu Perfil 👤</h2>
          <p style={{ fontSize: '12px', color: 'var(--neutral-grey)', textAlign: 'center', marginBottom: '16px' }}>
            Vinculado con el correo: <strong>{user.email}</strong>
          </p>

          <form onSubmit={handleOnboardingSubmit}>
            {/* Avatar Row */}
            <div className="input-group">
              <label>Elegí tu Avatar</label>
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

            {/* Full Name field */}
            <div className="input-group">
              <label>Nombre y Apellido</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><User size={16} /></span>
                <input 
                  type="text" 
                  className="input-field-icon"
                  placeholder="Ej: Franco Tucu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone field */}
            <div className="input-group">
              <label>Número de WhatsApp (Celular)</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Phone size={16} /></span>
                <input 
                  type="tel" 
                  className="input-field-icon"
                  placeholder="Ej: +54 9 381 555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Switch */}
            <div className="input-group">
              <label>¿Cómo vas a usar TucuPets?</label>
              <div className="role-selector-row">
                <button 
                  type="button"
                  className={`role-btn-choice ${role === 'owner' ? 'active-owner' : ''}`}
                  onClick={() => setRole('owner')}
                >
                  🐕 Dueño de Mascota
                </button>
                <button 
                  type="button"
                  className={`role-btn-choice ${role === 'driver' ? 'active-driver' : ''}`}
                  onClick={() => setRole('driver')}
                >
                  🚐 Chofer / Conductor
                </button>
              </div>
            </div>

            {/* Driver specifications */}
            {role === 'driver' && (
              <div className="input-group animate-fade-in">
                <label>Detalles del Vehículo Habilitado</label>
                <div style={{ position: 'relative' }}>
                  <span className="input-icon-field"><Car size={16} /></span>
                  <input 
                    type="text" 
                    className="input-field-icon"
                    placeholder="Ej: Fiorino Blanca (Habilitado)"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }}
              disabled={authLoading}
            >
              {authLoading ? 'Guardando...' : 'Comenzar a usar la app 🚀'}
            </button>
          </form>

          <button className="reset-btn-link" onClick={resetAll} style={{ width: '100%', marginTop: '14px', textAlign: 'center' }}>
            Cancelar / Cerrar Sesión
          </button>
        </div>
      ) : (
        /* ================= PHASE 3: RETURNING LOGGED USER CARD ================= */
        <div className="cards-section animate-slide-up">
          <div className="profile-greeting glass">
            <span style={{ fontSize: '32px' }}>{userProfile?.avatar}</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--neutral-grey)' }}>Sesión activa como:</div>
              <div style={{ fontSize: '16px', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{userProfile?.fullName}</div>
              <div style={{ fontSize: '10px', color: 'var(--neutral-grey)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <button className="change-user-btn" onClick={resetAll} style={{ color: 'var(--danger)' }}>Salir</button>
          </div>

          <button 
            className="role-card" 
            onClick={() => selectRole('owner')}
          >
            <div className="role-card-icon owner-bg">
              <span>🐕</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Modo Pasajero / Dueño</h3>
              <p style={{ fontSize: '13px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                Quiero pedir viajes para mis mascotas en Tucumán.
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
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Modo Conductor / Chofer</h3>
              <p style={{ fontSize: '13px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                Quiero ponerme en línea y realizar viajes en la ciudad.
              </p>
            </div>
            <div className="arrow-indicator">➔</div>
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
          <span>Base de Datos Segura</span>
        </div>
      </div>

      <style>{`
        .welcome-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          padding: 20px;
          background: linear-gradient(180deg, #fff7ed 0%, #fff 60%);
          overflow-y: auto;
        }
        .logo-section {
          margin-top: 10px;
          margin-bottom: 16px;
          text-align: center;
        }
        .brand-badge {
          width: 60px;
          height: 60px;
          background-color: var(--primary);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          margin: 0 auto;
          box-shadow: var(--shadow-md);
          animation: bounce 3s infinite;
        }
        .brand-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--neutral-dark);
          margin-top: 8px;
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
          padding: 16px;
          box-shadow: var(--shadow-md);
        }
        .auth-toggle-row {
          display: flex;
          background-color: #f1f5f9;
          border-radius: 10px;
          padding: 3px;
        }
        .auth-toggle-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--neutral-grey);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .auth-toggle-btn.active {
          background-color: white;
          color: var(--neutral-dark);
          box-shadow: var(--shadow-sm);
        }
        .auth-alert {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 10px;
          text-align: left;
        }
        .auth-alert.error {
          background-color: var(--danger-light);
          color: var(--danger);
          border: 1px solid #fecaca;
        }
        .auth-alert.success {
          background-color: var(--success-light);
          color: var(--success);
          border: 1px solid #bbf7d0;
        }
        .google-signin-btn {
          width: 100%;
          background-color: white;
          border: 1px solid var(--border);
          color: var(--neutral-dark);
          padding: 12px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .google-signin-btn:hover {
          background-color: #f8fafc;
        }
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-top: 4px;
        }
        .avatar-btn {
          height: 40px;
          background-color: #f1f5f9;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .avatar-btn:hover {
          background-color: var(--primary-light);
        }
        .avatar-btn.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
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
