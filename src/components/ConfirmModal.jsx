import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "¿Estás seguro?", 
  message = "Esta acción no se puede deshacer.",
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar"
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch (err) {
      console.error("Error en ConfirmModal:", err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '440px', padding: '24px', textAlign: 'center' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
          {title}
        </h3>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, justifyContent: 'center' }} 
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, justifyContent: 'center', backgroundColor: '#ef4444', color: '#ffffff' }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
