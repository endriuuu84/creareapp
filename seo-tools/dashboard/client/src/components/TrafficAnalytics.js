import React from 'react';

function TrafficAnalytics({ data }) {
  if (!data) {
    return (
      <div className="traffic-analytics">
        <div className="no-data">
          <h2>📈 Traffic Analytics</h2>
          <p>Nessun dato traffico disponibile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-analytics">
      <h2>📈 Analisi Traffico Organico</h2>
      <div className="traffic-grid grid-4">
        <div className="traffic-card">
          <h3>Sessioni Organiche</h3>
          <span className="traffic-value">{data.organicSessions}</span>
        </div>
        <div className="traffic-card">
          <h3>Utenti Organici</h3>
          <span className="traffic-value">{data.organicUsers}</span>
        </div>
        <div className="traffic-card">
          <h3>Bounce Rate</h3>
          <span className="traffic-value">{data.bounceRate}%</span>
        </div>
        <div className="traffic-card">
          <h3>Durata Media</h3>
          <span className="traffic-value">{data.avgSessionDuration}</span>
        </div>
      </div>
    </div>
  );
}

export default TrafficAnalytics;