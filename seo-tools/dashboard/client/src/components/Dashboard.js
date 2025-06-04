import React, { useState } from 'react';
import KeywordTracker from './KeywordTracker';
import PerformanceMonitor from './PerformanceMonitor';
import TrafficAnalytics from './TrafficAnalytics';
import AlertsPanel from './AlertsPanel';
import CompetitorWatch from './CompetitorWatch';
import './Dashboard.css';

function Dashboard({ data, alerts, onClearAlerts }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!data || data.message) {
    return (
      <div className="dashboard">
        <div className="no-data">
          <h2>📊 Dashboard SEO</h2>
          <p>Attendere il primo controllo automatico...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'keywords', label: '🔍 Keywords', icon: '🔍' },
    { id: 'performance', label: '⚡ Performance', icon: '⚡' },
    { id: 'traffic', label: '📈 Traffic', icon: '📈' },
    { id: 'competitors', label: '🕵️ Competitors', icon: '🕵️' }
  ];

  const renderOverview = () => (
    <div className="overview-grid">
      <div className="overview-card">
        <h3>📊 Stato Generale</h3>
        <div className="stats-grid">
          <div className="stat">
            <span className="stat-value">{data.keywords ? Object.keys(data.keywords).length : 0}</span>
            <span className="stat-label">Keywords Monitorate</span>
          </div>
          <div className="stat">
            <span className="stat-value performance">
              {data.performance?.mobile?.performance || 0}
            </span>
            <span className="stat-label">Performance Score</span>
          </div>
          <div className="stat">
            <span className="stat-value traffic">
              {data.traffic?.organicSessions || 0}
            </span>
            <span className="stat-label">Sessioni Organiche</span>
          </div>
          <div className="stat">
            <span className="stat-value alerts">
              {alerts.length}
            </span>
            <span className="stat-label">Alert Attivi</span>
          </div>
        </div>
      </div>

      <div className="overview-card">
        <h3>🎯 Top Keywords</h3>
        <div className="top-keywords">
          {data.keywords && Object.entries(data.keywords)
            .filter(([_, kw]) => kw.position)
            .sort((a, b) => a[1].position - b[1].position)
            .slice(0, 5)
            .map(([keyword, kwData]) => (
              <div key={keyword} className="keyword-item">
                <span className="keyword">{keyword}</span>
                <span className={`position pos-${Math.ceil(kwData.position / 10)}`}>
                  #{kwData.position.toFixed(1)}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="overview-card">
        <h3>⚡ Performance Snapshot</h3>
        <div className="performance-snapshot">
          {data.performance?.mobile && (
            <>
              <div className="metric">
                <span className="metric-label">Performance</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill performance"
                    style={{ width: `${data.performance.mobile.performance}%` }}
                  ></div>
                  <span className="metric-value">{data.performance.mobile.performance}</span>
                </div>
              </div>
              <div className="metric">
                <span className="metric-label">SEO</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill seo"
                    style={{ width: `${data.performance.mobile.seo}%` }}
                  ></div>
                  <span className="metric-value">{data.performance.mobile.seo}</span>
                </div>
              </div>
              <div className="metric">
                <span className="metric-label">Accessibility</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill accessibility"
                    style={{ width: `${data.performance.mobile.accessibility}%` }}
                  ></div>
                  <span className="metric-value">{data.performance.mobile.accessibility}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AlertsPanel alerts={alerts} onClearAlerts={onClearAlerts} />
    </div>
  );

  return (
    <div className="dashboard">
      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'keywords' && <KeywordTracker data={data.keywords} />}
        {activeTab === 'performance' && <PerformanceMonitor data={data.performance} />}
        {activeTab === 'traffic' && <TrafficAnalytics data={data.traffic} />}
        {activeTab === 'competitors' && <CompetitorWatch data={data.competitors} />}
      </div>
    </div>
  );
}

export default Dashboard;