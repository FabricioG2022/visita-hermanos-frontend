import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { VisitsPage } from './pages/VisitsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MessagesPage } from './pages/MessagesPage';
import { VersePage } from './pages/VersePage';
import { SettingsPage } from './pages/SettingsPage';
import { MemberModal } from './components/MemberModal';
import { AppointmentModal } from './components/AppointmentModal';
import { SuccessModal } from './components/SuccessModal';
import { api } from './services/api';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState(null);
  const [membersFilter, setMembersFilter] = useState('all');
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [targetMemberForAppointment, setTargetMemberForAppointment] = useState(null);

  // Contador de versión para reactividad instantánea en citas
  const [appointmentsVersion, setAppointmentsVersion] = useState(0);

  // Estado para Modal de Éxito estilizado
  const [successModalState, setSuccessModalState] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Estado para editar desde perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfileMember, setEditingProfileMember] = useState(null);

  // Función de navegación que actualiza el estado y el historial del navegador
  const navigateToTab = (tab, member = null, shouldPushState = true) => {
    setActiveTab(tab);
    if (member !== undefined) {
      setSelectedMember(member);
    }
    if (shouldPushState) {
      const stateObj = { tab, memberId: member ? member.id : null };
      const hash = tab === 'profile' && member ? `#profile-${member.id}` : `#${tab}`;
      window.history.pushState(stateObj, '', hash);
    }
  };

  const handleNavigateToMembersWithFilter = (filterMode = 'all') => {
    setMembersFilter(filterMode);
    navigateToTab('members');
  };

  const showSuccess = (title, message) => {
    setSuccessModalState({
      isOpen: true,
      title,
      message
    });
  };

  // Listener para las flechas Atrás / Adelante del navegador
  useEffect(() => {
    const handlePopState = async (e) => {
      if (e.state && e.state.tab) {
        const { tab, memberId } = e.state;
        setActiveTab(tab);
        if (memberId) {
          try {
            const m = await api.getMemberById(memberId);
            setSelectedMember(m);
          } catch (err) {
            console.error("Error al cargar miembro desde historial:", err);
          }
        } else {
          setSelectedMember(null);
        }
      } else {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('profile-')) {
          const id = hash.replace('profile-', '');
          try {
            const m = await api.getMemberById(id);
            setSelectedMember(m);
            setActiveTab('profile');
          } catch (err) {
            setActiveTab('members');
          }
        } else if (hash) {
          setActiveTab(hash);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Cargando Visita Hermanos...</h2>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectMember = (member) => {
    navigateToTab('profile', member);
  };

  const handleViewRecentVisitMember = async (recentVisit) => {
    try {
      let member = null;
      if (recentVisit.id) {
        try {
          member = await api.getMemberById(recentVisit.id);
        } catch (e) {
          const allMembers = await api.getMembers();
          member = allMembers.find(m => m.name.toLowerCase() === recentVisit.name?.toLowerCase() || m.id === recentVisit.id);
        }
      }
      if (!member) {
        member = {
          id: recentVisit.id,
          name: recentVisit.name,
          status: recentVisit.status || 'Verde',
          lastVisit: recentVisit.date,
          fotoUrl: recentVisit.fotoUrl
        };
      }
      navigateToTab('profile', member);
    } catch (err) {
      console.error("Error al redirigir al miembro:", err);
      navigateToTab('members');
    }
  };

  const handleScheduleAppointment = (member = null) => {
    setTargetMemberForAppointment(member);
    setIsAppointmentModalOpen(true);
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      await api.createAppointment(appointmentData);
      setAppointmentsVersion(v => v + 1);
      setIsAppointmentModalOpen(false);
      
      const targetName = appointmentData.memberName || 'el miembro';
      showSuccess(
        '¡Cita Programada con Éxito!',
        `La cita para ${targetName} se ha agendado correctamente en el sistema para el día ${appointmentData.date} a las ${appointmentData.time} hs.`
      );
    } catch (err) {
      showSuccess('Error al programar la cita', err.message || 'Error al programar la cita');
      throw err;
    }
  };

  const handleEditFromProfile = (member) => {
    setEditingProfileMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveProfileEdit = async (formData) => {
    try {
      const updated = await api.updateMember(editingProfileMember.id, formData);
      setSelectedMember(updated);
      setIsEditModalOpen(false);
      setEditingProfileMember(null);
      showSuccess('¡Miembro Actualizado!', 'Los datos del miembro han sido actualizados correctamente.');
    } catch (err) {
      showSuccess('Error al actualizar', err.message || 'Error al actualizar miembro');
    }
  };

  const handleDeleteFromProfile = async (id) => {
    try {
      await api.deleteMember(id);
      setSelectedMember(null);
      navigateToTab('members');
      showSuccess('Miembro Eliminado', 'El miembro ha sido removido del sistema con éxito.');
    } catch (err) {
      showSuccess('Error al eliminar', err.message || 'Error al eliminar');
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => navigateToTab(tab)} />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToMembers={handleNavigateToMembersWithFilter}
            onViewMember={handleViewRecentVisitMember}
            onNavigateToVisits={() => navigateToTab('visits')}
            onScheduleAppointment={() => handleScheduleAppointment(null)}
          />
        )}

        {activeTab === 'members' && (
          <MembersPage
            onSelectMember={handleSelectMember}
            initialFilter={membersFilter}
          />
        )}

        {activeTab === 'profile' && (
          <MemberProfilePage
            member={selectedMember}
            onBack={() => navigateToTab('members')}
            onScheduleAppointment={handleScheduleAppointment}
            onEditMember={handleEditFromProfile}
            onDeleteMember={handleDeleteFromProfile}
            appointmentsVersion={appointmentsVersion}
          />
        )}

        {activeTab === 'visits' && (
          <VisitsPage
            onSelectMember={handleSelectMember}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsPage
            onScheduleAppointment={handleScheduleAppointment}
            onSelectMember={handleSelectMember}
            appointmentsVersion={appointmentsVersion}
          />
        )}

        {(activeTab === 'verse' || activeTab === 'vehicle') && (
          <VersePage />
        )}

        {activeTab === 'messages' && (
          <MessagesPage onSelectMember={handleSelectMember} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSubmit={handleCreateAppointment}
        member={targetMemberForAppointment}
      />

      <MemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProfileMember(null);
        }}
        onSubmit={handleSaveProfileEdit}
        initialData={editingProfileMember}
      />

      <SuccessModal
        isOpen={successModalState.isOpen}
        title={successModalState.title}
        message={successModalState.message}
        onClose={() => setSuccessModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
