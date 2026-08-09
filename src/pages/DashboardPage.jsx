import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getBadgeClass } from '../components/MemberTable';
import { Users, MapPin, Star, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export const DashboardPage = ({ onNavigateToMembers, onViewMember, onNavigateToVisits }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allVisits, setAllVisits] = useState([]);
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
        const [statsData, visitsData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getVisits().catch(() => [])
        ]);

        setStats(statsData);

        // Mapear y ordenar todas las visitas desde la fecha actual hacia atrás en el tiempo
        let rawVisits = [];
        if (Array.isArray(visitsData) && visitsData.length > 0) {
          rawVisits = visitsData.map(v => ({
            id: v.id,
            name: v.memberName || v.name || 'Miembro',
            date: v.date || 'N/A',
            status: v.status || 'Verde',
            fotoUrl: v.fotoUrl || '',
            responsible: v.responsible || ''
          }));
        } else if (statsData?.recentVisits && Array.isArray(statsData.recentVisits)) {
          rawVisits = statsData.recentVisits;
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
  }, []);

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
            onClick={() => onNavigateToVisits ? onNavigateToVisits() : null}
          />
          <MetricCard
            title="Favoritos"
            value={favorites}
            subtext="Ver miembros destacados"
            icon={Star}
            onClick={() => onNavigateToMembers('favorites')}
          />
          <MetricCard
            title="Atención Urgente"
            value={necesitanAtencion}
            subtext="Ver miembros en estado rojo"
            icon={AlertTriangle}
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
                  Mostrando <strong>{(validPage - 1) * ITEMS_PER_PAGE + 1}</strong> a <strong>{Math.min(validPage * ITEMS_PER_PAGE, allVisits.length)}</strong> de <strong>{allVisits.length}</strong> visitas registradas
                </span>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
