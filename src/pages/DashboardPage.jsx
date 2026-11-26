import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getBadgeClass } from '../components/MemberTable';
import { Users, MapPin, Calendar, Star, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export const DashboardPage = ({ onNavigateToMembers, onViewMember, onNavigateToVisits, onNavigateToAppointments, appointmentsVersion = 0 }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allVisits, setAllVisits] = useState([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const parseSpanishDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const lower = dateStr.toLowerCase().trim();
    if (lower.includes('sin visitas') || lower === 'n/a') return 0;

    const parts = lower.includes('/') ? lower.split('/') : lower.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year && year.length === 4) {
        const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        return d.getTime() || 0;
      }
    }
    return new Date(dateStr).getTime() || 0;
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [statsData, visitsData, appointmentsData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getVisits().catch(() => []),
          api.getAppointments().catch(() => [])
        ]);

        setStats(statsData);
        if (Array.isArray(appointmentsData)) {
          setAppointmentsCount(appointmentsData.length);
        }

        // Mapear y ordenar todas las visitas desde la fecha actual hacia atrás en el tiempo
        let rawVisits = [];
        if (Array.isArray(visitsData) && visitsData.length > 0) {
          rawVisits = visitsData.map(v => ({
            id: v.id,
            memberId: v.memberId || v.member_id || v.id,
            name: v.memberName || v.name || 'Miembro',
            date: v.date || 'N/A',
            status: v.status || 'Verde',
            fotoUrl: v.fotoUrl || '',
            responsible: v.responsible || '',
            summary: v.summary || ''
          }));
        } else if (statsData?.recentVisits && Array.isArray(statsData.recentVisits)) {
          rawVisits = statsData.recentVisits.map(v => ({
            ...v,
            memberId: v.memberId || v.member_id || v.id
          }));
        }

        // Ordenar descendentemente por fecha (de más nuevas a más viejas)
        const sortedVisits = rawVisits.sort((a, b) => parseSpanishDate(b.date) - parseSpanishDate(a.date));
        setAllVisits(sortedVisits);
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [appointmentsVersion]);

  if (loading) {
    return <div style={{ padding: '30px' }}>Cargando Dashboard...</div>;
  }

  const { totalMembers = 0, totalVisits = 0, favorites = 0, necesitanAtencion = 0 } = stats || {};

  const totalPages = Math.ceil(allVisits.length / ITEMS_PER_PAGE) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedVisits = allVisits.slice((validPage - 1) * ITEMS_PER_PAGE, validPage * ITEMS_PER_PAGE);

  return (
    <div>
      <Header
        title={`¡Bienvenido, ${user?.name || 'Leo'}!`}
        subtitle="Aquí tienes un resumen en tiempo real de la actividad en el sistema."
      />

      <div className="page-container">
        {/* KPIs Reales e Interactivas */}
        <div className="metrics-grid">
          <MetricCard
            title="Miembros"
            value={totalMembers}
            subtext="Ver los miembros registrados"
            icon={Users}
            onClick={() => onNavigateToMembers('all')}
          />
          <MetricCard
            title="Visitas"
            value={totalVisits || allVisits.length}
            subtext="Ver historial de visitas"
            icon={MapPin}
            iconColor="#00629b"
            iconBg="#e0f2fe"
            onClick={() => onNavigateToVisits ? onNavigateToVisits() : null}
          />
          <MetricCard
            title="Citas"
            value={appointmentsCount}
            subtext="Ver agenda y programar citas"
            icon={Calendar}
            iconColor="#00629b"
            iconBg="#e0f2fe"
            onClick={() => onNavigateToAppointments ? onNavigateToAppointments() : null}
          />
          <MetricCard
            title="Favoritos"
            value={favorites}
            subtext="Ver miembros destacados"
            icon={Star}
            iconColor="#d97706"
            iconBg="#fef3c7"
            onClick={() => onNavigateToMembers('favorites')}
          />
          <MetricCard
            title="Atención Urgente"
            value={necesitanAtencion}
            subtext="Ver miembros en estado rojo"
            icon={AlertTriangle}
            iconColor="#dc2626"
            iconBg="#fee2e2"
            onClick={() => onNavigateToMembers('urgent')}
          />
        </div>

        {/* Grilla principal de Actividad */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          {/* Últimas Visitas Registradas */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Últimas visitas registradas (ordenadas por fecha reciente)</h3>
              <button className="link-btn" onClick={onNavigateToVisits || onNavigateToMembers}>
                Ir al historial completo &rarr;
              </button>
            </div>

            <div className="list-stack" style={{ marginTop: '16px' }}>
              {allVisits.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay visitas registradas.</p>
              ) : (
                paginatedVisits.map((v) => (
                  <div key={v.id} className="list-item">
                    <div className="list-item-left">
                      {v.fotoUrl ? (
                        <img 
                          src={v.fotoUrl} 
                          alt={v.name} 
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className="avatar-circle">
                          {v.name ? v.name.charAt(0) : '?'}
                        </div>
                      )}
                      <div>
                        <div className="item-info-title">{v.name}</div>
                        <div className="item-info-sub">
                          Última visita: <strong>{v.date}</strong> {v.responsible ? `• Visitado por: ${v.responsible}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge-status ${getBadgeClass(v.status)}`}>
                        {v.status || 'Sin información'}
                      </span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => onViewMember ? onViewMember(v) : onNavigateToMembers()}
                      >
                        Ver <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Controles de Paginación */}
            {allVisits.length > 0 && (
              <div className="pagination-container">
                <span>
                  Mostrando <strong>{(validPage - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(validPage * ITEMS_PER_PAGE, allVisits.length)}</strong> de <strong>{allVisits.length}</strong> visitas registradas
                </span>

                <div className="pagination-controls">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    disabled={validPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`btn ${pageNum === validPage ? 'btn-primary' : 'btn-secondary'}`}
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
                    disabled={validPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
