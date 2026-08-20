import React, { useState } from 'react';
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
  UserCheck,
  Menu,
  X
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  const activeItemLabel = navItems.find(item => item.id === activeTab)?.label || 'Visita Hermanos';

  return (
    <>
      {/* Barra superior visible en móviles (< 900px) */}
      <div className="mobile-topbar">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Abrir menú"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="mobile-topbar-title">
          <div className="avatar-circle-sm" style={{ background: '#ffffff', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>{activeItemLabel}</span>
        </div>

        <div className="user-avatar-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#fff', fontWeight: 700 }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>

      {/* Overlay Backdrop al abrir menú en celular */}
      {isMobileOpen && (
        <div 
          className="mobile-drawer-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar (Drawer en mobile / Barra fija en desktop) */}
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="avatar-circle" style={{ background: '#ffffff', color: 'var(--primary)' }}>
            <UserCheck size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-title">App Visita</div>
            <div className="sidebar-title" style={{ fontWeight: 400 }}>Hermanos</div>
          </div>
          <button 
            className="mobile-drawer-close-btn"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} color="#ffffff" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
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
    </>
  );
};
