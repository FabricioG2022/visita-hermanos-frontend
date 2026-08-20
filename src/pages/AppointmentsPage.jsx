import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { Calendar, Clock, User, MapPin, Search, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const AppointmentsPage = ({ onScheduleAppointment, onSelectMember, appointmentsVersion = 0 }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalFeedback, setModalFeedback] = useState({ isOpen: false, title: '', message: '' });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Error al cargar citas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [appointmentsVersion]);

  // Resetear a página 1 al filtrar o buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      setModalFeedback({ isOpen: true, title: 'Error', message: err.message || "Error al actualizar estado de la cita" });
    }
  };

  const normalizeStr = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredAppointments = appointments.filter(a => {
    const term = normalizeStr(searchTerm);
    const matchesSearch = !term || 
      normalizeStr(a.memberName).includes(term) ||
      normalizeStr(a.responsible).includes(term) ||
      normalizeStr(a.visitType).includes(term) ||
      normalizeStr(a.location).includes(term) ||
      normalizeStr(a.date).includes(term);

    const matchesStatus = statusFilter === 'all' || 
      normalizeStr(a.status) === normalizeStr(statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedAppointments = filteredAppointments.slice((validCurrentPage - 1) * ITEMS_PER_PAGE, validCurrentPage * ITEMS_PER_PAGE);

  return (
    <div>
      <Header
        title="Citas Programadas"
        subtitle="Gestión de agenda y cronogramas de visitas"
        actionButton={
          <button className="btn btn-primary" onClick={() => onScheduleAppointment(null)}>
            <Plus size={18} /> Programar nueva cita
          </button>
        }
      />

      <div className="page-container">
        {/* Controles de Búsqueda y Filtro */}
        <div className="table-controls" style={{ marginBottom: '24px' }}>
          <div className="search-input-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar cita por miembro, visitador, fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Estado:
            </div>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '8px 14px', fontWeight: 600 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todas las citas</option>
              <option value="pendiente">Pendientes</option>
              <option value="realizada">Realizadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
        </div>

        {/* Listado / Tabla de Citas */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando citas agendadas...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
            <Calendar size={48} color="var(--primary)" style={{ marginBottom: '12px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>No hay citas agendadas</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {searchTerm || statusFilter !== 'all'
                ? "Prueba cambiando los términos de búsqueda o filtros."
                : "Aún no se ha registrado ninguna cita en la agenda."}
            </p>
            <button className="btn btn-primary" style={{ margin: '0 auto' }} onClick={() => onScheduleAppointment(null)}>
              <Plus size={16} /> Programar primera cita
            </button>
          </div>
        ) : (
          <>
            {/* Vista de Tabla para Escritorio */}
            <div className="table-card desktop-only-table">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>Fecha y Hora</th>
                    <th>Visitador / Responsable</th>
                    <th>Tipo y Lugar</th>
                    <th>Observaciones</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAppointments.map(a => {
                    const statusLower = (a.status || 'pendiente').toLowerCase();
                    const badgeClass = 
                      statusLower === 'realizada' ? 'badge-verde' :
                      statusLower === 'cancelada' ? 'badge-rojo' : 'badge-amarillo';

                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                            {a.memberName || 'Miembro General'}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={14} color="var(--primary)" /> {a.date}
                            </span>
                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                              <Clock size={12} /> {a.time} hs
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span>{a.responsible || 'Coordinador'}</span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600 }}>{a.visitType || 'Visita'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={12} /> {a.location || 'Domicilio'}
                            </div>
                          </div>
                        </td>

                        <td style={{ maxWidth: '240px' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                            {a.observations || 'Sin observaciones.'}
                          </div>
                        </td>

                        <td>
                          <span className={`badge-status ${badgeClass}`}>
                            {a.status || 'Pendiente'}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {statusLower !== 'realizada' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#16a34a' }}
                                title="Marcar como realizada"
                                onClick={() => handleUpdateStatus(a.id, 'Realizada')}
                              >
                                <CheckCircle size={14} /> Realizada
                              </button>
                            )}
                            {statusLower !== 'cancelada' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626' }}
                                title="Marcar como cancelada"
                                onClick={() => handleUpdateStatus(a.id, 'Cancelada')}
                              >
                                <XCircle size={14} /> Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas para Celulares */}
            <div className="mobile-only-cards">
              {paginatedAppointments.map(a => {
                const statusLower = (a.status || 'pendiente').toLowerCase();
                const badgeClass = 
                  statusLower === 'realizada' ? 'badge-verde' :
                  statusLower === 'cancelada' ? 'badge-rojo' : 'badge-amarillo';

                return (
                  <div key={a.id} className="mobile-record-card">
                    <div className="mobile-card-header">
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                        {a.memberName || 'Miembro General'}
                      </div>
                      <span className={`badge-status ${badgeClass}`}>
                        {a.status || 'Pendiente'}
                      </span>
                    </div>

                    <div className="mobile-card-body">
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Fecha y Hora:</span>
                        <span className="mobile-card-value">
                          📅 {a.date} ({a.time} hs)
                        </span>
                      </div>

                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Visitador / Resp:</span>
                        <span className="mobile-card-value">
                          👤 {a.responsible || 'Coordinador'}
                        </span>
                      </div>

                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Tipo y Lugar:</span>
                        <span className="mobile-card-value">
                          📍 {a.visitType || 'Visita'} - {a.location || 'Domicilio'}
                        </span>
                      </div>

                      <div className="mobile-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <span className="mobile-card-label">Observaciones:</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.4', fontStyle: 'italic' }}>
                          "{a.observations || 'Sin observaciones.'}"
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      {statusLower !== 'realizada' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#16a34a', flex: 1, justifyContent: 'center' }}
                          onClick={() => handleUpdateStatus(a.id, 'Realizada')}
                        >
                          <CheckCircle size={15} /> Realizada
                        </button>
                      )}
                      {statusLower !== 'cancelada' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#dc2626', flex: 1, justifyContent: 'center' }}
                          onClick={() => handleUpdateStatus(a.id, 'Cancelada')}
                        >
                          <XCircle size={15} /> Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginación */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '20px',
              padding: '12px 16px',
              background: 'var(--card-bg, #ffffff)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span>
                Mostrando <strong>{paginatedAppointments.length > 0 ? (validCurrentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> a <strong>{Math.min(validCurrentPage * ITEMS_PER_PAGE, filteredAppointments.length)}</strong> de <strong>{filteredAppointments.length}</strong> citas agendadas
              </span>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  disabled={validCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} /> Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`btn ${pageNum === validCurrentPage ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '32px', justifyContent: 'center' }}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  disabled={validCurrentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <SuccessModal
        isOpen={modalFeedback.isOpen}
        onClose={() => setModalFeedback({ isOpen: false, title: '', message: '' })}
        title={modalFeedback.title}
        message={modalFeedback.message}
      />
    </div>
  );
};
