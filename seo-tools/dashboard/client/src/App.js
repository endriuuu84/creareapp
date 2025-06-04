import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [seoData, setSeoData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Connessione Socket.IO
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connesso al server SEO');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnesso dal server');
      setIsConnected(false);
    });

    newSocket.on('initialData', (data) => {
      console.log('📊 Dati iniziali ricevuti:', data);
      setSeoData(data);
      setIsLoading(false);
    });

    newSocket.on('seoUpdate', (data) => {
      console.log('🔄 Aggiornamento SEO ricevuto');
      setSeoData(data);
      
      // Genera alert per cambiamenti significativi
      if (data.keywords) {
        const newAlerts = generateAlerts(data);
        setAlerts(prev => [...prev, ...newAlerts].slice(-10)); // Mantieni ultimi 10
      }
    });

    newSocket.on('performanceUpdate', (data) => {
      console.log('⚡ Aggiornamento performance ricevuto');
      setSeoData(prev => ({
        ...prev,
        quickPerformance: data
      }));
    });

    newSocket.on('error', (error) => {
      console.error('❌ Errore dal server:', error);
      setAlerts(prev => [...prev, {
        type: 'error',
        message: error.message,
        timestamp: error.timestamp
      }]);
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const generateAlerts = (data) => {
    const alerts = [];
    
    if (data.keywords) {
      Object.entries(data.keywords).forEach(([keyword, keywordData]) => {
        if (keywordData.position && keywordData.position <= 3) {
          alerts.push({
            type: 'success',
            message: `🎉 "${keyword}" in TOP 3 (posizione ${keywordData.position})`,
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    if (data.performance?.mobile?.performance < 50) {
      alerts.push({
        type: 'warning',
        message: `⚠️ Performance mobile bassa: ${data.performance.mobile.performance}/100`,
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  };

  const requestUpdate = () => {
    if (socket) {
      socket.emit('requestUpdate');
      setAlerts(prev => [...prev, {
        type: 'info',
        message: '🔄 Aggiornamento manuale richiesto...',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Header 
        isConnected={isConnected}
        onRefresh={requestUpdate}
        lastUpdate={seoData?.timestamp}
      />
      
      <Dashboard 
        data={seoData}
        alerts={alerts}
        onClearAlerts={() => setAlerts([])}
      />
    </div>
  );
}

export default App;