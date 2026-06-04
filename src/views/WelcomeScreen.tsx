import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Sparkles, User, Phone, Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
    loginWithGoogle,
    isPasswordRecovery,
    sendPasswordResetEmail,
    updatePassword
  } = useApp();

  // Auth panel states
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Password recovery states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Onboarding form states (shown if logged in but role is 'none')
  const [fullName, setFullName] = useState(userProfile?.fullName || '');
  const [phone, setPhone] = useState(userProfile?.phone || '+54 9 381 ');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '🐶');
  const [role, setRole] = useState<'owner' | 'driver'>('owner');
  const [vehicleInfo, setVehicleInfo] = useState(userProfile?.vehicleInfo || 'Renault Kangoo');

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('tucupets_remember_email');
    const savedPassword = localStorage.getItem('tucupets_remember_password');
    const savedRemember = localStorage.getItem('tucupets_remember_me') === 'true';
    if (savedRemember) {
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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
          // If remember is checked, save email & password to local storage
          if (rememberMe) {
            localStorage.setItem('tucupets_remember_email', email);
            localStorage.setItem('tucupets_remember_password', password);
            localStorage.setItem('tucupets_remember_me', 'true');
          }
          setAuthMessage('¡Registro exitoso! Por favor revisá tu casilla de correo para confirmar tu email o ingresá.');
        }
      } else if (authMode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setAuthError(error.message);
        } else {
          // Save or clear credentials on successful sign-in
          if (rememberMe) {
            localStorage.setItem('tucupets_remember_email', email);
            localStorage.setItem('tucupets_remember_password', password);
            localStorage.setItem('tucupets_remember_me', 'true');
          } else {
            localStorage.removeItem('tucupets_remember_email');
            localStorage.removeItem('tucupets_remember_password');
            localStorage.removeItem('tucupets_remember_me');
          }
        }
      } else if (authMode === 'forgot') {
        const { error } = await sendPasswordResetEmail(email);
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthMessage('¡Enlace enviado! Por favor revisá tu casilla de correo para restablecer tu contraseña.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al procesar la solicitud');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    
    if (newPassword.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden');
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMessage('¡Tu contraseña ha sido restablecida con éxito! Ya puedes ingresar.');
        setNewPassword('');
        setConfirmPassword('');
        // Force logout to reset session so they can login with new pass
        await resetAll();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al actualizar la contraseña');
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

      {isPasswordRecovery ? (
        /* ================= PASSWORD RECOVERY SCREEN (PASSED FROM LINK) ================= */
        <div className="registration-card glass animate-slide-up">
          <h2 style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>Restablecer Contraseña 🔒</h2>
          <p style={{ fontSize: '12px', color: 'var(--neutral-grey)', textAlign: 'center', marginBottom: '16px' }}>
            Ingresá tu nueva contraseña para tu cuenta de TucuPets.
          </p>

          <form onSubmit={handleRecoverySubmit}>
            {/* New Password field */}
            <div className="input-group">
              <label>Nueva Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Lock size={16} /></span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input-field-icon"
                  style={{ paddingRight: '46px' }}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password field */}
            <div className="input-group">
              <label>Confirmar Nueva Contraseña</label>
              <div style={{ position: 'relative' }}>
                <span className="input-icon-field"><Lock size={16} /></span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input-field-icon"
                  style={{ paddingRight: '46px' }}
                  placeholder="Repetir nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {authLoading ? 'Guardando...' : 'Guardar Nueva Contraseña 💾'}
            </button>
          </form>

          <button 
            type="button"
            className="reset-btn-link" 
            onClick={resetAll} 
            style={{ width: '100%', marginTop: '16px', textAlign: 'center' }}
          >
            Cancelar y Volver al Inicio
          </button>
        </div>
      ) : !user ? (
        /* ================= PHASE 1: LOGIN / SIGNUP / FORGOT SCREEN ================= */
        <div className="registration-card glass animate-slide-up">
          {authMode !== 'forgot' ? (
            <div className="auth-toggle-row">
              <button 
                className={`auth-toggle-btn ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }}
              >
                Iniciar Sesión
              </button>
              <button 
                className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage(''); }}
              >
                Registrarse
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Recuperar Contraseña 🔑</h2>
              <p style={{ fontSize: '12px', color: 'var(--neutral-grey)', marginTop: '4px' }}>
                Te enviaremos un correo para que puedas restablecerla.
              </p>
            </div>
          )}

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

            {authMode !== 'forgot' && (
              <>
                {/* Password field */}
                <div className="input-group">
                  <label>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <span className="input-icon-field"><Lock size={16} /></span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="input-field-icon"
                      style={{ paddingRight: '46px' }}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox & Forgot Password Link */}
                <div className="remember-me-row">
                  <label className="remember-me-label">
                    <input 
                      type="checkbox" 
                      className="remember-me-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="remember-me-text">Recordar contraseña</span>
                  </label>
                  
                  {authMode === 'signin' && (
                    <button 
                      type="button" 
                      className="forgot-pass-link"
                      onClick={() => { setAuthMode('forgot'); setAuthError(''); setAuthMessage(''); }}
                    >
                      ¿La olvidaste?
                    </button>
                  )}
                </div>
              </>
            )}

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
              style={{ width: '100%', marginTop: authMode === 'forgot' ? '12px' : '6px' }}
              disabled={authLoading}
            >
              {authLoading 
                ? 'Procesando...' 
                : authMode === 'signin' 
                  ? 'Ingresar 🚀' 
                  : authMode === 'signup' 
                    ? 'Crear Cuenta 🚀' 
                    : 'Enviar Enlace 📧'}
            </button>

            {authMode === 'forgot' && (
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ width: '100%', marginTop: '8px', fontSize: '13px', padding: '8px' }}
                onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }}
              >
                Volver al Login
              </button>
            )}
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
          background: linear-gradient(180deg, #fffcf6 0%, #fff 70%);
          overflow-y: auto;
          position: relative;
        }
        .welcome-container::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(247, 185, 87, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
          z-index: 0;
          pointer-events: none;
        }
        .logo-section {
          margin-top: 15px;
          margin-bottom: 20px;
          text-align: center;
          z-index: 1;
        }
        .brand-badge {
          width: 68px;
          height: 68px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto;
          box-shadow: 0 8px 20px rgba(247, 185, 87, 0.4);
          animation: bounce 3s infinite;
        }
        .brand-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--neutral-dark);
          margin-top: 10px;
          letter-spacing: 0.5px;
        }
        .brand-subtitle {
          font-size: 13px;
          color: var(--neutral-grey);
          margin-top: 6px;
          padding: 0 12px;
          line-height: 1.45;
          font-weight: 500;
        }
        .tucuman-tag {
          display: inline-block;
          background-color: var(--primary-light);
          color: var(--primary-dark);
          font-size: 11px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 8px;
          border: 1px solid rgba(247, 185, 87, 0.25);
          box-shadow: 0 2px 4px rgba(247, 185, 87, 0.05);
        }
        .registration-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.6);
          padding: 24px;
          box-shadow: 0 20px 40px rgba(220, 180, 140, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease;
          z-index: 1;
        }
        .auth-toggle-row {
          display: flex;
          background-color: rgba(241, 245, 249, 0.8);
          border-radius: 14px;
          padding: 4px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          margin-bottom: 8px;
        }
        .auth-toggle-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 12px;
          font-size: 14px;
          font-weight: 700;
          color: var(--neutral-grey);
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-toggle-btn.active {
          background-color: white;
          color: var(--neutral-dark);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        .input-field-icon {
          width: 100%;
          padding: 14px 18px;
          padding-left: 42px;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: rgba(255, 255, 255, 0.9);
          color: var(--neutral-dark);
          transition: all 0.25s ease;
          font-size: 14px;
          font-weight: 500;
        }
        .input-field-icon:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(247, 185, 87, 0.15);
        }
        .password-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--neutral-grey);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .password-toggle-btn:hover {
          color: var(--neutral-dark);
          background-color: rgba(0, 0, 0, 0.05);
        }
        .remember-me-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 2px;
          margin-bottom: 18px;
          padding-left: 2px;
          padding-right: 2px;
        }
        .remember-me-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .remember-me-checkbox {
          width: 17px;
          height: 17px;
          border-radius: 5px;
          border: 1px solid rgba(226, 232, 240, 1);
          accent-color: var(--primary);
          cursor: pointer;
        }
        .remember-me-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--neutral-grey);
          transition: color 0.2s ease;
        }
        .remember-me-label:hover .remember-me-text {
          color: var(--neutral-dark);
        }
        .forgot-pass-link {
          background: none;
          border: none;
          color: var(--primary-dark);
          font-size: 13px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .forgot-pass-link:hover {
          color: var(--neutral-dark);
        }
        .auth-alert {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 12px;
          text-align: left;
          animation: fade-in 0.2s ease;
        }
        .auth-alert.error {
          background-color: var(--danger-light);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .auth-alert.success {
          background-color: var(--success-light);
          color: var(--success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }
        .google-signin-btn {
          width: 100%;
          background-color: white;
          border: 1px solid rgba(226, 232, 240, 0.8);
          color: var(--neutral-dark);
          padding: 14px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .google-signin-btn:hover {
          background-color: #f8fafc;
          border-color: rgba(203, 213, 225, 0.8);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.04);
        }
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 6px;
        }
        .avatar-btn {
          height: 44px;
          background-color: #f8fafc;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 10px;
          font-size: 22px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .avatar-btn:hover {
          background-color: var(--primary-light);
          border-color: rgba(247, 185, 87, 0.4);
        }
        .avatar-btn.selected {
          border-color: var(--primary);
          background-color: var(--primary-light);
          box-shadow: 0 0 0 2px rgba(247, 185, 87, 0.2);
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
          gap: 10px;
        }
        .role-btn-choice {
          flex: 1;
          padding: 12px 6px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background-color: white;
          font-size: 12px;
          font-weight: 700;
          color: var(--neutral-grey);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-btn-choice.active-owner {
          background-color: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary-dark);
          box-shadow: 0 4px 10px rgba(247, 185, 87, 0.15);
        }
        .role-btn-choice.active-driver {
          background-color: var(--secondary-light);
          border-color: var(--secondary);
          color: var(--secondary);
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.15);
        }
        .quick-demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--neutral-grey);
          font-size: 11px;
          font-weight: 600;
        }
        .quick-demo-divider::before, .quick-demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        }
        .quick-demo-divider:not(:empty)::before {
          margin-right: .8em;
        }
        .quick-demo-divider:not(:empty)::after {
          margin-left: .8em;
        }
        .profile-greeting {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background-color: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          width: 100%;
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .change-user-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--primary-dark);
          font-weight: 700;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
        }
        .cards-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          z-index: 1;
        }
        .role-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 18px;
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
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 26px;
        }
        .owner-bg {
          background-color: var(--primary-light);
        }
        .driver-bg {
          background-color: var(--secondary-light);
        }
        .arrow-indicator {
          position: absolute;
          right: 18px;
          color: var(--neutral-grey);
          font-size: 18px;
        }
        .trust-footer {
          display: flex;
          justify-content: center;
          gap: 16px;
          width: 100%;
          font-size: 12px;
          color: var(--neutral-grey);
          font-weight: 600;
          z-index: 1;
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
          font-size: 12px;
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
