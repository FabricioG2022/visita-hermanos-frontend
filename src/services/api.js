const API_BASE_URL = 'http://localhost:5000/api';

// Simple caché en memoria del cliente (browser) para acelerar navegación (0ms)
const clientCache = new Map();
const CLIENT_CACHE_TTL = 30 * 1000; // 30 segundos de caché en cliente

const getCachedData = (key) => {
  const item = clientCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    clientCache.delete(key);
    return null;
  }
  return item.data;
};

const setCachedData = (key, data, ttlMs = CLIENT_CACHE_TTL) => {
  clientCache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

const clearClientCache = (...prefixKeys) => {
  if (prefixKeys.length === 0) {
    clientCache.clear();
    return;
  }
  for (const k of clientCache.keys()) {
    if (prefixKeys.some(p => k.startsWith(p))) {
      clientCache.delete(k);
    }
  }
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al iniciar sesión');
    }
    clearClientCache();
    return res.json();
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al registrar usuario');
    }
    clearClientCache();
    return res.json();
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al solicitar recuperación');
    }
    return res.json();
  },

  getUsers: async () => {
    const cacheKey = 'users_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener lista de usuarios');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  inviteUser: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/invite`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al invitar usuario');
    }
    clearClientCache('users_list');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Sesión no válida');
    return res.json();
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar perfil');
    }
    clearClientCache('users_list');
    return res.json();
  },

  // Dashboard
  getDashboardStats: async () => {
    const cacheKey = 'dashboard_stats';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al cargar datos del dashboard');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  // Miembros
  getMembers: async (search = '') => {
    const cacheKey = `members_${search}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/members${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener la lista de miembros');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  getMemberById: async (id) => {
    const cacheKey = `member_${id}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/members/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Miembro no encontrado');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  createMember: async (memberData) => {
    const res = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear miembro');
    }
    clearClientCache('members', 'dashboard_stats', 'visits');
    return res.json();
  },

  updateMember: async (id, memberData) => {
    const res = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(memberData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar miembro');
    }
    clearClientCache('members', `member_${id}`, 'dashboard_stats', 'visits');
    return res.json();
  },

  deleteMember: async (id) => {
    const res = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al eliminar miembro');
    }
    clearClientCache('members', `member_${id}`, 'dashboard_stats', 'visits');
    return res.json();
  },

  toggleFavorite: async (id) => {
    const res = await fetch(`${API_BASE_URL}/members/${id}/favorite`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al cambiar favorito');
    clearClientCache('members', `member_${id}`, 'dashboard_stats');
    return res.json();
  },

  addMemberNote: async (id, texto) => {
    const res = await fetch(`${API_BASE_URL}/members/${id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ texto })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al guardar la nota');
    }
    clearClientCache('members', `member_${id}`);
    return res.json();
  },

  // Citas
  getAppointments: async () => {
    const cacheKey = 'appointments_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/appointments`, {
        headers: getAuthHeaders()
      }, 2500);
      if (!res.ok) throw new Error('Error al cargar citas');
      const data = await res.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      console.warn("Uso de respuesta de fallback/caché para citas:", e);
      return cached || [];
    }
  },

  createAppointment: async (appointmentData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(appointmentData)
    }, 4000);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al programar cita');
    }
    clearClientCache('appointments_list');
    return res.json();
  },

  updateAppointmentStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar estado de la cita');
    }
    clearClientCache('appointments_list');
    return res.json();
  },


  // Visitas
  getVisits: async () => {
    const cacheKey = 'visits_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/visits`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener historial de visitas');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  createVisit: async (visitData) => {
    const res = await fetch(`${API_BASE_URL}/visits`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(visitData)
    });
    if (!res.ok) throw new Error('Error al registrar visita');
    clearClientCache('visits_list', 'members', 'dashboard_stats');
    return res.json();
  },

  // Versículo del día
  getDailyVerse: async (date = '') => {
    const cacheKey = `verse_${date}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await fetch(`${API_BASE_URL}/verse/today${query}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener versículo del día');
    const data = await res.json();
    setCachedData(cacheKey, data, 24 * 60 * 60 * 1000); // 24 horas para versículo
    return data;
  },

  // Mensajes: Avisos
  getAnnouncements: async () => {
    const cacheKey = 'announcements_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/messages/announcements`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener avisos');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  createAnnouncement: async (announcementData) => {
    const res = await fetch(`${API_BASE_URL}/messages/announcements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(announcementData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al publicar aviso');
    }
    clearClientCache('announcements_list');
    return res.json();
  },

  updateAnnouncement: async (id, announcementData) => {
    const res = await fetch(`${API_BASE_URL}/messages/announcements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(announcementData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar aviso');
    }
    clearClientCache('announcements_list');
    return res.json();
  },

  deleteAnnouncement: async (id) => {
    const res = await fetch(`${API_BASE_URL}/messages/announcements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar aviso');
    clearClientCache('announcements_list');
    return res.json();
  },

  // Mensajes: Solicitudes
  getRequests: async () => {
    const cacheKey = 'requests_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/messages/requests`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener solicitudes');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  createRequest: async (requestData) => {
    const res = await fetch(`${API_BASE_URL}/messages/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al enviar solicitud');
    }
    clearClientCache('requests_list');
    return res.json();
  },

  updateRequestStatus: async (id, status, responseNote = '') => {
    const res = await fetch(`${API_BASE_URL}/messages/requests/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, responseNote })
    });
    if (!res.ok) throw new Error('Error al actualizar solicitud');
    clearClientCache('requests_list');
    return res.json();
  },

  // Mensajes: Historial de contactos
  getContactLogs: async () => {
    const cacheKey = 'contact_logs_list';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const res = await fetch(`${API_BASE_URL}/messages/logs`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al obtener historial de contactos');
    const data = await res.json();
    setCachedData(cacheKey, data);
    return data;
  },

  createContactLog: async (logData) => {
    const res = await fetch(`${API_BASE_URL}/messages/logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(logData)
    });
    if (!res.ok) throw new Error('Error al registrar contacto');
    clearClientCache('contact_logs_list');
    return res.json();
  },

  // Configuración y Parámetros del Sistema
  getSettings: async () => {
    const cacheKey = 'app_settings_global';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
        headers: getAuthHeaders()
      }, 2000);
      if (!res.ok) throw new Error('Error al obtener configuración del sistema');
      const data = await res.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (e) {
      console.warn("Uso de respuesta de fallback/caché para configuración:", e);
      return cached || null;
    }
  },

  updateSettings: async (settingsData) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData)
    }, 4000);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al guardar configuración');
    }
    clearClientCache('app_settings_global');
    return res.json();
  }
};
