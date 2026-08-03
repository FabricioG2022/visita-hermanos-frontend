import React from 'react';
import { Star, ChevronRight, Pencil, Trash2 } from 'lucide-react';

export const MemberTable = ({ members, onSelectMember, onToggleFavorite, onEditMember, onDeleteMember, userRole }) => {
  return (
    <div className="table-card">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Teléfono</th>
            <th>Última Visita</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No se encontraron miembros.
              </td>
            </tr>
          ) : (
            members.map((member) => {
              const getBadgeClass = (st) => {
                if (!st) return 'badge-active';
                const lower = st.toLowerCase();
                if (lower === 'verde') return 'badge-verde';
                if (lower === 'amarillo') return 'badge-amarillo';
                if (lower === 'rojo') return 'badge-rojo';
                return lower === 'activo' ? 'badge-active' : 'badge-inactive';
              };

              return (
                <tr key={member.id}>
                  <td>
                    <div className="member-cell">
                      {member.fotoUrl ? (
                        <img 
                          src={member.fotoUrl} 
                          alt={member.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className="avatar-circle">
                          {member.name ? member.name.charAt(0) : '?'}
                        </div>
                      )}
                      <div>
                        <div>{member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {member.email || member.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{member.phone || 'Sin tel'}</td>
                  <td>{member.lastVisit}</td>
                  <td>
                    <span className={`badge-status ${getBadgeClass(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className={`star-btn ${member.isFavorite ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(member.id);
                        }}
                        title={member.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
                      >
                        <Star size={18} fill={member.isFavorite ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => onSelectMember(member)}
                      >
                        Ver Perfil <ChevronRight size={14} />
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMember(member);
                        }}
                        title="Editar miembro"
                      >
                        <Pencil size={15} color="var(--primary)" />
                      </button>

                      {userRole === 'admin' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#dc2626' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMember(member);
                          }}
                          title="Eliminar miembro"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
