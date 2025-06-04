import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './KeywordTracker.css';

function KeywordTracker({ data }) {
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [sortBy, setSortBy] = useState('position');

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="keyword-tracker">
        <div className="no-data">
          <h2>🔍 Keyword Tracker</h2>
          <p>Nessun dato keyword disponibile</p>
        </div>
      </div>
    );
  }

  const keywords = Object.entries(data)
    .filter(([_, kwData]) => !kwData.error)
    .sort((a, b) => {
      switch (sortBy) {
        case 'position':
          return (a[1].position || 999) - (b[1].position || 999);
        case 'clicks':
          return (b[1].clicks || 0) - (a[1].clicks || 0);
        case 'impressions':
          return (b[1].impressions || 0) - (a[1].impressions || 0);
        case 'ctr':
          return (parseFloat(b[1].ctr) || 0) - (parseFloat(a[1].ctr) || 0);
        default:
          return 0;
      }
    });

  const getPositionClass = (position) => {
    if (!position) return 'no-data';
    if (position <= 3) return 'top-3';
    if (position <= 10) return 'top-10';
    if (position <= 20) return 'top-20';
    return 'low';
  };

  const getPositionIcon = (position) => {
    if (!position) return '❓';
    if (position <= 3) return '🥇';
    if (position <= 10) return '📈';
    if (position <= 20) return '📊';
    return '📉';
  };

  return (
    <div className="keyword-tracker">
      <div className="tracker-header">
        <h2>🔍 Keyword Rankings</h2>
        <div className="tracker-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="position">Ordina per Posizione</option>
            <option value="clicks">Ordina per Click</option>
            <option value="impressions">Ordina per Impressioni</option>
            <option value="ctr">Ordina per CTR</option>
          </select>
        </div>
      </div>

      <div className="keywords-grid">
        {keywords.map(([keyword, kwData]) => (
          <div 
            key={keyword} 
            className={`keyword-card ${getPositionClass(kwData.position)}`}
            onClick={() => setSelectedKeyword(selectedKeyword === keyword ? null : keyword)}
          >
            <div className="keyword-header">
              <span className="keyword-name">{keyword}</span>
              <span className="keyword-icon">{getPositionIcon(kwData.position)}</span>
            </div>
            
            <div className="keyword-metrics">
              <div className="metric">
                <span className="metric-label">Posizione</span>
                <span className="metric-value position">
                  {kwData.position ? `#${kwData.position.toFixed(1)}` : 'N/A'}
                </span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Click</span>
                <span className="metric-value clicks">{kwData.clicks || 0}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">Impressioni</span>
                <span className="metric-value impressions">{kwData.impressions || 0}</span>
              </div>
              
              <div className="metric">
                <span className="metric-label">CTR</span>
                <span className="metric-value ctr">{kwData.ctr || 0}%</span>
              </div>
            </div>

            {selectedKeyword === keyword && (
              <div className="keyword-details">
                <div className="details-section">
                  <h4>📊 Dettagli Performance</h4>
                  <div className="detail-item">
                    <span>Ultimo aggiornamento:</span>
                    <span>{new Date(kwData.timestamp).toLocaleString('it-IT')}</span>
                  </div>
                  
                  {kwData.position && (
                    <>
                      <div className="detail-item">
                        <span>Pagina stimata:</span>
                        <span>Pagina {Math.ceil(kwData.position / 10)}</span>
                      </div>
                      
                      <div className="detail-item">
                        <span>Traffico potenziale:</span>
                        <span className={`traffic-potential ${getPositionClass(kwData.position)}`}>
                          {kwData.position <= 3 ? 'Alto' : 
                           kwData.position <= 10 ? 'Medio' : 
                           kwData.position <= 20 ? 'Basso' : 'Molto Basso'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="action-buttons">
                  <button className="action-btn primary">
                    📈 Vedi Trend
                  </button>
                  <button className="action-btn secondary">
                    🔍 Analizza SERP
                  </button>
                  <button className="action-btn secondary">
                    📝 Ottimizza Contenuto
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {keywords.length === 0 && (
        <div className="no-keywords">
          <p>Nessuna keyword trovata con i criteri di ricerca.</p>
        </div>
      )}

      <div className="tracker-summary">
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-value">{keywords.filter(([_, kw]) => kw.position <= 3).length}</span>
            <span className="summary-label">Top 3</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{keywords.filter(([_, kw]) => kw.position <= 10).length}</span>
            <span className="summary-label">Top 10</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{keywords.filter(([_, kw]) => kw.position <= 20).length}</span>
            <span className="summary-label">Top 20</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">
              {keywords.reduce((sum, [_, kw]) => sum + (kw.clicks || 0), 0)}
            </span>
            <span className="summary-label">Click Totali</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeywordTracker;