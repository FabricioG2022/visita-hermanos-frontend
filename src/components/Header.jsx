import React from 'react';

export const Header = ({ title, subtitle, actionButton }) => {
  return (
    <header className="header-bar">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actionButton && <div>{actionButton}</div>}
    </header>
  );
};
