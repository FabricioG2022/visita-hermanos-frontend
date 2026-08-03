import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SuccessModal } from '../components/SuccessModal';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Settings as SettingsIcon, 
  Bell, 
  User, 
  Sun, 
  Moon, 
  Plus, 
  Trash2, 
  Check, 
  Lock, 
  Save, 
  Globe 
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Estado para Modal de Feedback estilizado
  const [modalFeedback, setModalFeedback] = useState({ isOpen: false, title: '', message: '' });
  
  // Theme (Modo Claro / Oscuro)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.body.classList.contains('dark-mode');
  });

  // Sección A: Usuarios
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'visitador' });

  // Sección B: Parámetros Citas & Visitas
  const [visitTypes, setVisitTypes] = useState([
    'Visita en domicilio',
    'Atención médica',
    'Seguimiento pastoral',
    'Llamada telefónica',
    'Acompañamiento espiritual'
  ]);
  const [newVisitType, setNewVisitType] = useState('');

  const [statuses, setStatuses] = useState([
    { name: 'Pendiente', color: '#f59e0b' },
    { name: 'Realizada', color: '#10b981' },
    { name: 'Reagendada', color: '#3b82f6' },
    { name: 'Cancelada', color: '#ef4444' }
  ]);

  // Sección C: Notificaciones & Plantillas
  const [reminders, setReminders] = useState({
    email24h: true,
    email2h: false,
    appNotify: true,
    whatsappAlert: true
  });

  const [templates, setTemplates] = useState([
    { id: 1, title: 'Recordatorio de cita', text: 'Hola {nombre}, te recordamos tu cita programada para el {fecha} a las {hora}. Bendiciones.' },
    { id: 2, title: 'Bienvenida a la comunidad', text: 'Estimado/a {nombre}, te damos una cálida bienvenida a la comunidad de Visita Hermanos.' },
    { id: 3, title: 'Seguimiento pastoral', text: 'Hola {nombre}, quisiéramos saber cómo te encuentras hoy y coordinar una breve visita.' }
  ]);
  const [newTemplate, setNewTemplate] = useState({ title: '', text: '' });

  // Sección D: Perfil y Organización
  const [orgData, setOrgData] = useState({
    name: 'Visita Hermanos',
    timezone: 'America/Argentina/Buenos_Aires (GMT-3)'
  });
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Cargar usuarios para Sección A
  const fetchUsers = async () => {
    if (user?.role !== 'admin') return;
    setLoadingUsers(true);
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Cargar configuración global (tipos de visita, estados, recordatorios, plantillas)
  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data) {
        if (Array.isArray(data.visitTypes)) setVisitTypes(data.visitTypes);
        if (Array.isArray(data.statuses)) setStatuses(data.statuses);
        if (data.reminders) setReminders(data.reminders);
        if (Array.isArray(data.templates) && data.templates.length > 0) setTemplates(data.templates);
      }
    } catch (err) {
      console.error("Error al cargar configuración:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, []);

  const saveSettingsToServer = async (
    newVisitTypes = visitTypes, 
    newStatuses = statuses, 
    newReminders = reminders,
    newTemplates = templates
  ) => {
    try {
      await api.updateSettings({
        visitTypes: newVisitTypes,
        statuses: newStatuses,
        reminders: newReminders,
        templates: newTemplates
      });
    } catch (err) {
      console.error("Error al guardar configuración:", err);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.inviteUser(inviteForm);
      setIsInviteModalOpen(false);
      setModalFeedback({
        isOpen: true,
        title: '¡Usuario Invitado!',
        message: `El usuario ${inviteForm.name} ha sido registrado correctamente.`
      });
      setInviteForm({ name: '', email: '', password: '', role: 'visitador' });
      fetchUsers();
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error al invitar',
        message: err.message || 'Error al invitar usuario'
      });
    }
  };

  const handleAddVisitType = async () => {
    if (!newVisitType.trim()) return;
    const addedType = newVisitType.trim();
    const updated = [...visitTypes, addedType];
    setVisitTypes(updated);
    setNewVisitType('');
    await saveSettingsToServer(updated, statuses, reminders, templates);
    setModalFeedback({
      isOpen: true,
      title: '¡Parámetro Guardado!',
      message: `El tipo de visita "${addedType}" fue agregado y guardado con éxito. Ahora estará disponible al programar citas.`
    });
  };

  const handleRemoveVisitType = async (index) => {
    const updated = visitTypes.filter((_, i) => i !== index);
    setVisitTypes(updated);
    await saveSettingsToServer(updated, statuses, reminders, templates);
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.text.trim()) return;
    const created = {
      id: `tmpl_${Date.now()}`,
      key: `custom_${Date.now()}`,
      title: newTemplate.title.trim(),
      text: newTemplate.text.trim(),
      body: newTemplate.text.trim()
    };
    const updated = [...templates, created];
    setTemplates(updated);
    setNewTemplate({ title: '', text: '' });
    await saveSettingsToServer(visitTypes, statuses, reminders, updated);
    setModalFeedback({
      isOpen: true,
      title: '¡Plantilla Guardada!',
      message: `La plantilla "${created.title}" fue agregada y guardada correctamente. Ahora estará disponible en el Hub de Mensajes.`
    });
  };

  const handleRemoveTemplate = async (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    await saveSettingsToServer(visitTypes, statuses, reminders, updated);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setModalFeedback({
        isOpen: true,
        title: 'Atención',
        message: 'El nombre y apellido no pueden estar vacíos.'
      });
      return;
    }

    try {
      const res = await api.updateProfile({
        name: profileForm.name,
        newPassword: profileForm.newPassword
      });
      updateUserProfile(res.user, res.token);
      setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      setModalFeedback({
        isOpen: true,
        title: '¡Perfil Actualizado!',
        message: 'Tus datos de perfil y nombre han sido guardados con éxito en la plataforma.'
      });
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error al guardar',
        message: err.message || 'No se pudo actualizar el perfil.'
      });
    }
  };

  return (
    <div>
      <Header
        title="Configuración del Sistema"
        subtitle="Ajustes de usuarios, parámetros de citas, notificaciones y perfil personal"
      />

      <div className="page-container">

        {/* Pestañas Principales de Configuración */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> A. Gestión de Usuarios y Permisos
          </button>

          <button
            className={`btn ${activeTab === 'params' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('params')}
          >
            <SettingsIcon size={18} /> B. Parámetros de Citas y Visitas
          </button>

          <button
            className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={18} /> C. Notificaciones y Mensajería
          </button>

          <button
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> D. Ajustes Generales y Mi Perfil
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN A: GESTIÓN DE USUARIOS Y PERMISOS (SOLO ADMIN) */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {user?.role !== 'admin' ? (
              <div className="dashboard-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShieldCheck size={40} color="var(--primary)" style={{ marginBottom: '12px' }} />
                <h3>Sección Restringida a Administradores</h3>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  Solo los usuarios con rol de Administrador pueden ver la lista de colaboradores y ajustar permisos.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Lista de Colaboradores */}
                <div className="dashboard-card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">Usuarios del Sistema</h3>
                      <p className="page-subtitle">Lista de colaboradores con acceso a la plataforma (Administradores y Visitadores)</p>
                    </div>

                    <button className="btn btn-primary" onClick={() => setIsInviteModalOpen(true)}>
                      <UserPlus size={18} /> Invitar nuevo usuario
                    </button>
                  </div>

                  {loadingUsers ? (
                    <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando colaboradores...</p>
                  ) : (
                    <div className="table-card">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Correo Electrónico</th>
                            <th>Rol</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                No se encontraron colaboradores registrados.
                              </td>
                            </tr>
                          ) : (
                            usersList.map((u) => (
                              <tr key={u.id || u.uid}>
                                <td>
                                  <div className="member-cell">
                                    <div className="avatar-circle">
                                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>{u.name || 'Usuario'}</div>
                                  </div>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                  <span className={`badge-status ${u.role === 'admin' ? 'badge-verde' : 'badge-active'}`}>
                                    {u.role === 'admin' ? 'Administrador' : 'Visitador'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge-status badge-active">Activo</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Matriz de Roles y Permisos */}
                <div className="dashboard-card">
                  <h3 className="card-title" style={{ marginBottom: '14px' }}>Matriz de Roles y Permisos</h3>
                  <p className="page-subtitle" style={{ marginBottom: '20px' }}>Definición de alcance y capacidades por tipo de rol en el sistema</p>

                  <div className="table-card">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Módulo / Funcionalidad</th>
                          <th>Administrador</th>
                          <th>Visitador</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Gestión de Miembros (Crear/Editar/Eliminar)</strong></td>
                          <td><Check color="#16a34a" size={20} /> Total</td>
                          <td><Check color="#16a34a" size={20} /> Solo lectura / Edición limitada</td>
                        </tr>
                        <tr>
                          <td><strong>Historial de Visitas de Campo</strong></td>
                          <td><Check color="#16a34a" size={20} /> Registrar y Consultar Todo</td>
                          <td><Check color="#16a34a" size={20} /> Registrar y Consultar Sus Visitas</td>
                        </tr>
                        <tr>
                          <td><strong>Programación de Citas</strong></td>
                          <td><Check color="#16a34a" size={20} /> Crear y Reasignar a cualquiera</td>
                          <td><Check color="#16a34a" size={20} /> Ver sus citas asignadas</td>
                        </tr>
                        <tr>
                          <td><strong>Gestión de Usuarios y Configuración</strong></td>
                          <td><Check color="#16a34a" size={20} /> Acceso Exclusivo</td>
                          <td><span style={{ color: '#dc2626', fontWeight: 600 }}>Sin Acceso</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN B: PARÁMETROS DE CITAS Y VISITAS */}
        {/* ========================================================================= */}
        {activeTab === 'params' && (
          <div className="dashboard-grid">
            {/* Tipos de visitas */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Tipos de Visita</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Opciones del desplegable al programar visitas de campo</p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Visita médica, Acompañamiento..."
                  value={newVisitType}
                  onChange={(e) => setNewVisitType(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleAddVisitType}>
                  <Plus size={18} /> Agregar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {visitTypes.map((vt, idx) => (
                  <div key={idx} className="list-item" style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{vt}</span>
                    <button className="star-btn" onClick={() => handleRemoveVisitType(idx)} title="Eliminar tipo">
                      <Trash2 size={16} color="#dc2626" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Estados y Prioridades */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Estados y Etiquetas</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Estados predeterminados para la gestión de citas y visitas</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {statuses.map((st, idx) => (
                  <div key={idx} className="list-item" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: st.color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.name}</span>
                    </div>
                    <span className="badge-status badge-active" style={{ fontSize: '0.75rem' }}>Activo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN C: NOTIFICACIONES Y MENSAJERÍA */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="dashboard-grid">
            {/* Recordatorios Automáticos */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Recordatorios Automáticos</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Configurar cuándo enviar alertas previas a las citas programadas</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={reminders.email24h}
                    onChange={(e) => {
                      const updated = { ...reminders, email24h: e.target.checked };
                      setReminders(updated);
                      saveSettingsToServer(visitTypes, statuses, updated);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Enviar recordatorio por Email <strong>24 horas antes</strong> de la cita</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={reminders.email2h}
                    onChange={(e) => {
                      const updated = { ...reminders, email2h: e.target.checked };
                      setReminders(updated);
                      saveSettingsToServer(visitTypes, statuses, updated);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Enviar alerta urgente por Email <strong>2 horas antes</strong></span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={reminders.appNotify}
                    onChange={(e) => {
                      const updated = { ...reminders, appNotify: e.target.checked };
                      setReminders(updated);
                      saveSettingsToServer(visitTypes, statuses, updated);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Notificaciones Push en la App Móvil para el visitador asignado</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={reminders.whatsappAlert}
                    onChange={(e) => {
                      const updated = { ...reminders, whatsappAlert: e.target.checked };
                      setReminders(updated);
                      saveSettingsToServer(visitTypes, statuses, updated);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Enviar alerta por <strong>WhatsApp / Mensaje</strong> al teléfono del visitador (2 horas antes)</span>
                </label>
              </div>
            </div>

            {/* Plantillas de Mensajes */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Plantillas de Mensajes</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Textos predefinidos para la sección de Mensajes y WhatsApp</p>

              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Título de la plantilla..."
                  style={{ marginBottom: '8px' }}
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                />
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Texto predefinido (ej: Hola {nombre}...)"
                  style={{ marginBottom: '8px' }}
                  value={newTemplate.text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, text: e.target.value })}
                />
                <button className="btn btn-primary" onClick={handleAddTemplate}>
                  <Plus size={18} /> Agregar Plantilla
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((tpl) => (
                  <div key={tpl.id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{tpl.title}</span>
                      <button className="star-btn" onClick={() => handleRemoveTemplate(tpl.id)}>
                        <Trash2 size={16} color="#dc2626" />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>"{tpl.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN D: AJUSTES GENERALES Y MI PERFIL */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="dashboard-grid">
            {/* Ajustes Generales de Organización */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Datos de la Organización</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Información del grupo y zona horaria</p>

              <div className="form-group">
                <label>Nombre del Grupo / Organización</label>
                <input
                  type="text"
                  className="form-control"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Zona Horaria</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--primary)" />
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={orgData.timezone}
                  />
                </div>
              </div>

              {/* MODO CLARO / OSCURO */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Apariencia y Tema</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Alterna la interfaz entre Modo Claro y Modo Oscuro para mayor comodidad visual.
                </p>

                <button
                  type="button"
                  className={`btn ${darkMode ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: '10px', fontSize: '0.95rem' }}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="var(--primary)" />}
                  <span>{darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
                </button>
              </div>
            </div>

            {/* Mi Perfil Personal */}
            <div className="dashboard-card">
              <h3 className="card-title" style={{ marginBottom: '6px' }}>Mi Perfil Personal</h3>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Información de la cuenta con la que has iniciado sesión</p>

              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Nombre y Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Correo Electrónico (Login)</label>
                  <input
                    type="email"
                    className="form-control"
                    disabled
                    value={profileForm.email}
                  />
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={16} color="var(--primary)" /> Cambiar Contraseña
                  </h4>

                  <div className="form-group">
                    <label>Contraseña Actual</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Nueva clave..."
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                  <Save size={18} /> Guardar Cambios de Perfil
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* MODAL PARA INVITAR NUEVO USUARIO (SECCIÓN A) */}
      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Invitar Nuevo Usuario</h2>
              <button className="star-btn" onClick={() => setIsInviteModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleInviteSubmit} autoComplete="off">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="form-control"
                  placeholder="Ej: Marcos García"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="form-control"
                  placeholder="correo@ejemplo.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contraseña Temporal (mínimo 6 caracteres) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck="false"
                  className="form-control"
                  placeholder="••••••••"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Rol en la Plataforma *</label>
                <select
                  className="form-control"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <option value="visitador">Visitador (Acceso a visitas y miembros asignados)</option>
                  <option value="admin">Administrador (Acceso total al sistema)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Enviar Invitación / Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE FEEDBACK Y CONFIRMACIÓN */}
      <SuccessModal
        isOpen={modalFeedback.isOpen}
        onClose={() => setModalFeedback({ isOpen: false, title: '', message: '' })}
        title={modalFeedback.title}
        message={modalFeedback.message}
      />
    </div>
  );
};
