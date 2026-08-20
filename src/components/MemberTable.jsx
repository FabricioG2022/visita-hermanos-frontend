import React from 'react';
import { Star, ChevronRight, Pencil, Trash2, Clock } from 'lucide-react';

export const isOlderThan6Months = (dateStr) => {
  if (!dateStr) return false;
  const lower = dateStr.toLowerCase().trim();
  if (lower.includes('sin visitas') || lower === 'n/a') return true;

  const parts = lower.includes('/') ? lower.split('/') : lower.split('-');
  let time = 0;
  if (parts.length === 3) {
    const [day, month, year] = parts;
    if (year && year.length === 4) {
      time = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).getTime();
    }
  }
  if (!time) time = new Date(dateStr).getTime();
  if (!time) return false;

  const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000;
  return (Date.now() - time) > sixMonthsInMs;
};

export const getBadgeClass = (st) => {
  if (!st) return 'badge-sin-info';
  const lower = st.toLowerCase().trim();
  if (lower === 'verde') return 'badge-verde';
  if (lower === 'amarillo') return 'badge-amarillo';
  if (lower === 'rojo') return 'badge-rojo';
  if (lower.includes('sin informac') || lower.includes('sin info')) return 'badge-sin-info';
  if (lower === 'inactivo' || lower === 'inactiva') return 'badge-inactive';
  return 'badge-active';
};

export const MemberTable = ({ members, onSelectMember, onToggleFavorite, onEditMember, onDeleteMember, onQuickUpdateStatus, userRole }) => {
  if (members.length === 0) {
    return (
      <div className="table-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No se encontraron miembros.
      </div>
    );
  }

  return (
    <>
      {/* Vista de Tabla para Escritorio / Tablet */}
      <div className="table-card desktop-only-table">
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
            {members.map((member) => {
              const badgeClass = getBadgeClass(member.status);
              const isOutdated = isOlderThan6Months(member.lastVisit) && (member.status || '').toLowerCase() !== 'inactivo';

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
                  <td>
                    <div>
                      <span>{member.lastVisit || 'Sin visitas'}</span>
                      {isOutdated && (
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }} title="Más de 6 meses sin visitas o actualización">
                            <Clock size={11} /> +6 meses sin contacto
                          </span>
                          {onQuickUpdateStatus && userRole === 'admin' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '0.68rem', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickUpdateStatus(member, 'Inactivo');
                              }}
                              title="Cambiar estado a Inactivo por falta de visitas (+6 meses)"
                            >
                              Pasar a Inactivo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${badgeClass}`}>
                      {member.status || 'Sin información'}
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

                      {userRole === 'admin' && (
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
                      )}

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
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas Verticales para Celulares */}
      <div className="mobile-only-cards">
        {members.map((member) => {
          const badgeClass = getBadgeClass(member.status);
          const isOutdated = isOlderThan6Months(member.lastVisit) && (member.status || '').toLowerCase() !== 'inactivo';
          const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');

          return (
            <div key={member.id} className="mobile-record-card">
              <div className="mobile-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {member.fotoUrl ? (
                    <img 
                      src={member.fotoUrl} 
                      alt={member.name} 
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="avatar-circle">
                      {member.name ? member.name.charAt(0) : '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email || 'Sin correo'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className={`star-btn ${member.isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(member.id);
                    }}
                  >
                    <Star size={18} fill={member.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <span className={`badge-status ${badgeClass}`}>
                    {member.status || 'Sin info'}
                  </span>
                </div>
              </div>

              <div className="mobile-card-body">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Teléfono:</span>
                  <span className="mobile-card-value">
                    {cleanPhone ? (
                      <a href={`tel:${cleanPhone}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        📞 {member.phone}
                      </a>
                    ) : (
                      'Sin teléfono'
                    )}
                  </span>
                </div>

                <div className="mobile-card-row">
                  <span className="mobile-card-label">Última Visita:</span>
                  <div className="mobile-card-value">
                    <span>{member.lastVisit || 'Sin visitas'}</span>
                    {isOutdated && (
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                        ⚠️ +6 meses sin contacto
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mobile-card-actions">
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', flex: 1, justifyContent: 'center' }}
                  onClick={() => onSelectMember(member)}
                >
                  Ver Perfil <ChevronRight size={14} />
                </button>

                {userRole === 'admin' && (
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
                )}

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
            </div>
          );
        })}
      </div>
    </>
  );
};
