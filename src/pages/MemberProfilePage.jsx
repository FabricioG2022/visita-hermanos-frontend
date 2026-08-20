import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ConfirmModal } from '../components/ConfirmModal';
import { SuccessModal } from '../components/SuccessModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getBadgeClass, isOlderThan6Months } from '../components/MemberTable';
import { VisitModal } from '../components/VisitModal';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Cake, 
  Calendar as CalendarIcon, 
  Star, 
  PhoneCall, 
  CalendarPlus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageCircle,
  FileText,
  Plus
} from 'lucide-react';

export const MemberProfilePage = ({ member, onBack, onScheduleAppointment, onEditMember, onDeleteMember, appointmentsVersion = 0 }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [memberAppointments, setMemberAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ isOpen: false, title: '', message: '' });

  // Handler para creación de visitas desde perfil de miembro
  const handleCreateVisit = async (visitData) => {
    try {
      await api.createVisit(visitData);
      setIsVisitModalOpen(false);
      
      const newVisitItem = {
        fecha: visitData.date,
        visitador: visitData.responsible,
        nota: visitData.summary,
        nuevoEstadoAnimico: visitData.status
      };
      
      if (!member.historialVisitas) member.historialVisitas = [];
      member.historialVisitas.unshift(newVisitItem);
      member.lastVisit = visitData.date;
      member.status = visitData.status;

      setModalFeedback({
        isOpen: true,
        title: '¡Visita Registrada con Éxito!',
        message: `La visita realizada por ${visitData.responsible} el ${visitData.date} ha sido registrada correctamente.`
      });
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error al registrar visita',
        message: err.message || 'No se pudo guardar la visita.'
      });
    }
  };

  // Estados para notas de campo
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const getInitialNotesHistory = useCallback((m) => {
    if (!m) return [];
    let list = m.historialNotas ? [...m.historialNotas] : [];
    if (list.length === 0 && (m.notes || m.notas)) {
      list.push({
        id: 'init_note',
        texto: m.notes || m.notas,
        fecha: m.memberSince ? `Registrado desde ${m.memberSince}` : 'Nota inicial',
        autor: 'Sistema'
      });
    }
    return list;
  }, []);

  const [notesHistory, setNotesHistory] = useState(() => getInitialNotesHistory(member));

  useEffect(() => {
    setNotesHistory(getInitialNotesHistory(member));
  }, [member, getInitialNotesHistory]);

  const handleSaveNote = async () => {
    if (!newNoteText || !newNoteText.trim() || !member?.id) return;
    try {
      setSavingNote(true);
      const updatedMember = await api.addMemberNote(member.id, newNoteText.trim());
      setNewNoteText('');
      if (updatedMember && updatedMember.historialNotas) {
        setNotesHistory(updatedMember.historialNotas);
      } else {
        const now = new Date();
        const dateStr = `${now.toLocaleDateString('es-AR')} ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
        const newObj = {
          id: `n_${Date.now()}`,
          texto: newNoteText.trim(),
          fecha: dateStr,
          autor: user?.name || 'Visitador'
        };
        setNotesHistory(prev => [newObj, ...prev]);
      }
      setModalFeedback({
        isOpen: true,
        title: '¡Nota Guardada!',
        message: 'La nota de campo ha sido guardada con éxito en el historial del miembro.'
      });
    } catch (err) {
      console.error("Error al guardar nota:", err);
      setModalFeedback({
        isOpen: true,
        title: 'Error al guardar',
        message: err.message || 'No se pudo guardar la nota.'
      });
    } finally {
      setSavingNote(false);
    }
  };

  const fetchAppointments = useCallback(async () => {
    if (!member?.id) return;
    try {
      setLoadingAppointments(true);
      const allAppointments = await api.getAppointments();
      const targetId = String(member.id);
      const filtered = allAppointments.filter(a => String(a.memberId) === targetId);
      setMemberAppointments(filtered);
    } catch (err) {
      console.error("Error al cargar citas del miembro:", err);
    } finally {
      setLoadingAppointments(false);
    }
  }, [member?.id]);

  // Cargar citas al montar y ante cualquier cambio en appointmentsVersion o id del miembro
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, appointmentsVersion]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      setMemberAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      setModalFeedback({ isOpen: true, title: 'Error', message: err.message || "Error al actualizar estado de la cita" });
    }
  };

  if (!member) {
    return (
      <div className="page-container">
        <button className="link-btn" onClick={onBack}>&larr; Volver a miembros</button>
        <p style={{ marginTop: '20px' }}>No hay un miembro seleccionado.</p>
      </div>
    );
  }

  const memberAddress = member.address || member.direccion || '';
  const memberPhone = member.phone || member.telefono || '';
  const cleanPhone = memberPhone.replace(/[^0-9]/g, '');

  return (
    <div>
      <Header
        title="Perfil del miembro"
        subtitle="Ver detalles y acciones"
        actionButton={
          <div style={{ display: 'flex', gap: '10px' }}>
            {user?.role === 'admin' && (
              <button className="btn btn-secondary" onClick={() => onEditMember(member)}>
                <Pencil size={16} /> Editar datos
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                className="btn btn-secondary"
                style={{ color: '#dc2626' }}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            <button className="btn btn-secondary" onClick={onBack}>
              <ArrowLeft size={16} /> Volver
            </button>
          </div>
        }
      />

      <div className="page-container">
        <div className="dashboard-card" style={{ marginBottom: '24px' }}>
          <div className="profile-grid-wrapper">
            
            {/* Información personal del miembro */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {member.fotoUrl ? (
                <img
                  src={member.fotoUrl}
                  alt={member.name}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800
                }}>
                  {member.name ? member.name.charAt(0) : '?'}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{member.name || member.nombre}</h2>
                  <Star size={20} fill={member.isFavorite ? 'var(--accent-gold)' : 'none'} color={member.isFavorite ? 'var(--accent-gold)' : 'var(--text-light)'} />
                  <span className={`badge-status ${getBadgeClass(member.status)}`}>
                    {member.status || 'Sin información'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} color="var(--primary)" /> {memberPhone || 'Sin número'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="var(--primary)" /> {member.email || 'Sin correo'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <MapPin size={15} color="var(--primary)" /> {memberAddress || 'Sin dirección'}
                    {memberAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(memberAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}
                        title="Ver en Google Maps"
                      >
                        <ExternalLink size={12} /> Ver en Maps
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cake size={15} color="var(--primary)" /> Nac: {member.birthDate || member.fechaNacimiento || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarIcon size={15} color="var(--primary)" /> Miembro desde: {member.memberSince || member.miembroDesde || 'N/A'}
                  </div>
                </div>

                {isOlderThan6Months(member.lastVisit) && (member.status || '').toLowerCase() !== 'inactivo' && (
                  <div style={{ marginTop: '14px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <span>⚠️ Este miembro no registra visitas ni actualizaciones en los últimos 6 meses.</span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#475569' }}
                      onClick={() => onEditMember({ ...member, status: 'Inactivo' })}
                    >
                      Cambiar estado a Inactivo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Acciones rápidas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a href={`tel:${cleanPhone}`} className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                  <PhoneCall size={16} /> Llamada directa
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${member.name || member.nombre}, te escribo del equipo de Visita a Hermanos.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', width: '100%', backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#16a34a', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                >
                  <MessageCircle size={16} /> WhatsApp directo
                </a>
                <button className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={() => onScheduleAppointment(member)}>
                  <CalendarPlus size={16} /> Programar cita
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Tabs de Secciones */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
            <button
              className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('info')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Información
            </button>
            <button
              className={`btn ${activeTab === 'visits' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('visits')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Visitas
            </button>
            <button
              className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('appointments')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Citas ({memberAppointments.length})
            </button>
            <button
              className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('notes')}
              style={{ padding: '6px 16px', fontSize: '0.85rem' }}
            >
              Notas
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Observaciones del miembro</h4>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                {member.notes || member.notas || "Sin observaciones registradas."}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Historial de Visitas de Campo</h4>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }} onClick={() => setIsVisitModalOpen(true)}>
                  <Plus size={16} /> Registrar visita
                </button>
              </div>

              {member.historialVisitas && member.historialVisitas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {member.historialVisitas.map((v, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>📅 {v.fecha}</span>
                        <span className={`badge-status ${
                          v.nuevoEstadoAnimico?.toLowerCase() === 'verde' ? 'badge-verde' :
                          v.nuevoEstadoAnimico?.toLowerCase() === 'amarillo' ? 'badge-amarillo' :
                          v.nuevoEstadoAnimico?.toLowerCase() === 'rojo' ? 'badge-rojo' : 'badge-active'
                        }`}>
                          {v.nuevoEstadoAnimico || 'Verde'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Visitador: {v.visitador || 'No especificado'}
                      </div>
                      {v.nota && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '4px', fontStyle: 'italic' }}>
                          "{v.nota}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  <p style={{ marginBottom: '12px' }}>
                    Última visita registrada: <strong>{member.lastVisit || member.ultimaVisita || 'Sin visitas'}</strong>. No hay más detalles de historial.
                  </p>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', margin: '0 auto', gap: '6px' }} onClick={() => setIsVisitModalOpen(true)}>
                    <Plus size={16} /> Registrar la primera visita
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Citas Programadas para {member.name || member.nombre}</h4>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => onScheduleAppointment(member)}>
                  + Programar cita
                </button>
              </div>

              {loadingAppointments ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cargando citas del miembro...</p>
              ) : memberAppointments.length === 0 ? (
                <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <CalendarIcon size={32} color="var(--primary)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    No hay citas agendadas registradas para {member.name || member.nombre}.
                  </p>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', margin: '0 auto' }} onClick={() => onScheduleAppointment(member)}>
                    Programar la primera cita
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {memberAppointments.map(a => {
                    const statusLower = (a.status || 'pendiente').toLowerCase();
                    const badgeClass = 
                      statusLower === 'realizada' ? 'badge-verde' :
                      statusLower === 'cancelada' ? 'badge-rojo' : 'badge-amarillo';

                    return (
                      <div key={a.id} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                              📅 {a.date} ({a.time} hs)
                            </span>
                            <span className={`badge-status ${badgeClass}`}>
                              {a.status || 'Pendiente'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '4px' }}>
                            <strong>Tipo:</strong> {a.visitType} | <strong>Lugar:</strong> {a.location}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <strong>Visitador:</strong> {a.responsible}
                          </div>
                          {a.observations && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginTop: '4px', fontStyle: 'italic' }}>
                              "{a.observations}"
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {statusLower !== 'realizada' && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#16a34a' }}
                              onClick={() => handleUpdateStatus(a.id, 'Realizada')}
                            >
                              <CheckCircle size={14} /> Realizada
                            </button>
                          )}
                          {statusLower !== 'cancelada' && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626' }}
                              onClick={() => handleUpdateStatus(a.id, 'Cancelada')}
                            >
                              <XCircle size={14} /> Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Agregar Nota de Campo</h4>
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Escribe una nota de campo sobre este miembro (observaciones, pedidos de oración, novedades)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ width: '100%', marginBottom: '12px', resize: 'vertical' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNote}
                  disabled={savingNote || !newNoteText.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <FileText size={16} />
                  {savingNote ? 'Guardando...' : 'Guardar Nota'}
                </button>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                Historial de Notas ({notesHistory.length})
              </h4>

              {notesHistory.length === 0 ? (
                <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  No hay notas de campo registradas para este miembro.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notesHistory.map((n, idx) => (
                    <div key={n.id || idx} style={{ background: 'var(--bg-main)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          📅 {n.fecha || n.date || 'Fecha no registrada'}
                        </span>
                        {n.autor && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            Autor: {n.autor}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                        {n.texto || n.text || n.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSubmit={handleCreateVisit}
        member={member}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await onDeleteMember(member.id);
        }}
        title="¿Eliminar este miembro?"
        message={`¿Estás seguro de que deseas eliminar a ${member.name || member.nombre}? Sus datos se borrarán del sistema.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />

      <SuccessModal
        isOpen={modalFeedback.isOpen}
        onClose={() => setModalFeedback({ isOpen: false, title: '', message: '' })}
        title={modalFeedback.title}
        message={modalFeedback.message}
      />
    </div>
  );
};
