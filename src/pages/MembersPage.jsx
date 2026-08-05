import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { MemberTable, isOlderThan6Months } from '../components/MemberTable';
import { MemberModal } from '../components/MemberModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const MembersPage = ({ onSelectMember, initialFilter = 'all' }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState(initialFilter);
  const [sortBy, setSortBy] = useState('name_asc');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [modalFeedback, setModalFeedback] = useState({ isOpen: false, title: '', message: '' });

  useEffect(() => {
    setFilterMode(initialFilter);
  }, [initialFilter]);

  // Estado para Modal Estilizado de Confirmación de Eliminación
  const [memberToDelete, setMemberToDelete] = useState(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      console.error("Error al cargar miembros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Función de parseo correcto de fechas DD/MM/YYYY o DD-MM-YYYY a Timestamp
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

  const normalizeStr = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Lógica de Filtrado (incluyendo búsqueda instantánea 0ms) y Ordenamiento dinámico
  const getFilteredAndSortedMembers = () => {
    let list = [...members];

    // Aplicar búsqueda en cliente sin saturar servidor
    if (search.trim()) {
      const q = normalizeStr(search);
      list = list.filter(m =>
        normalizeStr(m.name).includes(q) ||
        normalizeStr(m.phone).includes(q) ||
        normalizeStr(m.email).includes(q) ||
        normalizeStr(m.notes).includes(q) ||
        normalizeStr(m.status).includes(q)
      );
    }

    // Aplicar filtro si viene de las tarjetas KPI o select desplegable
    if (filterMode === 'favorites') {
      list = list.filter(m => Boolean(m.isFavorite));
    } else if (filterMode === 'urgent' || filterMode === 'rojo') {
      list = list.filter(m => (m.status || '').toLowerCase() === 'rojo');
    } else if (filterMode === 'verde') {
      list = list.filter(m => (m.status || '').toLowerCase() === 'verde');
    } else if (filterMode === 'amarillo') {
      list = list.filter(m => (m.status || '').toLowerCase() === 'amarillo');
    } else if (filterMode === 'sin_info') {
      list = list.filter(m => {
        const s = (m.status || '').toLowerCase();
        return !s || s.includes('sin informac') || s.includes('sin info');
      });
    } else if (filterMode === 'inactivos') {
      list = list.filter(m => {
        const s = (m.status || '').toLowerCase();
        return s === 'inactivo' || s === 'inactiva' || isOlderThan6Months(m.lastVisit);
      });
    }

    switch (sortBy) {
      case 'name_asc':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name_desc':
        return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'favorites':
        return list.sort((a, b) => (b.isFavorite === a.isFavorite ? 0 : b.isFavorite ? 1 : -1));
      case 'status':
        const getWeight = (st) => {
          if (!st) return 0;
          const s = st.toLowerCase();
          if (s === 'rojo') return 4;
          if (s === 'amarillo') return 3;
          if (s === 'verde') return 2;
          if (s.includes('sin info')) return 1;
          return 0;
        };
        return list.sort((a, b) => getWeight(b.status) - getWeight(a.status));
      case 'last_visit':
        return list.sort((a, b) => parseSpanishDate(b.lastVisit) - parseSpanishDate(a.lastVisit));
      default:
        return list;
    }
  };

  const handleSaveMember = async (formData) => {
    try {
      if (editingMember) {
        const updated = await api.updateMember(editingMember.id, formData);
        setMembers(prev => prev.map(m => m.id === editingMember.id ? updated : m));
      } else {
        const created = await api.createMember(formData);
        setMembers(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
      setEditingMember(null);
    } catch (err) {
      setModalFeedback({ isOpen: true, title: 'Error al guardar', message: err.message || 'Error al guardar miembro' });
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await api.deleteMember(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
    } catch (err) {
      setModalFeedback({ isOpen: true, title: 'Error al eliminar', message: err.message || 'Error al eliminar miembro' });
    } finally {
      setMemberToDelete(null);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await api.toggleFavorite(id);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickUpdateStatus = async (member, newStatus) => {
    try {
      const updated = await api.updateMember(member.id, { status: newStatus });
      setMembers(prev => prev.map(m => m.id === member.id ? updated : m));
      setModalFeedback({
        isOpen: true,
        title: '¡Estado Actualizado!',
        message: `El estado de ${member.name || 'este miembro'} ha sido modificado a "${newStatus}".`
      });
    } catch (err) {
      setModalFeedback({ isOpen: true, title: 'Error', message: err.message || 'Error al actualizar estado' });
    }
  };

  const sortedMembers = getFilteredAndSortedMembers();

  return (
    <div>
      <Header
        title="Miembros"
        subtitle="Gestiona y organiza tus miembros en un solo lugar"
        actionButton={
          user?.role === 'admin' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={18} /> Agregar miembro
            </button>
          )
        }
      />

      <div className="page-container">
        {filterMode !== 'all' && (
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>
              Filtro activo: <strong>{filterMode === 'favorites' ? '⭐ Solo Favoritos' : '🔴 Atención Urgente (Rojo)'}</strong>
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setFilterMode('all')}
            >
              Ver todos los miembros
            </button>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="table-controls">
          <div className="search-input-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar miembro por nombre, tel o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filtrar por estado:</span>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '8px 12px', fontWeight: 600 }}
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="all">Todos los miembros</option>
                <option value="sin_info">⚪ Sin información (Nuevos)</option>
                <option value="verde">🟢 Verde (Estado óptimo)</option>
                <option value="amarillo">🟡 Amarillo (Atención regular)</option>
                <option value="urgent">🔴 Rojo (Atención urgente)</option>
                <option value="inactivos">⏸️ Inactivos (+6 meses sin visita)</option>
                <option value="favorites">⭐ Solo Favoritos</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ordenar por:</span>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '8px 12px', fontWeight: 600 }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name_asc">Nombre (A - Z)</option>
                <option value="name_desc">Nombre (Z - A)</option>
                <option value="favorites">Favoritos (⭐ primero)</option>
                <option value="status">Estado (Urgentes primero)</option>
                <option value="last_visit">Última visita (Más reciente primero)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ padding: '30px' }}>Cargando lista de miembros...</div>
        ) : (
          <MemberTable
            members={sortedMembers}
            onSelectMember={onSelectMember}
            onToggleFavorite={handleToggleFavorite}
            onEditMember={handleEditMember}
            onDeleteMember={(member) => setMemberToDelete(member)}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            userRole={user?.role}
          />
        )}

        {/* Paginador */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', padding: '6px 12px', background: 'var(--primary-light)', borderRadius: '6px' }}>1</span>
          <button className="btn btn-secondary" style={{ padding: '6px 10px' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <MemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleSaveMember}
        initialData={editingMember}
      />

      <ConfirmModal
        isOpen={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar miembro?"
        message={`¿Estás seguro de que deseas eliminar a ${memberToDelete?.name || 'este miembro'}? Esta acción borrará permanentemente sus datos.`}
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
