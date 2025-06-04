import React from 'react';
import moment from 'moment';
import './Header.css';

function Header({ isConnected, onRefresh, lastUpdate }) {
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Mai';
    return moment(timestamp).format('DD/MM/YYYY HH:mm:ss');
  };

  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return '';
    return moment(timestamp).fromNow();
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>🚀 SEO Dashboard</h1>
        <span className="subtitle">Monitoraggio Automatico</span>
      </div>

      <div className="header-center">
        <div className="status-info">
          <div className="connection-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connesso' : 'Disconnesso'}</span>
          </div>
          
          {lastUpdate && (
            <div className="last-update">
              <span className="label">Ultimo aggiornamento:</span>
              <span className="time">{formatLastUpdate(lastUpdate)}</span>
              <span className="relative-time">({getTimeSinceUpdate(lastUpdate)})</span>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <button 
          className="refresh-btn" 
          onClick={onRefresh}
          disabled={!isConnected}
          title="Aggiorna manualmente"
        >
          <span className="refresh-icon">🔄</span>
          Aggiorna
        </button>
        
        <div className="header-menu">
          <button className="menu-btn" title="Impostazioni">
            ⚙️
          </button>
          <button className="menu-btn" title="Esporta dati">
            📊
          </button>
          <button className="menu-btn" title="Aiuto">
            ❓
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;