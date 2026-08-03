import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const MemberModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    birthDate: '',
    notes: '',
    status: 'Activo',
    isFavorite: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
        birthDate: initialData.birthDate || '',
        notes: initialData.notes || '',
        status: initialData.status || 'Activo',
        isFavorite: Boolean(initialData.isFavorite)
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        birthDate: '',
        notes: '',
        status: 'Activo',
        isFavorite: false
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const isEdit = Boolean(initialData);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Editar Miembro' : 'Agregar Nuevo Miembro'}</h2>
          <button className="star-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Nombre y Apellido *</label>
            <input
              type="text"
              required
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className="form-control"
              placeholder="Ej: Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="text"
                required
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="form-control"
                placeholder="Ej: 1123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="form-control"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="form-control"
                placeholder="Calle y número"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <input
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="form-control"
                placeholder="DD/MM/AAAA"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estado</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                />
                Marcar como favorito
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Observaciones / Notas</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Escribe notas relevantes sobre el miembro..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Guardar Cambios' : 'Guardar Miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
