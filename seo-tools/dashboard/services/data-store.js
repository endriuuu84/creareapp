const fs = require('fs').promises;
const path = require('path');

class DataStore {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.latestData = null;
    this.initializeDataDir();
  }

  async initializeDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('📁 Data directory inizializzato');
    } catch (error) {
      console.error('Errore creazione data directory:', error);
    }
  }

  // Salva dati del monitoraggio
  async saveData(data) {
    try {
      this.latestData = data;
      
      // Salva file giornaliero
      const date = new Date().toISOString().split('T')[0];
      const filename = `seo-data-${date}.json`;
      const filepath = path.join(this.dataDir, filename);
      
      // Carica dati esistenti del giorno
      let dayData = [];
      try {
        const existing = await fs.readFile(filepath, 'utf8');
        dayData = JSON.parse(existing);
      } catch (error) {
        // File non esiste, inizializza array vuoto
      }
      
      // Aggiungi nuovo data point
      dayData.push(data);
      
      // Mantieni solo ultimi 24 punti dati (uno per ora)
      if (dayData.length > 24) {
        dayData = dayData.slice(-24);
      }
      
      await fs.writeFile(filepath, JSON.stringify(dayData, null, 2));
      
      // Aggiorna summary
      await this.updateSummary(data);
      
      console.log(`💾 Dati salvati: ${filename}`);
    } catch (error) {
      console.error('Errore salvataggio dati:', error);
    }
  }

  // Aggiorna summary con trends
  async updateSummary(latestData) {
    try {
      const summaryPath = path.join(this.dataDir, 'summary.json');
      
      let summary = {
        lastUpdate: null,
        keywordTrends: {},
        performanceTrends: {},
        trafficTrends: {},
        alerts: []
      };
      
      // Carica summary esistente
      try {
        const existing = await fs.readFile(summaryPath, 'utf8');
        summary = JSON.parse(existing);
      } catch (error) {
        // File non esiste
      }
      
      // Aggiorna trends keywords
      if (latestData.keywords) {
        Object.keys(latestData.keywords).forEach(keyword => {
          const currentData = latestData.keywords[keyword];
          const previousData = summary.keywordTrends[keyword];
          
          if (currentData.position && previousData?.position) {
            const change = previousData.position - currentData.position;
            summary.keywordTrends[keyword] = {
              ...currentData,
              change: change,
              trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
            };
            
            // Alert per cambiamenti significativi
            if (Math.abs(change) >= 5) {
              summary.alerts.push({
                type: 'ranking',
                keyword: keyword,
                change: change,
                message: `"${keyword}" ${change > 0 ? 'salita' : 'scesa'} di ${Math.abs(change)} posizioni`,
                timestamp: latestData.timestamp
              });
            }
          } else {
            summary.keywordTrends[keyword] = currentData;
          }
        });
      }
      
      // Aggiorna performance trends
      if (latestData.performance) {
        const currentPerf = latestData.performance.mobile?.performance;
        const previousPerf = summary.performanceTrends.performance;
        
        if (currentPerf && previousPerf) {
          const change = currentPerf - previousPerf;
          if (Math.abs(change) >= 10) {
            summary.alerts.push({
              type: 'performance',
              change: change,
              message: `Performance ${change > 0 ? 'migliorata' : 'peggiorata'} di ${Math.abs(change)} punti`,
              timestamp: latestData.timestamp
            });
          }
        }
        
        if (currentPerf) {
          summary.performanceTrends = {
            performance: currentPerf,
            ...latestData.performance.mobile
          };
        }
      }
      
      // Mantieni solo ultimi 10 alert
      summary.alerts = summary.alerts.slice(-10);
      summary.lastUpdate = latestData.timestamp;
      
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
    } catch (error) {
      console.error('Errore aggiornamento summary:', error);
    }
  }

  // Ottieni dati più recenti
  getLatestData() {
    return this.latestData || {
      message: 'Nessun dato disponibile',
      timestamp: new Date().toISOString()
    };
  }

  // Ottieni dati storici
  async getHistoricalData(period) {
    try {
      const now = new Date();
      const files = [];
      
      switch (period) {
        case '24h':
          // Dati di oggi
          const today = now.toISOString().split('T')[0];
          files.push(`seo-data-${today}.json`);
          break;
          
        case '7d':
          // Ultimi 7 giorni
          for (let i = 0; i < 7; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            files.push(`seo-data-${date.toISOString().split('T')[0]}.json`);
          }
          break;
          
        case '30d':
          // Ultimi 30 giorni
          for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            files.push(`seo-data-${date.toISOString().split('T')[0]}.json`);
          }
          break;
      }
      
      const allData = [];
      
      for (const filename of files) {
        try {
          const filepath = path.join(this.dataDir, filename);
          const fileData = await fs.readFile(filepath, 'utf8');
          const dayData = JSON.parse(fileData);
          allData.push(...dayData);
        } catch (error) {
          // File non esiste, skip
        }
      }
      
      return allData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
    } catch (error) {
      console.error('Errore lettura dati storici:', error);
      return [];
    }
  }

  // Ottieni summary con trends
  async getSummary() {
    try {
      const summaryPath = path.join(this.dataDir, 'summary.json');
      const data = await fs.readFile(summaryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        lastUpdate: null,
        keywordTrends: {},
        performanceTrends: {},
        alerts: []
      };
    }
  }

  // Metodi helper per API endpoints
  getKeywordData() {
    if (!this.latestData?.keywords) return {};
    return this.latestData.keywords;
  }

  getPerformanceData() {
    if (!this.latestData?.performance) return {};
    return this.latestData.performance;
  }

  // Aggiungi keyword al monitoring
  addKeyword(keyword) {
    // TODO: Aggiungere logica per aggiornare lista keywords
    console.log(`Keyword aggiunta al monitoring: ${keyword}`);
  }

  // Cleanup vecchi file (chiamare periodicamente)
  async cleanup() {
    try {
      const files = await fs.readdir(this.dataDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Mantieni 90 giorni
      
      for (const file of files) {
        if (file.startsWith('seo-data-')) {
          const dateStr = file.replace('seo-data-', '').replace('.json', '');
          const fileDate = new Date(dateStr);
          
          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.dataDir, file));
            console.log(`🗑️ File vecchio rimosso: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Errore cleanup:', error);
    }
  }
}

module.exports = DataStore;