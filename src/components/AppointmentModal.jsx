import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_VISIT_TYPES = [
  'Visita en domicilio',
  'Visita en centro',
  'Llamada de seguimiento',
  'Atención médica',
  'Acompañamiento espiritual',
  'Seguimiento pastoral'
];

export const AppointmentModal = ({ isOpen, onClose, onSubmit, member, members: initialMembers = [] }) => {
  const { user } = useAuth();
  const [membersList, setMembersList] = useState(initialMembers);
  const [responsiblesList, setResponsiblesList] = useState([]);
  const [availableVisitTypes, setAvailableVisitTypes] = useState(DEFAULT_VISIT_TYPES);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    date: '',
    time: '',
    visitType: DEFAULT_VISIT_TYPES[0],
    location: 'Domicilio',
    responsible: user?.name || user?.email?.split('@')[0] || '',
    observations: ''
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const defaultResp = user?.name || user?.email?.split('@')[0] || '';
      setFormData({
        memberId: member ? String(member.id || member.uid || member._id || '') : '',
        memberName: member ? String(member.name || member.nombre || '') : '',
        date: '',
        time: '',
        visitType: availableVisitTypes[0] || 'Visita en domicilio',
        location: 'Domicilio',
        responsible: defaultResp,
        observations: ''
      });
    }
  }, [isOpen, member?.id]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadModalData = async () => {
      setLoadingData(true);
      try {
        const promises = [
          api.getSettings().catch(() => null),
          (!member && (!initialMembers || initialMembers.length === 0)) ? api.getMembers().catch(() => []) : Promise.resolve(initialMembers),
          api.getUsers().catch(() => [])
        ];

        const [settingsRes, membersRes, usersRes] = await Promise.allSettled(promises);

        if (!isMounted) return;

        if (settingsRes.status === 'fulfilled' && settingsRes.value && Array.isArray(settingsRes.value.visitTypes) && settingsRes.value.visitTypes.length > 0) {
          setAvailableVisitTypes(settingsRes.value.visitTypes);
        }

        if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
          setMembersList(membersRes.value);
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          const uData = usersRes.value;
          setResponsiblesList(uData);
          setFormData(prev => {
            if (prev.responsible && prev.responsible.trim() !== '') return prev;
            const defaultUser = uData.find(u => u.name === user?.name) || uData[0];
            return { ...prev, responsible: defaultUser.name || defaultUser.email || '' };
          });
        }
      } catch (err) {
        console.error("Error al cargar datos en AppointmentModal:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadModalData();
    return () => { isMounted = false; };
  }, [isOpen, member?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let targetMemberId = formData.memberId;
    let targetMemberName = formData.memberName;
    if (member) {
      if (!targetMemberId) targetMemberId = String(member.id || member.uid || member._id || '');
      if (!targetMemberName) targetMemberName = String(member.name || member.nombre || '');
    }

    if (!targetMemberId) {
      setErrorMsg('Falta completar el campo: Seleccionar Miembro');
      if (cardRef.current) cardRef.current.scrollTop = 0;
      return;
    }
    if (!formData.date || !formData.date.trim()) {
      setErrorMsg('Falta completar el campo: Fecha de la cita');
      if (cardRef.current) cardRef.current.scrollTop = 0;
      return;
    }
    if (!formData.time || !formData.time.trim()) {
      setErrorMsg('Falta completar el campo: Hora de la cita');
      if (cardRef.current) cardRef.current.scrollTop = 0;
      return;
    }

    const finalResponsible = formData.responsible || user?.name || 'Coordinador';

    const payload = {
      ...formData,
      memberId: targetMemberId,
      memberName: targetMemberName,
      responsible: finalResponsible
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar la cita en el servidor');
      if (cardRef.current) cardRef.current.scrollTop = 0;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" ref={cardRef} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Programar nueva cita</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Para: <strong style={{ color: 'var(--text-dark)' }}>{member ? (member.name || member.nombre) : formData.memberName || 'Miembro Seleccionado'}</strong>
            </p>
          </div>
          <button className="star-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {!member && (
            <div className="form-group">
              <label>Seleccionar Miembro *</label>
              <select
                className="form-control"
                value={formData.memberId}
                onChange={(e) => {
                  const selected = membersList.find(m => String(m.id) === String(e.target.value));
                  setFormData({
                    ...formData,
                    memberId: e.target.value,
                    memberName: selected ? (selected.name || selected.nombre) : ''
                  });
                }}
              >
                <option value="">-- Seleccionar Miembro --</option>
                {membersList.map(m => (
                  <option key={m.id} value={m.id}>{m.name || m.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarIcon size={15} color="var(--primary)" /> Fecha de la cita *
              </label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="var(--primary)" /> Hora *
              </label>
              <input
                type="time"
                className="form-control"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de visita</label>
              <select
                className="form-control"
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
              >
                {availableVisitTypes.map((vt, idx) => (
                  <option key={idx} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Lugar</label>
              <select
                className="form-control"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="Domicilio">Domicilio</option>
                <option value="Centro congregacional">Centro congregacional</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Responsable / Visitador *</label>
            <select
              className="form-control"
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            >
              <option value="">-- Seleccionar Visitador --</option>
              {responsiblesList.length > 0 ? (
                responsiblesList.map(u => (
                  <option key={u.id || u.uid} value={u.name}>
                    {u.name} ({u.role === 'admin' ? 'Administrador' : 'Visitador'})
                  </option>
                ))
              ) : (
                <option value={formData.responsible || user?.name || 'Coordinador'}>
                  {formData.responsible || user?.name || 'Coordinador'}
                </option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label>Observaciones</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Escribe observaciones adicionales sobre la cita..."
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
          </div>

          {errorMsg && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || (loadingData && !member)}>
              {submitting ? 'Guardando cita...' : (loadingData && !member) ? 'Cargando...' : 'Guardar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

