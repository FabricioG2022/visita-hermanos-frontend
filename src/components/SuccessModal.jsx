import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export const SuccessModal = ({ isOpen, onClose, title = "¡Acción exitosa!", message = "La operación se completó con éxito." }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '420px', 
          textAlign: 'center', 
          padding: '32px 24px', 
          borderRadius: '16px',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        <button 
          className="star-btn" 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <CheckCircle2 size={36} color="#16a34a" />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
          {message}
        </p>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontWeight: 700 }}
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};
