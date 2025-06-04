import React from 'react';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="loading-logo">
          <div className="logo-icon">🚀</div>
          <h1>SEO Dashboard</h1>
        </div>
        
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p className="loading-text">Connessione al sistema di monitoraggio...</p>
        </div>
        
        <div className="loading-steps">
          <div className="step active">
            <span className="step-icon">🔗</span>
            <span className="step-text">Connessione</span>
          </div>
          <div className="step">
            <span className="step-icon">📊</span>
            <span className="step-text">Caricamento dati</span>
          </div>
          <div className="step">
            <span className="step-icon">✅</span>
            <span className="step-text">Pronto</span>
          </div>
        </div>
        
        <div className="loading-footer">
          <p>Inizializzazione del monitoraggio SEO in corso...</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;