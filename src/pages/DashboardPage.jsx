import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, MapPin, Star, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export const DashboardPage = ({ onNavigateToMembers, onViewMember, onNavigateToVisits }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
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

  const { totalMembers = 0, totalVisits = 0, favorites = 0, necesitanAtencion = 0, recentVisits = [] } = stats || {};

  return (
    <div>
      <Header
        title={`¡Bienvenido, ${user?.name || 'Leo'}!`}
        subtitle="Aquí tienes un resumen en tiempo real de la actividad en Firestore."
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
            value={totalVisits}
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
          {/* Últimas Visitas */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Últimas visitas registradas</h3>
              <button className="link-btn" onClick={onNavigateToMembers}>Ver miembros &rarr;</button>
            </div>
            <div className="list-stack" style={{ marginTop: '16px' }}>
              {recentVisits.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay visitas recientes.</p>
              ) : (
                recentVisits.map((v) => (
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
                        <div className="item-info-sub">Última visita: {v.date}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge-status ${
                        v.status?.toLowerCase() === 'verde' ? 'badge-verde' :
                        v.status?.toLowerCase() === 'amarillo' ? 'badge-amarillo' :
                        v.status?.toLowerCase() === 'rojo' ? 'badge-rojo' : 'badge-active'
                      }`}>
                        {v.status}
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
          </div>
        </div>
      </div>
    </div>
  );
};
