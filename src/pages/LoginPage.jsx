import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Lock, Mail, User, ArrowRight, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const { login, register, forgotPassword } = useAuth();

  // Modos de vista: 'login', 'register', 'forgot'
  const [mode, setMode] = useState('login');

  // Campos de formulario (siempre en blanco)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Mensajes de error e información
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message || 'Correo de recuperación enviado con éxito.');
    } catch (err) {
      setError(err.message || 'Error al solicitar la recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0082c8 0%, #004e7a 100%)',
      padding: '20px'
    }}>
      <div className="modal-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        
        {/* Header con Icono de Marca */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            {mode === 'login' && <UserCheck size={32} color="var(--primary)" />}
            {mode === 'register' && <User size={32} color="var(--primary)" />}
            {mode === 'forgot' && <KeyRound size={32} color="var(--primary)" />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            {mode === 'login' && 'Visita Hermanos'}
            {mode === 'register' && 'Registro de Visitador'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'login' && 'Plataforma de Gestión e Integración API REST'}
            {mode === 'register' && 'Crea tu cuenta de voluntario para visitas de campo'}
            {mode === 'forgot' && 'Ingresa tu correo para enviarte el enlace de recuperación'}
          </p>
        </div>

        {/* Notificaciones de Error y Éxito */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODO 1: INICIAR SESIÓN */}
        {mode === 'login' && (
          <form onSubmit={handleSubmitLogin} autoComplete="off" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Mail size={18} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Contraseña</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setMode('forgot');
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="search-input-box" style={{ width: '100%', marginTop: '6px' }}>
                <Lock size={18} color="var(--text-muted)" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Autenticando en Firebase...' : 'Ingresar a la Plataforma'} <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setEmail('');
                  setPassword('');
                  setMode('register');
                }}
              >
                Regístrate aquí
              </button>
            </div>
          </form>
        )}

        {/* MODO 2: REGISTRO DE VISITADOR */}
        {mode === 'register' && (
          <form onSubmit={handleSubmitRegister} autoComplete="off" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label>Nombre Completo *</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <User size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Correo Electrónico *</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Mail size={18} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contraseña (mínimo 6 caracteres) *</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Lock size={18} color="var(--text-muted)" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarme como Visitador'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('login');
                }}
              >
                <ArrowLeft size={16} /> Volver al Login
              </button>
            </div>
          </form>
        )}

        {/* MODO 3: OLVIDASTE LA CONTRASEÑA */}
        {mode === 'forgot' && (
          <form onSubmit={handleSubmitForgot} autoComplete="off" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label>Correo Electrónico *</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Mail size={18} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Enviando correo...' : 'Enviar correo de recuperación'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('login');
                }}
              >
                <ArrowLeft size={16} /> Volver al Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
