import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './PerformanceMonitor.css';

function PerformanceMonitor({ data }) {
  if (!data) {
    return (
      <div className="performance-monitor">
        <div className="no-data">
          <h2>⚡ Performance Monitor</h2>
          <p>Nessun dato performance disponibile</p>
        </div>
      </div>
    );
  }

  const { mobile, desktop } = data;
  
  const scoreData = [
    {
      name: 'Mobile',
      Performance: mobile?.performance || 0,
      SEO: mobile?.seo || 0,
      Accessibility: mobile?.accessibility || 0
    },
    {
      name: 'Desktop', 
      Performance: desktop?.performance || 0,
      SEO: desktop?.seo || 0,
      Accessibility: desktop?.accessibility || 0
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'; // Verde
    if (score >= 50) return '#f59e0b'; // Giallo
    return '#ef4444'; // Rosso
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Eccellente';
    if (score >= 80) return 'Buono';
    if (score >= 50) return 'Da Migliorare';
    return 'Critico';
  };

  const renderMetricCard = (title, mobileScore, desktopScore, icon) => (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      
      <div className="metric-scores">
        <div className="score-item">
          <span className="device-label">📱 Mobile</span>
          <div className="score-container">
            <div 
              className="score-circle"
              style={{ 
                background: `conic-gradient(${getScoreColor(mobileScore)} ${mobileScore * 3.6}deg, #e5e7eb 0deg)` 
              }}
            >
              <span className="score-value">{mobileScore}</span>
            </div>
            <span className="score-label">{getScoreLabel(mobileScore)}</span>
          </div>
        </div>
        
        <div className="score-item">
          <span className="device-label">💻 Desktop</span>
          <div className="score-container">
            <div 
              className="score-circle"
              style={{ 
                background: `conic-gradient(${getScoreColor(desktopScore)} ${desktopScore * 3.6}deg, #e5e7eb 0deg)` 
              }}
            >
              <span className="score-value">{desktopScore}</span>
            </div>
            <span className="score-label">{getScoreLabel(desktopScore)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h2>⚡ Core Web Vitals & Performance</h2>
        <div className="last-check">
          Ultimo check: {new Date(data.timestamp).toLocaleString('it-IT')}
        </div>
      </div>

      <div className="metrics-grid">
        {renderMetricCard(
          'Performance', 
          mobile?.performance || 0, 
          desktop?.performance || 0,
          '⚡'
        )}
        
        {renderMetricCard(
          'SEO Score', 
          mobile?.seo || 0, 
          desktop?.seo || 0,
          '🔍'
        )}
        
        {renderMetricCard(
          'Accessibility', 
          mobile?.accessibility || 0, 
          desktop?.accessibility || 0,
          '♿'
        )}
      </div>

      <div className="comparison-chart">
        <h3>📊 Confronto Scores</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="Performance" fill="#3b82f6" />
            <Bar dataKey="SEO" fill="#10b981" />
            <Bar dataKey="Accessibility" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {mobile?.metrics && (
        <div className="core-vitals">
          <h3>📈 Core Web Vitals (Mobile)</h3>
          <div className="vitals-grid">
            <div className="vital-item">
              <span className="vital-label">First Contentful Paint</span>
              <span className="vital-value">{mobile.metrics.FCP}</span>
              <span className="vital-description">Primo contenuto visibile</span>
            </div>
            
            <div className="vital-item">
              <span className="vital-label">Largest Contentful Paint</span>
              <span className="vital-value">{mobile.metrics.LCP}</span>
              <span className="vital-description">Elemento principale caricato</span>
            </div>
            
            <div className="vital-item">
              <span className="vital-label">Cumulative Layout Shift</span>
              <span className="vital-value">{mobile.metrics.CLS}</span>
              <span className="vital-description">Stabilità visiva</span>
            </div>
            
            <div className="vital-item">
              <span className="vital-label">Time to Interactive</span>
              <span className="vital-value">{mobile.metrics.TTI}</span>
              <span className="vital-description">Tempo di interattività</span>
            </div>
            
            {mobile.metrics.TBT && (
              <div className="vital-item">
                <span className="vital-label">Total Blocking Time</span>
                <span className="vital-value">{mobile.metrics.TBT}</span>
                <span className="vital-description">Tempo di blocco totale</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="performance-recommendations">
        <h3>💡 Raccomandazioni</h3>
        <div className="recommendations-list">
          {mobile?.performance < 50 && (
            <div className="recommendation critical">
              <span className="rec-icon">🚨</span>
              <div className="rec-content">
                <strong>Performance Critica</strong>
                <p>Il punteggio performance mobile è molto basso. Considera ottimizzazioni urgenti.</p>
              </div>
            </div>
          )}
          
          {mobile?.performance >= 50 && mobile?.performance < 80 && (
            <div className="recommendation warning">
              <span className="rec-icon">⚠️</span>
              <div className="rec-content">
                <strong>Performance da Migliorare</strong>
                <p>Ottimizza immagini, riduci JavaScript e migliora il caching.</p>
              </div>
            </div>
          )}
          
          {mobile?.seo < 90 && (
            <div className="recommendation info">
              <span className="rec-icon">🔍</span>
              <div className="rec-content">
                <strong>SEO Ottimizzabile</strong>
                <p>Verifica meta tag, struttura HTML e link interni.</p>
              </div>
            </div>
          )}
          
          {mobile?.accessibility < 90 && (
            <div className="recommendation info">
              <span className="rec-icon">♿</span>
              <div className="rec-content">
                <strong>Accessibility da Migliorare</strong>
                <p>Aggiungi testi alternativi, migliora contrasti e navigazione da tastiera.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;