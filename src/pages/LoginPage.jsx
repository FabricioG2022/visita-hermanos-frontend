import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserCheck, Lock, Mail, ArrowRight, KeyRound, CheckCircle, ArrowLeft, Shield, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { login, forgotPassword } = useAuth();

  // Modos de vista: 'login', 'forgot'
  const [mode, setMode] = useState('login');

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mensajes de error e información
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Pre-calentamiento silencioso del servidor apenas se abre la pantalla de Login
  useEffect(() => {
    api.ping();
  }, []);

  // Timer para avisar amigablemente al usuario si Render está saliendo de reposo (> 2.5 seg)
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setIsWakingUp(true);
      }, 2500);
    } else {
      setIsWakingUp(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #00629b 0%, #003f66 100%)',
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
            {mode === 'login' && <Shield size={32} color="var(--primary)" aria-hidden="true" />}
            {mode === 'forgot' && <KeyRound size={32} color="var(--primary)" aria-hidden="true" />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            {mode === 'login' && 'Visita Hermanos'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mode === 'login' && 'Plataforma Privada de Gestión Pastoral'}
            {mode === 'forgot' && 'Ingresa tu correo para enviarte el enlace de recuperación'}
          </p>
        </div>

        {/* Notificaciones de Error y Éxito */}
        {error && (
          <div role="alert" style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div role="status" style={{ background: '#dcfce7', color: '#166534', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODO 1: INICIAR SESIÓN */}
        {mode === 'login' && (
          <form onSubmit={handleSubmitLogin} autoComplete="off" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Mail size={18} color="var(--text-muted)" aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
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
                <label htmlFor="login-password">Contraseña</label>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
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
                <Lock size={18} color="var(--text-muted)" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
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
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', gap: '8px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                  <span>{isWakingUp ? 'Conectando (Despertando servidor)...' : 'Autenticando...'}</span>
                </>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>

            <div style={{
              marginTop: '24px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              border: '1px dashed #94a3b8',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#334155',
              lineHeight: '1.4'
            }}>
              🔒 <strong>Acceso Restringido:</strong> Esta plataforma es de uso exclusivo para el Pastor y visitadores autorizados. Los usuarios son dados de alta únicamente por la administración pastoral.
            </div>
          </form>
        )}

        {/* MODO 2: OLVIDASTE LA CONTRASEÑA */}
        {mode === 'forgot' && (
          <form onSubmit={handleSubmitForgot} autoComplete="off" style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label htmlFor="forgot-email">Correo Electrónico *</label>
              <div className="search-input-box" style={{ width: '100%' }}>
                <Mail size={18} color="var(--text-muted)" aria-hidden="true" />
                <input
                  id="forgot-email"
                  name="forgotEmail"
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
                <ArrowLeft size={16} aria-hidden="true" /> Volver al Login
              </button>
            </div>
          </form>
        )}

      </div>
    </main>
  );
};
