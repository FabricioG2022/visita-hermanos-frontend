import React from 'react';

export const MetricCard = ({ title, value, subtext, icon: Icon, onClick }) => {
  return (
    <div 
      className="metric-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        userSelect: 'none'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div className="metric-icon-box">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtext">{subtext}</div>
      </div>
    </div>
  );
};
