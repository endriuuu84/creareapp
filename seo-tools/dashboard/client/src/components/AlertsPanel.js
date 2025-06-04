import React from 'react';
import moment from 'moment';
import './AlertsPanel.css';

function AlertsPanel({ alerts, onClearAlerts }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getAlertClass = (type) => {
    return `alert-item ${type}`;
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-panel">
        <div className="alerts-header">
          <h3>🔔 Alert & Notifiche</h3>
        </div>
        <div className="no-alerts">
          <span className="no-alerts-icon">✅</span>
          <p>Nessun alert attivo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h3>🔔 Alert & Notifiche</h3>
        <div className="alerts-controls">
          <span className="alerts-count">{alerts.length}</span>
          <button 
            className="clear-alerts-btn"
            onClick={onClearAlerts}
            title="Cancella tutti gli alert"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.slice(-5).reverse().map((alert, index) => (
          <div key={index} className={getAlertClass(alert.type)}>
            <div className="alert-icon">
              {getAlertIcon(alert.type)}
            </div>
            
            <div className="alert-content">
              <div className="alert-message">
                {alert.message}
              </div>
              <div className="alert-time">
                {moment(alert.timestamp).format('HH:mm:ss')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 5 && (
        <div className="alerts-footer">
          <span className="more-alerts">
            +{alerts.length - 5} altri alert
          </span>
        </div>
      )}
    </div>
  );
}

export default AlertsPanel;