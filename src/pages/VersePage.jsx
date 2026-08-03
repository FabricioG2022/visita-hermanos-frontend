import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { BookOpen, Copy, Check, ChevronLeft, ChevronRight, Calendar, Sparkles, Share2 } from 'lucide-react';

export const VersePage = () => {
  const [verseData, setVerseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchVerse = async (dateObj) => {
    try {
      setLoading(true);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const localIsoDate = `${y}-${m}-${d}`;
      const data = await api.getDailyVerse(localIsoDate);
      setVerseData(data);
    } catch (err) {
      console.error("Error al cargar versículo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerse(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleCopy = () => {
    if (!verseData) return;
    const textToCopy = `"${verseData.text}" — ${verseData.reference} (${verseData.version || 'RVR1960'})\nVisita Hermanos App`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div>
      <Header
        title="Versículo del Día"
        subtitle="Palabra de Dios diaria para la edificación y fortaleza de la iglesia"
      />

      <div className="page-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Barra de Navegación por fechas */}
        <div className="dashboard-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={handlePrevDay} title="Día anterior">
              <ChevronLeft size={18} /> Día anterior
            </button>
            {!isToday && (
              <button className="btn btn-secondary" style={{ padding: '6px 14px', fontWeight: 600 }} onClick={handleToday}>
                Hoy
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
            <Calendar size={18} />
            <span style={{ textTransform: 'capitalize' }}>
              {verseData?.formattedDate || selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={handleNextDay} title="Día siguiente">
            Día siguiente <ChevronRight size={18} />
          </button>
        </div>

        {/* Tarjeta Principal del Versículo */}
        {loading ? (
          <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Cargando versículo del día...
          </div>
        ) : !verseData ? (
          <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se pudo obtener el versículo del día.
          </div>
        ) : (
          <div className="dashboard-card" style={{ padding: '40px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-main) 100%)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge-status badge-active" style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Sparkles size={14} /> {verseData.theme || 'Inspiración Diaria'}
              </span>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', gap: '6px' }}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                <span>{copied ? '¡Copiado!' : 'Copiar versículo'}</span>
              </button>
            </div>

            {/* Cita Bíblica */}
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <BookOpen size={36} color="var(--primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
              <p style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: '1.7', fontStyle: 'italic', fontFamily: 'Georgia, serif', marginBottom: '20px' }}>
                "{verseData.text}"
              </p>
              
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                — {verseData.reference} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>({verseData.version})</span>
              </h3>
            </div>

            {/* Reflexión / Devocional */}
            {verseData.reflection && (
              <div style={{ marginTop: '30px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--primary-light)', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💡 Reflexión para el día
                </h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: '1.6' }}>
                  {verseData.reflection}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
