import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { VisitModal } from '../components/VisitModal';
import { SuccessModal } from '../components/SuccessModal';
import { api } from '../services/api';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  UserCheck, 
  AlertTriangle, 
  Download, 
  Printer, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  FileSpreadsheet, 
  Filter, 
  Users,
  MapPin,
  Search
} from 'lucide-react';

export const ReportsPage = ({ onSelectMember }) => {
  const [members, setMembers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'month', 'quarter', 'year', 'all'

  // Buscador y Paginación en Radar de Atención Prioritaria
  const [prioritySearch, setPrioritySearch] = useState('');
  const [priorityPage, setPriorityPage] = useState(1);
  const PRIORITY_PER_PAGE = 5;

  // Buscador y Paginación en Cobertura de Visitadores
  const [visitadorSearch, setVisitadorSearch] = useState('');
  const [visitadorPage, setVisitadorPage] = useState(1);
  const VISITADOR_PER_PAGE = 5;

  // Modal para registrar visita directamente desde el radar de desatención
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [targetMemberForVisit, setTargetMemberForVisit] = useState(null);
  const [successModalState, setSuccessModalState] = useState({ isOpen: false, title: '', message: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, visitsRes, appointmentsRes] = await Promise.all([
        api.getMembers().catch(() => []),
        api.getVisits().catch(() => []),
        api.getAppointments().catch(() => [])
      ]);

      const membersData = Array.isArray(membersRes) ? membersRes : (membersRes?.data || []);
      const visitsData = Array.isArray(visitsRes) ? visitsRes : (visitsRes?.data || []);
      const appointmentsData = Array.isArray(appointmentsRes) ? appointmentsRes : (appointmentsRes?.data || []);

      setMembers(membersData);
      setVisits(visitsData);
      setAppointments(appointmentsData);
    } catch (err) {
      console.error("Error al cargar datos para reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Resetear páginas al cambiar de período o términos de búsqueda
  useEffect(() => {
    setPriorityPage(1);
  }, [prioritySearch, period]);

  useEffect(() => {
    setVisitadorPage(1);
  }, [visitadorSearch, period]);

  // Filtrado defensivo de visitas según el período seleccionado
  const filteredVisits = useMemo(() => {
    const list = Array.isArray(visits) ? visits : [];
    if (period === 'all') return list;
    const now = new Date();

    return list.filter(v => {
      if (!v || !v.date || typeof v.date !== 'string') return false;
      const dateStr = v.date.trim();
      const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
      let vDate;
      if (parts.length === 3) {
        const [d, m, y] = parts;
        vDate = new Date(y.length === 4 ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : dateStr);
      } else {
        vDate = new Date(dateStr);
      }
      if (isNaN(vDate.getTime())) return true;

      const diffDays = (now.getTime() - vDate.getTime()) / (1000 * 3600 * 24);
      if (period === 'month') return diffDays <= 30;
      if (period === 'quarter') return diffDays <= 90;
      if (period === 'year') return diffDays <= 365;
      return true;
    });
  }, [visits, period]);

  // Métricas del Semáforo Pastoral
  const statusStats = useMemo(() => {
    const list = Array.isArray(members) ? members : [];
    const verde = list.filter(m => (m?.status || '').toLowerCase() === 'verde').length;
    const amarillo = list.filter(m => (m?.status || '').toLowerCase() === 'amarillo').length;
    const rojo = list.filter(m => (m?.status || '').toLowerCase() === 'rojo').length;
    const inactivos = list.filter(m => {
      const s = (m?.status || '').toLowerCase();
      return s === 'inactivo' || s === 'inactiva';
    }).length;
    const totalCount = list.length;
    const totalDiv = totalCount || 1;

    return {
      verde,
      amarillo,
      rojo,
      inactivos,
      total: totalCount,
      pctVerde: Math.round((verde / totalDiv) * 100),
      pctAmarillo: Math.round((amarillo / totalDiv) * 100),
      pctRojo: Math.round((rojo / totalDiv) * 100),
      pctInactivos: Math.round((inactivos / totalDiv) * 100)
    };
  }, [members]);

  // Radar de Atención Prioritaria completo
  const priorityMembers = useMemo(() => {
    const list = Array.isArray(members) ? members : [];
    return list.filter(m => {
      if (!m) return false;
      const st = (m.status || '').toLowerCase();
      if (st === 'rojo' || st === 'amarillo') return true;

      const lv = m.lastVisit;
      if (!lv || typeof lv !== 'string' || lv.includes('Sin visitas') || lv.includes('N/A')) return true;

      const parts = lv.includes('/') ? lv.split('/') : lv.split('-');
      if (parts.length === 3) {
        const [d, mon, y] = parts;
        const time = new Date(`${y}-${mon.padStart(2, '0')}-${d.padStart(2, '0')}`).getTime();
        if (time && (Date.now() - time) > 60 * 24 * 60 * 60 * 1000) return true;
      }
      return false;
    });
  }, [members]);

  const normalizeStr = (str) =>
    (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Radar filtrado por búsqueda (normalizado por nombre o teléfono del miembro)
  const filteredPriorityMembers = useMemo(() => {
    if (!prioritySearch.trim()) return priorityMembers;
    const q = normalizeStr(prioritySearch);
    return priorityMembers.filter(m => 
      normalizeStr(m?.name).includes(q) ||
      normalizeStr(m?.phone).includes(q)
    );
  }, [priorityMembers, prioritySearch]);

  const priorityTotalPages = Math.ceil(filteredPriorityMembers.length / PRIORITY_PER_PAGE) || 1;
  const priorityValidPage = Math.min(priorityPage, priorityTotalPages);
  const paginatedPriorityMembers = filteredPriorityMembers.slice((priorityValidPage - 1) * PRIORITY_PER_PAGE, priorityValidPage * PRIORITY_PER_PAGE);

  // Ranking de Visitadores completo
  const visitadorRanking = useMemo(() => {
    const list = Array.isArray(filteredVisits) ? filteredVisits : [];
    const counts = {};
    list.forEach(v => {
      if (!v) return;
      const name = v.responsible || 'Sin especificar';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVisits]);

  // Ranking de Visitadores filtrado por búsqueda (normalizado insensible a tildes)
  const filteredVisitadorRanking = useMemo(() => {
    if (!visitadorSearch.trim()) return visitadorRanking;
    const q = normalizeStr(visitadorSearch);
    return visitadorRanking.filter(vr => 
      normalizeStr(vr?.name).includes(q)
    );
  }, [visitadorRanking, visitadorSearch]);

  const visitadorTotalPages = Math.ceil(filteredVisitadorRanking.length / VISITADOR_PER_PAGE) || 1;
  const visitadorValidPage = Math.min(visitadorPage, visitadorTotalPages);
  const paginatedVisitadorRanking = filteredVisitadorRanking.slice((visitadorValidPage - 1) * VISITADOR_PER_PAGE, visitadorValidPage * VISITADOR_PER_PAGE);

  // Distribución por Tipo de Visita
  const visitTypeStats = useMemo(() => {
    const list = Array.isArray(filteredVisits) ? filteredVisits : [];
    const counts = {};
    list.forEach(v => {
      if (!v) return;
      const type = v.visitType || 'Visita en domicilio';
      counts[type] = (counts[type] || 0) + 1;
    });
    const total = list.length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      pct: Math.round((count / total) * 100)
    }));
  }, [filteredVisits]);

  // Citas Estadísticas
  const appointmentStats = useMemo(() => {
    const list = Array.isArray(appointments) ? appointments : [];
    const realizadas = list.filter(a => (a?.status || '').toLowerCase() === 'realizada').length;
    const pendientes = list.filter(a => (a?.status || '').toLowerCase() === 'pendiente').length;
    const canceladas = list.filter(a => (a?.status || '').toLowerCase() === 'cancelada').length;
    return { realizadas, pendientes, canceladas, total: list.length };
  }, [appointments]);

  // Handler para exportar informe a Excel (.xls) profesional con colores, centrado y formato de celdas
  const handleExportCSV = () => {
    const emitDate = `${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}`;
    const periodText = period === 'month' ? 'Este Mes (30 días)' : period === 'quarter' ? 'Último Trimestre (90 días)' : period === 'year' ? 'Año Actual' : 'Histórico Total';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Reporte Pastoral</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    .main-title { background-color: #1e3a8a; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; vertical-align: middle; padding: 14px; border: 1px solid #1e3a8a; }
    .sub-title { background-color: #f1f5f9; color: #475569; font-size: 10pt; text-align: center; vertical-align: middle; padding: 6px; border: 1px solid #cbd5e1; }
    .section-title { background-color: #1e40af; color: #ffffff; font-size: 12pt; font-weight: bold; text-align: left; vertical-align: middle; padding: 10px 14px; border: 1px solid #1d4ed8; }
    th { background-color: #0f172a; color: #ffffff; font-size: 11pt; font-weight: bold; text-align: center; vertical-align: middle; padding: 10px; border: 1px solid #334155; }
    td { padding: 8px 12px; border: 1px solid #cbd5e1; vertical-align: middle; font-size: 10pt; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .bg-alt { background-color: #f8fafc; }
    .badge-verde { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
    .badge-amarillo { background-color: #fef3c7; color: #b45309; font-weight: bold; text-align: center; }
    .badge-rojo { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
    .badge-inactivo { background-color: #e2e8f0; color: #475569; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="4" class="main-title">REPORTE PASTORAL Y SALUD DE LA CONGREGACIÓN</td>
    </tr>
    <tr>
      <td colspan="4" class="sub-title">Fecha de Emisión: ${emitDate} &nbsp;|&nbsp; Rango de Tiempo: ${periodText}</td>
    </tr>
  </table>

  <!-- SECCIÓN 1: SALUD PASTORAL -->
  <table>
    <tr>
      <td colspan="3" class="section-title">1. RESUMEN DE SALUD PASTORAL Y SEMÁFORO DE ESTADO</td>
    </tr>
    <tr>
      <th>Estado de Salud</th>
      <th>Total de Miembros</th>
      <th>Porcentaje del Total</th>
    </tr>
    <tr>
      <td class="badge-verde">Verde (Buen Estado)</td>
      <td class="text-center">${statusStats.verde}</td>
      <td class="text-center"><b>${statusStats.pctVerde}%</b></td>
    </tr>
    <tr class="bg-alt">
      <td class="badge-amarillo">Amarillo (Atención Constante)</td>
      <td class="text-center">${statusStats.amarillo}</td>
      <td class="text-center"><b>${statusStats.pctAmarillo}%</b></td>
    </tr>
    <tr>
      <td class="badge-rojo">Rojo (Urgente / Necesita Visita)</td>
      <td class="text-center">${statusStats.rojo}</td>
      <td class="text-center"><b>${statusStats.pctRojo}%</b></td>
    </tr>
    <tr class="bg-alt">
      <td class="badge-inactivo">Inactivos (+6 Meses sin Visita)</td>
      <td class="text-center">${statusStats.inactivos}</td>
      <td class="text-center"><b>${statusStats.pctInactivos}%</b></td>
    </tr>
    <tr style="background-color: #e2e8f0; font-weight: bold;">
      <td class="text-center"><b>TOTAL DE MIEMBROS</b></td>
      <td class="text-center"><b>${statusStats.total}</b></td>
      <td class="text-center"><b>100%</b></td>
    </tr>
  </table>

  <!-- SECCIÓN 2: RADAR DE ATENCIÓN PRIORITARIA -->
  <table>
    <tr>
      <td colspan="4" class="section-title" style="background-color: #b91c1c; border-color: #991b1b;">2. RADAR DE ATENCIÓN PRIORITARIA (MIEMBROS EN RIESGO URGENTE)</td>
    </tr>
    <tr>
      <th>Nombre del Miembro</th>
      <th>Teléfono</th>
      <th>Estado de Salud</th>
      <th>Última Visita Registrada</th>
    </tr>`;

    if (priorityMembers.length === 0) {
      html += `<tr><td colspan="4" class="text-center" style="color: #15803d; font-weight: bold;">Sin miembros en situación de riesgo urgente</td></tr>`;
    } else {
      priorityMembers.forEach((m, idx) => {
        if (!m) return;
        const stLower = (m.status || '').toLowerCase();
        const badgeStyle = stLower === 'rojo' ? 'badge-rojo' : stLower === 'amarillo' ? 'badge-amarillo' : 'badge-inactivo';
        const rowClass = idx % 2 === 1 ? 'class="bg-alt"' : '';

        html += `<tr ${rowClass}>
          <td><b>${m.name || 'Sin Nombre'}</b></td>
          <td class="text-center">${m.phone || 'Sin Teléfono'}</td>
          <td class="${badgeStyle}">${m.status || 'Revisar'}</td>
          <td class="text-center">${m.lastVisit || 'Sin Visitas'}</td>
        </tr>`;
      });
    }

    html += `</table>

  <!-- SECCIÓN 3: RENDIMIENTO DE VISITADORES -->
  <table>
    <tr>
      <td colspan="3" class="section-title" style="background-color: #0f766e; border-color: #115e59;">3. COBERTURA Y RENDIMIENTO DEL EQUIPO DE VISITADORES</td>
    </tr>
    <tr>
      <th>Visitador / Colaborador</th>
      <th>Visitas Realizadas</th>
      <th>Porcentaje de Participación</th>
    </tr>`;

    if (visitadorRanking.length === 0) {
      html += `<tr><td colspan="3" class="text-center">Sin visitas registradas en este período</td></tr>`;
    } else {
      visitadorRanking.forEach((vr, idx) => {
        const pct = Math.round((vr.count / (filteredVisits.length || 1)) * 100);
        const rowClass = idx % 2 === 1 ? 'class="bg-alt"' : '';
        html += `<tr ${rowClass}>
          <td><b>${vr.name || 'Sin Especificar'}</b></td>
          <td class="text-center" style="font-weight: bold; color: #1e40af;">${vr.count}</td>
          <td class="text-center"><b>${pct}%</b></td>
        </tr>`;
      });
    }

    html += `</table>

  <!-- SECCIÓN 4: CITAS PROGRAMADAS -->
  <table>
    <tr>
      <td colspan="3" class="section-title" style="background-color: #4338ca; border-color: #3730a3;">4. EFECTIVIDAD DE CITAS PROGRAMADAS</td>
    </tr>
    <tr>
      <th>Estado de Citas</th>
      <th>Cantidad</th>
      <th>Porcentaje del Total</th>
    </tr>`;

    const apptTotal = appointmentStats.total || 1;
    html += `
    <tr>
      <td class="badge-verde">Realizadas</td>
      <td class="text-center"><b>${appointmentStats.realizadas}</b></td>
      <td class="text-center"><b>${Math.round((appointmentStats.realizadas / apptTotal) * 100)}%</b></td>
    </tr>
    <tr class="bg-alt">
      <td class="badge-amarillo">Pendientes</td>
      <td class="text-center"><b>${appointmentStats.pendientes}</b></td>
      <td class="text-center"><b>${Math.round((appointmentStats.pendientes / apptTotal) * 100)}%</b></td>
    </tr>
    <tr>
      <td class="badge-rojo">Canceladas</td>
      <td class="text-center"><b>${appointmentStats.canceladas}</b></td>
      <td class="text-center"><b>${Math.round((appointmentStats.canceladas / apptTotal) * 100)}%</b></td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Pastoral_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler para imprimir informe PDF
  const handlePrintReport = () => {
    window.print();
  };

  const handleRegisterVisitForMember = (member) => {
    setTargetMemberForVisit(member);
    setIsVisitModalOpen(true);
  };

  const handleVisitSubmitted = async (visitData) => {
    try {
      await api.createVisit(visitData);
      setIsVisitModalOpen(false);
      setSuccessModalState({
        isOpen: true,
        title: '¡Visita Registrada!',
        message: `La visita a ${visitData.memberName || 'el miembro'} ha sido guardada exitosamente.`
      });
      fetchData();
    } catch (err) {
      setSuccessModalState({
        isOpen: true,
        title: 'Error',
        message: err.message || 'No se pudo registrar la visita.'
      });
    }
  };

  return (
    <div>
      {/* Reglas de impresión en papel/PDF para ocultar botones e interfaz innecesaria */}
      <style>{`
        @media print {
          .no-print, .sidebar, .table-controls, .search-input-box, button, input {
            display: none !important;
          }
          .main-content, .page-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .dashboard-card {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>

      <Header
        title="Reportes & Estadísticas Pastorales"
        subtitle="Analítica visual, radar de atención prioritaria, desempeño de visitadores e informes exportables"
        actionButton={
          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              <FileSpreadsheet size={16} /> Exportar Excel (CSV)
            </button>
            <button className="btn btn-primary" onClick={handlePrintReport}>
              <Printer size={16} /> Imprimir / Exportar PDF
            </button>
          </div>
        }
      />

      <div className="page-container">
        
        {/* Barra de Filtros por Período */}
        <div className="table-controls no-print" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
            <Filter size={18} /> Filtrar Analítica por Rango de Tiempo:
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'month', label: 'Este Mes (30 días)' },
              { id: 'quarter', label: 'Último Trimestre (90 días)' },
              { id: 'year', label: 'Año Actual' },
              { id: 'all', label: 'Histórico Total' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                className={`btn ${period === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Generando métricas y reportes pastorales...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ========================================================================= */}
            {/* SECCIÓN 1: SALUD PASTORAL Y SEMÁFORO DE ESTADO */}
            {/* ========================================================================= */}
            <div className="dashboard-grid">
              
              {/* Tarjetas Semáforo */}
              <div className="dashboard-card" style={{ gridColumn: 'span 1' }}>
                <h3 className="card-title" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChart size={20} color="var(--primary)" /> Semáforo de Salud Pastoral
                </h3>
                <p className="page-subtitle" style={{ marginBottom: '20px' }}>
                  Distribución porcentual de los {statusStats.total} miembros según su estado
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Estado Verde */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>🟢 Verde (Buen estado)</span>
                      <strong>{statusStats.verde} ({statusStats.pctVerde}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${statusStats.pctVerde}%`, height: '100%', background: '#10b981', transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Estado Amarillo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>🟡 Amarillo (Atención constante)</span>
                      <strong>{statusStats.amarillo} ({statusStats.pctAmarillo}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${statusStats.pctAmarillo}%`, height: '100%', background: '#f59e0b', transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Estado Rojo */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>🔴 Rojo (Urgente / Necesita visita)</span>
                      <strong>{statusStats.rojo} ({statusStats.pctRojo}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${statusStats.pctRojo}%`, height: '100%', background: '#ef4444', transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Inactivos */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: '#64748b' }}>⚫ Inactivos (+6 meses sin contacto)</span>
                      <strong>{statusStats.inactivos} ({statusStats.pctInactivos}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${statusStats.pctInactivos}%`, height: '100%', background: '#64748b', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Radar de Atención Prioritaria con Buscador y Paginado */}
              <div className="dashboard-card" style={{ gridColumn: 'span 1' }}>
                <h3 className="card-title" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                  <AlertTriangle size={20} color="#dc2626" /> Radar de Atención Prioritaria
                </h3>
                <p className="page-subtitle" style={{ marginBottom: '12px' }}>
                  Miembros en estado Rojo, Amarillo o con más de 60 días sin visita ({filteredPriorityMembers.length} en riesgo)
                </p>

                {/* Buscador de miembros en radar */}
                <div style={{ marginBottom: '12px' }}>
                  <div className="search-input-box" style={{ padding: '6px 12px' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Buscar por miembro en el radar..."
                      value={prioritySearch}
                      onChange={(e) => setPrioritySearch(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {filteredPriorityMembers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: prioritySearch ? 'var(--text-muted)' : '#16a34a', fontWeight: 600 }}>
                    {prioritySearch ? "No se encontraron miembros coincidentes." : "✅ ¡Excelente! No hay miembros en situación de desatención urgente."}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '260px' }}>
                      {paginatedPriorityMembers.map(m => {
                        const stLower = (m.status || '').toLowerCase();
                        const badgeClass = stLower === 'rojo' ? 'badge-rojo' : stLower === 'amarillo' ? 'badge-amarillo' : 'badge-sin-info';

                        return (
                          <div key={m.id || m.name} style={{ background: 'var(--bg-main)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{m.name || 'Miembro'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Última visita: {m.lastVisit || 'Sin visitas'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`badge-status ${badgeClass}`} style={{ fontSize: '0.7rem' }}>
                                {m.status || 'Revisar'}
                              </span>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                                onClick={() => handleRegisterVisitForMember(m)}
                                title="Registrar visita a este miembro"
                              >
                                <Plus size={14} /> Visitar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Controles de Paginación del Radar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span>
                        Mostrando <strong>{(priorityValidPage - 1) * PRIORITY_PER_PAGE + 1}</strong> a <strong>{Math.min(priorityValidPage * PRIORITY_PER_PAGE, filteredPriorityMembers.length)}</strong> de <strong>{filteredPriorityMembers.length}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          disabled={priorityValidPage === 1}
                          onClick={() => setPriorityPage(prev => Math.max(prev - 1, 1))}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontWeight: 600, padding: '0 4px' }}>
                          {priorityValidPage} / {priorityTotalPages}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          disabled={priorityValidPage === priorityTotalPages}
                          onClick={() => setPriorityPage(prev => Math.min(prev + 1, priorityTotalPages))}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* ========================================================================= */}
            {/* SECCIÓN 2: RENDIMIENTO DE VISITADORES Y CUMPLIMIENTO DE CITAS */}
            {/* ========================================================================= */}
            <div className="dashboard-grid">
              
              {/* Ranking de Visitadores con Buscador y Paginado */}
              <div className="dashboard-card">
                <h3 className="card-title" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} color="var(--primary)" /> Cobertura y Rendimiento de Visitadores
                </h3>
                <p className="page-subtitle" style={{ marginBottom: '12px' }}>
                  Total de visitas de campo realizadas en el período ({filteredVisits.length} visitas registradas)
                </p>

                {/* Buscador de visitadores */}
                <div style={{ marginBottom: '12px' }}>
                  <div className="search-input-box" style={{ padding: '6px 12px' }}>
                    <Search size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre de visitador..."
                      value={visitadorSearch}
                      onChange={(e) => setVisitadorSearch(e.target.value)}
                      style={{ fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {filteredVisitadorRanking.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {visitadorSearch ? "No se encontraron visitadores con ese término." : "No hay visitas registradas en este período."}
                  </div>
                ) : (
                  <>
                    <div className="table-card" style={{ marginBottom: '0' }}>
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Visitador / Colaborador</th>
                            <th style={{ textAlign: 'center' }}>Visitas Realizadas</th>
                            <th>Porcentaje del Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedVisitadorRanking.map((vr, idx) => {
                            const pct = Math.round((vr.count / (filteredVisits.length || 1)) * 100);
                            return (
                              <tr key={idx}>
                                <td>
                                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                      {vr.name ? vr.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span>{vr.name}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                  {vr.count}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Controles de Paginación de Visitadores */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span>
                        Mostrando <strong>{(visitadorValidPage - 1) * VISITADOR_PER_PAGE + 1}</strong> a <strong>{Math.min(visitadorValidPage * VISITADOR_PER_PAGE, filteredVisitadorRanking.length)}</strong> de <strong>{filteredVisitadorRanking.length}</strong> visitadores
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          disabled={visitadorValidPage === 1}
                          onClick={() => setVisitadorPage(prev => Math.max(prev - 1, 1))}
                        >
                          <ChevronLeft size={14} /> Anterior
                        </button>
                        <span style={{ fontWeight: 600, padding: '0 4px' }}>
                          {visitadorValidPage} / {visitadorTotalPages}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          disabled={visitadorValidPage === visitadorTotalPages}
                          onClick={() => setVisitadorPage(prev => Math.min(prev + 1, visitadorTotalPages))}
                        >
                          Siguiente <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cumplimiento de Citas */}
              <div className="dashboard-card">
                <h3 className="card-title" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="var(--primary)" /> Efectividad de Citas Programadas
                </h3>
                <p className="page-subtitle" style={{ marginBottom: '20px' }}>
                  Estado de la agenda ({appointmentStats.total} citas en total)
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <CheckCircle2 size={24} color="#16a34a" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{appointmentStats.realizadas}</div>
                    <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Realizadas</div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <Clock size={24} color="#d97706" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{appointmentStats.pendientes}</div>
                    <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>Pendientes</div>
                  </div>

                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <XCircle size={24} color="#dc2626" style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c' }}>{appointmentStats.canceladas}</div>
                    <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Canceladas</div>
                  </div>
                </div>

                {/* Desglose por Tipo de Visita */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Tipología de Visitas Realizadas:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visitTypeStats.map((vt, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px' }}>
                      <span>{vt.type}</span>
                      <strong>{vt.count} ({vt.pct}%)</strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Modal para registrar visita directa */}
      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSubmit={handleVisitSubmitted}
        member={targetMemberForVisit}
        members={members}
      />

      <SuccessModal
        isOpen={successModalState.isOpen}
        onClose={() => setSuccessModalState({ isOpen: false, title: '', message: '' })}
        title={successModalState.title}
        message={successModalState.message}
      />
    </div>
  );
};
