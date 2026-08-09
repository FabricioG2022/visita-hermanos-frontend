import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Pin, 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  Pencil,
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone, 
  Mail, 
  AlertTriangle, 
  Calendar,
  FileText,
  History,
  Sparkles,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const MessagesPage = ({ onSelectMember }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('announcements');
  const [modalFeedback, setModalFeedback] = useState({ isOpen: false, title: '', message: '' });

  // Estados para Avisos Generales
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [annFormData, setAnnFormData] = useState({ title: '', content: '', category: 'Importante', isPinned: true });

  // Estados para Alertas del Sistema
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Estados para Solicitudes
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [reqFormData, setReqFormData] = useState({ 
    subject: '', 
    details: '', 
    category: 'Reasignación',
    recipientName: 'Todos',
    recipientId: ''
  });

  // Estados para Hub de Contacto & Plantillas
  const [members, setMembers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('coordinar');
  const [contactLogs, setContactLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Estados para Búsqueda y Paginación en Historial de Mensajes
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [appliedLogSearchQuery, setAppliedLogSearchQuery] = useState('');
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const LOGS_PER_PAGE = 5;

  const filteredLogs = contactLogs.filter(log => {
    if (!appliedLogSearchQuery.trim()) return true;
    const q = appliedLogSearchQuery.toLowerCase();
    const mName = (log.memberName || '').toLowerCase();
    const mText = (log.messageText || '').toLowerCase();
    const mTmpl = (log.templateName || '').toLowerCase();
    const mType = (log.type || '').toLowerCase();
    return mName.includes(q) || mText.includes(q) || mTmpl.includes(q) || mType.includes(q);
  });

  const totalLogPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE) || 1;
  const currentLogPage = Math.min(logCurrentPage, totalLogPages);
  const paginatedLogs = filteredLogs.slice((currentLogPage - 1) * LOGS_PER_PAGE, currentLogPage * LOGS_PER_PAGE);

  const handleSearchLogs = (e) => {
    if (e) e.preventDefault();
    setAppliedLogSearchQuery(logSearchQuery);
    setLogCurrentPage(1);
  };

  const handleClearLogSearch = () => {
    setLogSearchQuery('');
    setAppliedLogSearchQuery('');
    setLogCurrentPage(1);
  };

  // Plantillas predefinidas y personalizadas del sistema
  const DEFAULT_TEMPLATES_MAP = {
    coordinar: {
      title: '📅 Coordinación de Visita',
      body: 'Hola {nombre}, te escribo del equipo de Visita a Hermanos para coordinar la visita de esta semana. ¿Qué día y horario te queda mejor?'
    },
    recordatorio: {
      title: '⏰ Recordatorio de Cita',
      body: 'Hola {nombre}, te recordamos la cita programada para el {fecha} a las {hora} hs. ¡Esperamos verte pronto!'
    },
    saludo: {
      title: '🙏 Saludo Pastoral y Ánimo',
      body: 'Hola {nombre}, esperamos que estés teniendo un bendecido día. Quería saludarte y saber cómo te encuentras hoy.'
    },
    personalizado: {
      title: '✍️ Mensaje Personalizado',
      body: ''
    }
  };

  const [templatesMap, setTemplatesMap] = useState(DEFAULT_TEMPLATES_MAP);

  // Cargar Avisos
  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  // Cargar Solicitudes
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await api.getRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Cargar Alertas del Sistema
  const fetchSystemAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const [apptsData, membersData, settingsData] = await Promise.all([
        api.getAppointments().catch(() => []),
        api.getMembers().catch(() => []),
        api.getSettings().catch(() => null)
      ]);
      setAppointments(apptsData);
      setMembers(membersData);

      const remindersConfig = settingsData?.reminders || {
        email24h: true,
        email2h: false,
        appNotify: true,
        whatsappAlert: true
      };

      const alertsList = [];

      apptsData.forEach(a => {
        if ((a.status || 'pendiente').toLowerCase() === 'pendiente') {
          const now = Date.now();
          const apptTime = new Date(`${a.date}T${a.time || '10:00'}`).getTime() || (now + 24 * 60 * 60 * 1000);
          const diffHours = (apptTime - now) / (1000 * 60 * 60);

          if (diffHours <= 2 && diffHours > 0) {
            if (remindersConfig.email2h || remindersConfig.whatsappAlert || remindersConfig.appNotify) {
              alertsList.push({
                id: `alt_urgent_2h_${a.id}`,
                type: 'urgent',
                title: `🚨 Alerta Urgente (Próxima a 2hs): ${a.memberName || 'Miembro'}`,
                message: `La cita a las ${a.time} hs está próxima a ocurrir (${a.visitType} en ${a.location}). Responsable: ${a.responsible}.`,
                date: a.date,
                memberId: a.memberId,
                status: a.status
              });
            }
          } else if (remindersConfig.email24h || remindersConfig.appNotify) {
            alertsList.push({
              id: `alt_appt_${a.id}`,
              type: 'appointment',
              title: `⏰ Recordatorio 24h: ${a.memberName || 'Miembro'}`,
              message: `Tienes una cita programada para el ${a.date} a las ${a.time} hs (${a.visitType} en ${a.location}).`,
              date: a.date,
              memberId: a.memberId,
              status: a.status
            });
          }
        }
      });

      membersData.forEach(m => {
        if ((m.status || '').toLowerCase() === 'rojo') {
          alertsList.push({
            id: `alt_urgent_${m.id}`,
            type: 'urgent',
            title: `🔴 Atención Urgente: ${m.name}`,
            message: `El hermano/a ${m.name} se encuentra en Estado Rojo. Teléfono de contacto: ${m.phone || 'Sin número'}.`,
            date: m.lastVisit,
            memberId: m.id,
            status: 'Rojo'
          });
        }
      });

      setSystemAlerts(alertsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Cargar Historial de Contactos
  const fetchContactLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await api.getContactLogs();
      setContactLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'announcements') fetchAnnouncements();
    if (activeSubTab === 'alerts') fetchSystemAlerts();
    if (activeSubTab === 'requests') fetchRequests();
    if (activeSubTab === 'contact') {
      fetchContactLogs();
      api.getMembers().then(setMembers).catch(console.error);
      api.getAppointments().then(setAppointments).catch(console.error);
      api.getSettings().then(sData => {
        if (sData && Array.isArray(sData.templates) && sData.templates.length > 0) {
          const map = {};
          sData.templates.forEach(t => {
            const key = t.key || t.id || `tmpl_${t.title}`;
            map[key] = {
              title: t.title || 'Plantilla',
              body: t.body || t.text || ''
            };
          });
          map['personalizado'] = { title: '✍️ Mensaje Personalizado', body: '' };
          setTemplatesMap(map);
        }
      }).catch(console.error);
    }
  }, [activeSubTab]);

  // Manejo de Plantillas
  const getRenderedMessage = () => {
    const tmpl = templatesMap[selectedTemplateKey] || DEFAULT_TEMPLATES_MAP[selectedTemplateKey];
    let text = selectedTemplateKey === 'personalizado' ? customText : (tmpl ? tmpl.body : '');

    const selectedMember = members.find(m => String(m.id) === String(selectedMemberId));
    const memberName = selectedMember ? selectedMember.name : 'Hermano/a';
    
    // Buscar si el miembro tiene alguna cita agendada
    const memberAppt = appointments.find(a => String(a.memberId) === String(selectedMemberId));
    const apptDate = memberAppt ? memberAppt.date : 'esta semana';
    const apptTime = memberAppt ? memberAppt.time : '18:00';

    return (text || '')
      .replace(/{nombre}/g, memberName)
      .replace(/{fecha}/g, apptDate)
      .replace(/{hora}/g, apptTime);
  };

  // Acciones de envío
  const handleSendChannel = async (channelType) => {
    const selectedMember = members.find(m => String(m.id) === String(selectedMemberId));
    if (!selectedMember) {
      setModalFeedback({
        isOpen: true,
        title: 'Selecciona un miembro',
        message: 'Por favor selecciona un miembro de la lista para enviar el mensaje.'
      });
      return;
    }

    const messageText = getRenderedMessage();
    const cleanPhone = (selectedMember.phone || '').replace(/[^0-9]/g, '');
    const email = selectedMember.email || '';

    // Guardar en Historial de Contactos
    try {
      const templateObj = templatesMap[selectedTemplateKey] || DEFAULT_TEMPLATES_MAP[selectedTemplateKey];
      await api.createContactLog({
        memberId: selectedMember.id,
        memberName: selectedMember.name || selectedMember.nombre || 'Miembro',
        type: channelType,
        templateName: templateObj?.title || 'Mensaje directo',
        messageText
      });
      fetchContactLogs();
    } catch (e) {
      console.error("Error al registrar historial:", e);
    }

    // Disparar acción de canal
    if (channelType === 'WhatsApp') {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
      window.open(url, '_blank');
    } else if (channelType === 'Correo') {
      if (!email) {
        setModalFeedback({
          isOpen: true,
          title: 'Sin Correo Electrónico',
          message: 'El miembro seleccionado no posee una dirección de correo registrada.'
        });
        return;
      }
      const url = `mailto:${email}?subject=${encodeURIComponent("Mensaje de Visita a Hermanos")}&body=${encodeURIComponent(messageText)}`;
      window.location.href = url;
    } else if (channelType === 'SMS') {
      const url = `sms:${cleanPhone}?body=${encodeURIComponent(messageText)}`;
      window.location.href = url;
    }
  };

  // Abrir Modal para Publicar Aviso
  const handleOpenCreateAnnModal = () => {
    setEditingAnnouncement(null);
    setAnnFormData({ title: '', content: '', category: 'Importante', isPinned: true });
    setIsAnnModalOpen(true);
  };

  // Abrir Modal para Editar Aviso
  const handleOpenEditAnnModal = (ann) => {
    setEditingAnnouncement(ann);
    setAnnFormData({
      title: ann.title || '',
      content: ann.content || '',
      category: ann.category || 'Importante',
      isPinned: Boolean(ann.isPinned)
    });
    setIsAnnModalOpen(true);
  };

  // Publicar o Guardar Aviso (Admin)
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, annFormData);
        setModalFeedback({
          isOpen: true,
          title: '¡Aviso Actualizado!',
          message: 'Los cambios en el aviso han sido guardados correctamente.'
        });
      } else {
        await api.createAnnouncement(annFormData);
        setModalFeedback({
          isOpen: true,
          title: '¡Aviso Publicado!',
          message: 'El aviso se ha publicado fijado en el tablón general del equipo.'
        });
      }
      setIsAnnModalOpen(false);
      setEditingAnnouncement(null);
      setAnnFormData({ title: '', content: '', category: 'Importante', isPinned: true });
      fetchAnnouncements();
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error al guardar',
        message: err.message || 'Error al guardar aviso'
      });
    }
  };

  // Eliminar Aviso (Admin)
  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Error al eliminar aviso'
      });
    }
  };

  // Cargar Usuarios para Solicitudes
  const fetchSystemUsers = async () => {
    try {
      const uData = await api.getUsers();
      setSystemUsers(uData || []);
    } catch (e) {
      console.error("Error al obtener usuarios:", e);
    }
  };

  // Abrir Modal de Solicitud
  const handleOpenRequestModal = async () => {
    await fetchSystemUsers();
    setReqFormData({ 
      subject: '', 
      details: '', 
      category: 'Reasignación',
      recipientName: 'Todos',
      recipientId: ''
    });
    setIsReqModalOpen(true);
  };

  // Crear Solicitud (Cualquier Usuario)
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...reqFormData,
        requestedBy: user?.name || 'Administrador',
        requestedByEmail: user?.email || 'admin@visita.com',
        requestedById: user?.id || user?.uid || ''
      };
      await api.createRequest(payload);
      setIsReqModalOpen(false);
      setReqFormData({ 
        subject: '', 
        details: '', 
        category: 'Reasignación',
        recipientName: 'Todos',
        recipientId: ''
      });
      setModalFeedback({
        isOpen: true,
        title: '¡Solicitud Enviada!',
        message: 'Tu solicitud ha sido registrada con éxito en el sistema.'
      });
      fetchRequests();
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error al enviar',
        message: err.message || 'Error al enviar la solicitud'
      });
    }
  };

  // Actualizar estado de Solicitud (Admin)
  const handleUpdateRequestStatus = async (id, status) => {
    try {
      await api.updateRequestStatus(id, status);
      setModalFeedback({
        isOpen: true,
        title: 'Estado Actualizado',
        message: `La solicitud ha sido marcada como ${status}.`
      });
      fetchRequests();
    } catch (err) {
      setModalFeedback({
        isOpen: true,
        title: 'Error',
        message: err.message || 'Error al actualizar estado de solicitud'
      });
    }
  };

  return (
    <div>
      <Header
        title="Centro de Comunicaciones"
        subtitle="Tablón de anuncios, alertas del sistema, buzón de solicitudes y plantillas directas"
      />

      <div className="page-container">
        {/* Navegación por pestañas secundarias */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            className={`btn ${activeSubTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('announcements')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Pin size={16} /> Avisos Generales
          </button>
          <button
            className={`btn ${activeSubTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('alerts')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Bell size={16} /> Alertas del Sistema
          </button>
          <button
            className={`btn ${activeSubTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('requests')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MessageSquare size={16} /> Buzón de Solicitudes
          </button>
          <button
            className={`btn ${activeSubTab === 'contact' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubTab('contact')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Send size={16} /> Contacto Directo & WhatsApp
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 1: AVISOS GENERALES                          */}
        {/* ---------------------------------------------------- */}
        {activeSubTab === 'announcements' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Avisos Generales del Equipo</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mensajes fijados por administración para todos los colaboradores</p>
              </div>
              {user?.role === 'admin' && (
                <button className="btn btn-primary" onClick={handleOpenCreateAnnModal}>
                  <Plus size={18} /> Publicar Nuevo Aviso
                </button>
              )}
            </div>

            {loadingAnnouncements ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando avisos del sistema...</p>
            ) : announcements.length === 0 ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>
                <Pin size={40} color="var(--primary)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p>No hay avisos fijados en este momento.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="dashboard-card" style={{ borderLeft: ann.isPinned ? '4px solid var(--primary)' : '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {ann.isPinned && <Pin size={18} color="var(--primary)" fill="var(--primary)" />}
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{ann.title}</h4>
                        <span className="badge-status badge-verde" style={{ fontSize: '0.75rem' }}>{ann.category}</span>
                      </div>
                      {user?.role === 'admin' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="star-btn" 
                            style={{ color: 'var(--primary)' }}
                            onClick={() => handleOpenEditAnnModal(ann)}
                            title="Editar aviso"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            className="star-btn" 
                            style={{ color: '#dc2626' }}
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            title="Eliminar aviso"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.5', marginBottom: '12px' }}>
                      {ann.content}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>Publicado por: <strong>{ann.authorName || 'Admin'}</strong></span>
                      <span>•</span>
                      <span>{new Date(ann.createdAt || Date.now()).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 2: ALERTAS DEL SISTEMA                        */}
        {/* ---------------------------------------------------- */}
        {activeSubTab === 'alerts' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Alertas Automáticas del Sistema</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Notificaciones generadas automáticamente a partir de citas y estados de miembros</p>
            </div>

            {loadingAlerts ? (
              <p style={{ color: 'var(--text-muted)' }}>Compilando alertas del sistema...</p>
            ) : systemAlerts.length === 0 ? (
              <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>
                <CheckCircle size={40} color="#16a34a" style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p>No hay alertas pendientes en este momento. ¡Todo al día!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {systemAlerts.map(alt => (
                  <div key={alt.id} className="dashboard-card" style={{ borderLeft: alt.type === 'urgent' ? '4px solid #dc2626' : '4px solid var(--accent-gold)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {alt.type === 'urgent' ? (
                          <AlertTriangle size={24} color="#dc2626" />
                        ) : (
                          <Calendar size={24} color="var(--primary)" />
                        )}
                        <div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '2px' }}>{alt.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{alt.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 3: BUZÓN DE SOLICITUDES                      */}
        {/* ---------------------------------------------------- */}
        {activeSubTab === 'requests' && (() => {
          const filteredRequests = requests.filter(req => {
            const isAuthor = 
              (req.requestedByEmail && user?.email && req.requestedByEmail.toLowerCase() === user.email.toLowerCase()) ||
              (req.requestedById && (user?.id || user?.uid) && String(req.requestedById) === String(user.id || user.uid)) ||
              (req.requestedBy && user?.name && req.requestedBy.toLowerCase() === user.name.toLowerCase());

            const isRecipient = 
              (!req.recipientName || req.recipientName === 'Todos' || req.recipient === 'Todos' || req.recipient === 'todos' || req.recipient === 'all') ||
              (req.recipientId && (user?.id || user?.uid) && String(req.recipientId) === String(user.id || user.uid)) ||
              (req.recipientName && user?.name && req.recipientName.toLowerCase() === user.name.toLowerCase()) ||
              (req.recipient && user?.email && req.recipient.toLowerCase() === user.email.toLowerCase());

            return isAuthor || isRecipient || user?.role === 'admin';
          });

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Buzón de Solicitudes</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Envía y gestiona solicitudes entre miembros del equipo (reasignaciones, apoyo en visitas, consultas)</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenRequestModal}>
                  <Plus size={18} /> Enviar Nueva Solicitud
                </button>
              </div>

              {loadingRequests ? (
                <p style={{ color: 'var(--text-muted)' }}>Cargando solicitudes...</p>
              ) : filteredRequests.length === 0 ? (
                <div className="dashboard-card" style={{ textAlign: 'center', padding: '30px' }}>
                  <MessageSquare size={40} color="var(--primary)" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>No tienes solicitudes enviadas ni dirigidas a ti en este momento.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {filteredRequests.map(req => {
                    const statusLower = (req.status || 'pendiente').toLowerCase();
                    const badgeClass = 
                      statusLower === 'atendida' ? 'badge-verde' :
                      statusLower === 'rechazada' ? 'badge-rojo' : 'badge-amarillo';

                    const canManageStatus = statusLower === 'pendiente' && (
                      user?.role === 'admin' ||
                      (req.recipientName && req.recipientName.toLowerCase() === (user?.name || '').toLowerCase()) ||
                      (req.recipientId && String(req.recipientId) === String(user?.id || user?.uid)) ||
                      (!req.recipientName || req.recipientName === 'Todos')
                    );

                    return (
                      <div key={req.id} className="dashboard-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                              {req.category}
                            </span>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '2px' }}>{req.subject}</h4>
                          </div>
                          <span className={`badge-status ${badgeClass}`}>{req.status || 'Pendiente'}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: '1.5', marginBottom: '12px' }}>
                          {req.details}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span>De: <strong>{req.requestedBy || 'Visitador'}</strong></span>
                            <span>•</span>
                            <span>Para: <strong style={{ color: (req.recipientName === 'Todos' || !req.recipientName) ? 'var(--primary)' : 'inherit' }}>{req.recipientName || req.recipient || 'Todos'}</strong></span>
                            {req.createdAt && (
                              <>
                                <span>•</span>
                                <span>{new Date(req.createdAt).toLocaleDateString('es-AR')}</span>
                              </>
                            )}
                          </div>
                          {canManageStatus && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#16a34a' }}
                                onClick={() => handleUpdateRequestStatus(req.id, 'Atendida')}
                              >
                                <CheckCircle size={14} /> Atender
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#dc2626' }}
                                onClick={() => handleUpdateRequestStatus(req.id, 'Rechazada')}
                              >
                                <XCircle size={14} /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ---------------------------------------------------- */}
        {/* PESTAÑA 4: HUB DE CONTACTO DIRECTO & PLANTILLAS       */}
        {/* ---------------------------------------------------- */}
        {activeSubTab === 'contact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Panel de envío de mensajes */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary)" /> Enviar Mensaje Directo
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Selecciona un miembro y una plantilla predefinida para abrir WhatsApp Web, SMS o Correo.
              </p>

              <div className="form-group">
                <label>Seleccionar Miembro Recipiente *</label>
                <select
                  className="form-control"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">-- Seleccionar Miembro --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.nombre} ({m.phone || m.telefono || 'Sin tel'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Seleccionar Plantilla Predefinida</label>
                <select
                  className="form-control"
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                >
                  {Object.keys(templatesMap).map(key => (
                    <option key={key} value={key}>{templatesMap[key].title}</option>
                  ))}
                </select>
              </div>

              {selectedTemplateKey === 'personalizado' && (
                <div className="form-group">
                  <label>Escribir Mensaje Personalizado</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Escribe el contenido del mensaje..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                  />
                </div>
              )}

              {/* Previsualización del mensaje */}
              <div style={{ background: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Previsualización del texto a enviar:
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: '1.4' }}>
                  "{getRenderedMessage() || 'Selecciona un miembro y plantilla...'}"
                </div>
              </div>

              {/* Botones de acción por canal */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, backgroundColor: '#25D366', borderColor: '#25D366', justifyContent: 'center' }}
                  onClick={() => handleSendChannel('WhatsApp')}
                >
                  <Phone size={16} /> WhatsApp Web
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleSendChannel('Correo')}
                >
                  <Mail size={16} /> Correo
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleSendChannel('SMS')}
                >
                  <Send size={16} /> SMS
                </button>
              </div>
            </div>

            {/* Historial de contactos enviados */}
            <div className="dashboard-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" /> Historial de Contactos Registrados
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Registro de mensajes y recordatorios enviados a los miembros
              </p>

              {/* Bar de Búsqueda y Filtrado */}
              <form onSubmit={handleSearchLogs} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div className="search-input-box" style={{ flex: 1 }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar por miembro o palabra clave..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', gap: '6px' }}>
                  <Search size={16} /> Buscar
                </button>
                {appliedLogSearchQuery && (
                  <button type="button" className="btn btn-secondary" onClick={handleClearLogSearch} style={{ padding: '0 12px' }}>
                    Limpiar
                  </button>
                )}
              </form>

              {loadingLogs ? (
                <p style={{ color: 'var(--text-muted)' }}>Cargando historial de envíos...</p>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {appliedLogSearchQuery 
                    ? `No se encontraron mensajes que coincidan con "${appliedLogSearchQuery}".` 
                    : 'Aún no hay mensajes registrados en el historial.'}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '220px' }}>
                    {paginatedLogs.map(log => (
                      <div key={log.id} style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-dark)' }}>{log.memberName}</strong>
                          <span className="badge-status badge-verde" style={{ fontSize: '0.7rem' }}>{log.type}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Plantilla: {log.templateName} • {new Date(log.timestamp).toLocaleString('es-AR')}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                          "{log.messageText}"
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Control de Paginación */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <span>
                      Página <strong>{currentLogPage}</strong> de <strong>{totalLogPages}</strong> ({filteredLogs.length} mensajes)
                    </span>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        disabled={currentLogPage === 1}
                        onClick={() => setLogCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        <ChevronLeft size={16} /> Anterior
                      </button>

                      {Array.from({ length: totalLogPages }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          type="button"
                          className={`btn ${pageNum === currentLogPage ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: '0.8rem', minWidth: '30px', justifyContent: 'center' }}
                          onClick={() => setLogCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        disabled={currentLogPage === totalLogPages}
                        onClick={() => setLogCurrentPage(prev => Math.min(prev + 1, totalLogPages))}
                      >
                        Siguiente <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Modal para Crear / Editar Aviso (Admin) */}
      {isAnnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">{editingAnnouncement ? 'Editar Aviso General' : 'Publicar Nuevo Aviso General'}</h2>
              <button className="star-btn" onClick={() => setIsAnnModalOpen(false)}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleSaveAnnouncement}>
              <div className="form-group">
                <label>Título del Aviso *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej: Recordatorio de reunión semanal"
                  value={annFormData.title}
                  onChange={(e) => setAnnFormData({ ...annFormData, title: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    className="form-control"
                    value={annFormData.category}
                    onChange={(e) => setAnnFormData({ ...annFormData, category: e.target.value })}
                  >
                    <option value="Importante">Importante</option>
                    <option value="Información">Información</option>
                    <option value="Asignación">Asignación</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={annFormData.isPinned}
                    onChange={(e) => setAnnFormData({ ...annFormData, isPinned: e.target.checked })}
                  />
                  <label htmlFor="isPinned" style={{ cursor: 'pointer' }}>Fijar al inicio del tablón</label>
                </div>
              </div>
              <div className="form-group">
                <label>Contenido del Aviso *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  placeholder="Escribe el texto del aviso..."
                  value={annFormData.content}
                  onChange={(e) => setAnnFormData({ ...annFormData, content: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAnnModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingAnnouncement ? 'Guardar Cambios' : 'Publicar Aviso'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Solicitud */}
      {isReqModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Enviar Solicitud</h2>
              <button className="star-btn" onClick={() => setIsReqModalOpen(false)}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Destinatario / Enviar a *</label>
                <select
                  className="form-control"
                  value={reqFormData.recipientName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Todos') {
                      setReqFormData({ ...reqFormData, recipientName: 'Todos', recipientId: '' });
                    } else {
                      const found = systemUsers.find(u => (u.name || u.email) === val);
                      setReqFormData({
                        ...reqFormData,
                        recipientName: val,
                        recipientId: found ? (found.id || found.uid || '') : ''
                      });
                    }
                  }}
                >
                  <option value="Todos">🌐 Todos (Solicitud o aviso para todo el equipo)</option>
                  {systemUsers.map(u => (
                    <option key={u.id || u.uid} value={u.name || u.email}>
                      👤 {u.name || u.email} ({u.role === 'admin' ? 'Administrador' : 'Visitador'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Asunto *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ej: Solicito cambio de horario o reasignación"
                  value={reqFormData.subject}
                  onChange={(e) => setReqFormData({ ...reqFormData, subject: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  className="form-control"
                  value={reqFormData.category}
                  onChange={(e) => setReqFormData({ ...reqFormData, category: e.target.value })}
                >
                  <option value="Reasignación">Reasignación de visita</option>
                  <option value="Actualización Datos">Actualización de datos</option>
                  <option value="Soporte / Consulta">Soporte o Consulta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Detalle de la Solicitud *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  placeholder="Explica detalladamente la solicitud..."
                  value={reqFormData.details}
                  onChange={(e) => setReqFormData({ ...reqFormData, details: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsReqModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Enviar Solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Feedback Estilizado */}
      <SuccessModal
        isOpen={modalFeedback.isOpen}
        onClose={() => setModalFeedback({ isOpen: false, title: '', message: '' })}
        title={modalFeedback.title}
        message={modalFeedback.message}
      />
    </div>
  );
};
