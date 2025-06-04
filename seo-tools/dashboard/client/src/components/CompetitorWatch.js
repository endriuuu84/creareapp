import React from 'react';

function CompetitorWatch({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="competitor-watch">
        <div className="no-data">
          <h2>🕵️ Competitor Watch</h2>
          <p>Nessun dato competitor disponibile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="competitor-watch">
      <h2>🕵️ Monitoraggio Competitor</h2>
      <div className="competitors-list">
        {data.map((competitor, index) => (
          <div key={index} className="competitor-card">
            <h3>{competitor.domain}</h3>
            <div className="competitor-stats">
              <div className="stat">
                <span className="stat-label">Traffico Stimato</span>
                <span className="stat-value">{competitor.estimatedTraffic}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Top Keywords</span>
                <span className="stat-value">{competitor.topKeywords}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Backlinks</span>
                <span className="stat-value">{competitor.backlinks}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Variazione</span>
                <span className={`stat-value ${competitor.change > 0 ? 'positive' : 'negative'}`}>
                  {competitor.change > 0 ? '+' : ''}{competitor.change}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CompetitorWatch;