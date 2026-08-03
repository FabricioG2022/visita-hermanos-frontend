import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { MapPin, Search, Calendar, User, ChevronRight, Filter } from 'lucide-react';

export const VisitsPage = ({ onSelectMember }) => {
  const [visits, setVisits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [visitsData, membersData] = await Promise.all([
          api.getVisits(),
          api.getMembers()
        ]);
        setVisits(visitsData);
        setMembers(membersData);
      } catch (err) {
        console.error("Error al cargar historial de visitas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMemberClick = async (visit) => {
    if (!onSelectMember) return;
    // Buscar el objeto miembro completo
    let member = members.find(m => String(m.id) === String(visit.memberId));
    if (!member && visit.memberId) {
      try {
        member = await api.getMemberById(visit.memberId);
      } catch (e) {
        console.error("Error al obtener miembro:", e);
      }
    }

    if (!member) {
      member = {
        id: visit.memberId || 'temp',
        name: visit.memberName || 'Miembro',
        phone: 'Sin teléfono',
        status: visit.status || 'Verde',
        lastVisit: visit.date,
        historialVisitas: [
          { fecha: visit.date, visitador: visit.responsible, nota: visit.summary, nuevoEstadoAnimico: visit.status }
        ]
      };
    }
    onSelectMember(member);
  };

  // Helper para normalizar texto (insensible a tildes y mayúsculas)
  const normalizeStr = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredVisits = visits.filter(v => {
    const term = normalizeStr(searchTerm);
    
    const matchesSearch = !term || 
      normalizeStr(v.memberName).includes(term) ||
      normalizeStr(v.responsible).includes(term) ||
      normalizeStr(v.summary).includes(term) ||
      normalizeStr(v.date).includes(term) ||
      normalizeStr(v.time).includes(term);

    const matchesStatus = statusFilter === 'all' || 
      normalizeStr(v.status) === normalizeStr(statusFilter);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Header
        title="Historial de Visitas"
        subtitle="Registro centralizado de visitas de campo y seguimiento de hermanos"
      />

      <div className="page-container">
        {/* Filtros y Buscador */}
        <div className="table-controls" style={{ marginBottom: '24px' }}>
          <div className="search-input-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por nombre de miembro, visitador, fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={15} /> Estado:
            </div>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '8px 14px', fontWeight: 600 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="verde">Estado Verde (Excelente)</option>
              <option value="amarillo">Estado Amarillo (Atención)</option>
              <option value="rojo">Estado Rojo (Urgente)</option>
            </select>
          </div>
        </div>

        {/* Lista / Tabla de Visitas */}
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando registro de visitas...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
            <MapPin size={40} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>No se encontraron visitas</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {searchTerm || statusFilter !== 'all' 
                ? "Prueba cambiando los filtros de búsqueda." 
                : "Aún no hay visitas de campo registradas en el sistema."}
            </p>
          </div>
        ) : (
          <div className="table-card">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Miembro visitado</th>
                  <th>Fecha y Hora</th>
                  <th>Visitador / Responsable</th>
                  <th>Detalle / Resumen de visita</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((v) => {
                  const statusClass = 
                    v.status?.toLowerCase() === 'verde' ? 'badge-verde' :
                    v.status?.toLowerCase() === 'amarillo' ? 'badge-amarillo' :
                    v.status?.toLowerCase() === 'rojo' ? 'badge-rojo' : 'badge-active';

                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="member-cell">
                          {v.fotoUrl ? (
                            <img
                              src={v.fotoUrl}
                              alt={v.memberName}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="avatar-circle">
                              {v.memberName ? v.memberName.charAt(0) : '?'}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{v.memberName || 'Miembro General'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="var(--primary)" />
                          <span>{v.date || 'N/A'}</span>
                          {v.time && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({v.time})</span>}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="var(--text-muted)" />
                          <span>{v.responsible || 'Voluntario'}</span>
                        </div>
                      </td>

                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                          {v.summary || 'Sin nota de visita.'}
                        </div>
                      </td>

                      <td>
                        <span className={`badge-status ${statusClass}`}>
                          {v.status || 'Realizada'}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleMemberClick(v)}
                        >
                          Ver perfil <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
