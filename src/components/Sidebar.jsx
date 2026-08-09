import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Miembros', icon: Users },
    { id: 'visits', label: 'Visitas', icon: MapPin },
    { id: 'appointments', label: 'Citas', icon: Calendar },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'reports', label: 'Reportes', icon: BarChart3, adminOnly: true },
    { id: 'verse', label: 'Versículo del día', icon: BookOpen },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="avatar-circle" style={{ background: '#ffffff', color: 'var(--primary)' }}>
          <UserCheck size={20} />
        </div>
        <div>
          <div className="sidebar-title">App Visita</div>
          <div className="sidebar-title" style={{ fontWeight: 400 }}>Hermanos</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {user?.name || 'Usuario'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
              {user?.role || 'Voluntario'}
            </div>
          </div>
        </div>
        <button className="logout-btn" title="Cerrar sesión" onClick={logout}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
