import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_VISIT_TYPES = [
  'Visita en domicilio',
  'Atención médica',
  'Seguimiento pastoral',
  'Llamada telefónica',
  'Acompañamiento espiritual'
];

const DEFAULT_STATUSES = [
  { name: 'Verde', label: 'Verde (Buen estado / Al día)', color: '#10b981' },
  { name: 'Amarillo', label: 'Amarillo (Requiere atención / Seguimiento)', color: '#f59e0b' },
  { name: 'Rojo', label: 'Rojo (Urgente / Necesita visita inmediata)', color: '#ef4444' }
];

export const VisitModal = ({ isOpen, onClose, onSubmit, member = null, members: initialMembers = [] }) => {
  const { user } = useAuth();

  const [membersList, setMembersList] = useState(initialMembers);
  const [responsiblesList, setResponsiblesList] = useState([]);
  const [visitTypes, setVisitTypes] = useState(DEFAULT_VISIT_TYPES);
  const [statusesList, setStatusesList] = useState(DEFAULT_STATUSES);

  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Obtener fecha y hora actual predeterminada (YYYY-MM-DD y HH:mm)
  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    date: getTodayDate(),
    time: getCurrentTime(),
    responsible: user?.name || '',
    visitType: DEFAULT_VISIT_TYPES[0],
    status: 'Verde',
    summary: ''
  });

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSearchMemberQuery('');

      const defaultResp = user?.name || user?.email?.split('@')[0] || '';
      const initialMemberId = member ? String(member.id || member.uid || '') : '';
      const initialMemberName = member ? String(member.name || member.nombre || '') : '';

      setFormData({
        memberId: initialMemberId,
        memberName: initialMemberName,
        date: getTodayDate(),
        time: getCurrentTime(),
        responsible: defaultResp,
        visitType: visitTypes[0] || DEFAULT_VISIT_TYPES[0],
        status: member?.status || 'Verde',
        summary: ''
      });
    }
  }, [isOpen, member?.id]);

  // Cargar lista de miembros, usuarios y settings
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

        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          if (Array.isArray(settingsRes.value.visitTypes) && settingsRes.value.visitTypes.length > 0) {
            setVisitTypes(settingsRes.value.visitTypes);
          }
        }

        if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value) && membersRes.value.length > 0) {
          setMembersList(membersRes.value);
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) && usersRes.value.length > 0) {
          setResponsiblesList(usersRes.value);
        }
      } catch (err) {
        console.error("Error al cargar datos en VisitModal:", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadModalData();
    return () => { isMounted = false; };
  }, [isOpen, member?.id]);

  // Filtrar miembros según lo tipeado en la búsqueda
  const filteredMembers = useMemo(() => {
    if (!searchMemberQuery.trim()) return membersList;
    const q = searchMemberQuery.toLowerCase();
    return membersList.filter(m => 
      (m.name || m.nombre || '').toLowerCase().includes(q) ||
      (m.phone || m.telefono || '').toLowerCase().includes(q)
    );
  }, [membersList, searchMemberQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.memberName && !formData.memberId) {
      setErrorMsg('Debes seleccionar o especificar el miembro visitado.');
      return;
    }

    if (!formData.summary.trim()) {
      setErrorMsg('Por favor escribe el detalle o resumen de la visita.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Formatear fecha a DD/MM/YYYY si se selecciona con picker YYYY-MM-DD
      let formattedDate = formData.date;
      if (formData.date && formData.date.includes('-')) {
        const [y, m, d] = formData.date.split('-');
        formattedDate = `${d}/${m}/${y}`;
      }

      const payload = {
        memberId: formData.memberId,
        memberName: formData.memberName,
        date: formattedDate,
        time: formData.time,
        responsible: formData.responsible || user?.name || 'Visitador',
        visitType: formData.visitType,
        status: formData.status,
        summary: formData.summary.trim()
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la visita.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '580px', width: '100%', padding: '28px', borderRadius: '16px' }}>
        
        {/* Header Modal */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={22} color="var(--primary)" /> Registrar Visita de Campo
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Completa los datos para registrar el informe y actualizar el estado del miembro
            </p>
          </div>
          <button className="star-btn" onClick={onClose} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          
          {/* 1. Selección de Miembro */}
          <div className="form-group">
            <label>Miembro Visitado *</label>
            {member ? (
              <div className="form-control" style={{ backgroundColor: 'var(--bg-main)', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> {member.name || member.nombre}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Campo para tipear y filtrar */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tipea el nombre del miembro para buscar..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                />
                
                {/* Desplegable selector */}
                <select
                  className="form-control"
                  required
                  value={formData.memberId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = membersList.find(m => String(m.id || m.uid) === String(selectedId));
                    setFormData(prev => ({
                      ...prev,
                      memberId: selectedId,
                      memberName: found ? (found.name || found.nombre) : '',
                      status: found?.status || prev.status
                    }));
                  }}
                >
                  <option value="">-- Seleccionar de la lista de miembros ({filteredMembers.length}) --</option>
                  {filteredMembers.map(m => (
                    <option key={m.id || m.uid} value={m.id || m.uid}>
                      {m.name || m.nombre} {m.phone ? `(${m.phone})` : ''} - Estado: {m.status || 'Verde'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Fecha y Hora */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Fecha de la Visita *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Hora de la Visita *</label>
              <input
                type="time"
                required
                className="form-control"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          {/* 3. Visitado por & Tipo de Visita */}
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Visitado Por (Responsable) *</label>
              {responsiblesList.length > 0 ? (
                <select
                  className="form-control"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                >
                  {responsiblesList.map(u => (
                    <option key={u.id || u.uid} value={u.name || u.email}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
              )}
            </div>

            <div className="form-group">
              <label>Tipo de Visita *</label>
              <select
                className="form-control"
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
              >
                {visitTypes.map((vt, idx) => (
                  <option key={idx} value={vt}>{vt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Nuevo Estado / Semáforo de Estado */}
          <div className="form-group">
            <label>Estado del Miembro tras la Visita (Semáforo) *</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {statusesList.map(st => (
                <option key={st.name} value={st.name}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Detalle y Resumen de la Visita */}
          <div className="form-group">
            <label>Detalle y Resumen de la Visita *</label>
            <textarea
              className="form-control"
              rows="4"
              required
              placeholder="Describe lo conversado, necesidades observadas, pedidos de oración o acuerdos..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          {/* Botones del Modal */}
          <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Guardando Visita...' : 'Registrar Visita'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
