require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const SEOMonitor = require('./services/seo-monitor');
const DataStore = require('./services/data-store');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.DASHBOARD_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Inizializza servizi
const seoMonitor = new SEOMonitor();
const dataStore = new DataStore();

// Socket connection
io.on('connection', (socket) => {
  console.log('📱 Dashboard client connesso');
  
  // Invia dati iniziali
  socket.emit('initialData', dataStore.getLatestData());
  
  socket.on('disconnect', () => {
    console.log('📱 Dashboard client disconnesso');
  });
  
  // Richiesta aggiornamento manuale
  socket.on('requestUpdate', async () => {
    console.log('🔄 Aggiornamento manuale richiesto');
    await runSEOCheck();
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/data/latest', (req, res) => {
  res.json(dataStore.getLatestData());
});

app.get('/api/data/history/:period', (req, res) => {
  const { period } = req.params; // 24h, 7d, 30d
  res.json(dataStore.getHistoricalData(period));
});

app.get('/api/keywords', (req, res) => {
  res.json(dataStore.getKeywordData());
});

app.get('/api/performance', (req, res) => {
  res.json(dataStore.getPerformanceData());
});

app.post('/api/keywords/add', (req, res) => {
  const { keyword } = req.body;
  dataStore.addKeyword(keyword);
  res.json({ success: true, message: 'Keyword aggiunta' });
});

// Funzione principale di monitoraggio
async function runSEOCheck() {
  console.log('🔍 Avvio check SEO...');
  
  try {
    const data = {
      timestamp: new Date().toISOString(),
      keywords: await seoMonitor.checkKeywordRankings(),
      performance: await seoMonitor.checkCoreWebVitals(),
      traffic: await seoMonitor.analyzeTraffic(),
      errors: await seoMonitor.checkCrawlErrors(),
      competitors: await seoMonitor.checkCompetitors()
    };
    
    // Salva dati
    dataStore.saveData(data);
    
    // Invia aggiornamento a tutti i client connessi
    io.emit('seoUpdate', data);
    
    console.log('✅ Check SEO completato');
    return data;
    
  } catch (error) {
    console.error('❌ Errore nel check SEO:', error);
    io.emit('error', { message: error.message, timestamp: new Date().toISOString() });
  }
}

// Scheduling automatico
console.log('⏰ Configurazione scheduling...');

// Check ogni ora
cron.schedule('0 * * * *', () => {
  console.log('⏰ Check SEO orario');
  runSEOCheck();
});

// Check approfondito ogni 6 ore
cron.schedule('0 */6 * * *', () => {
  console.log('⏰ Check SEO approfondito');
  runSEOCheck();
});

// Quick check ogni 15 minuti per performance
cron.schedule('*/15 * * * *', async () => {
  console.log('⚡ Quick performance check');
  try {
    const perfData = await seoMonitor.quickPerformanceCheck();
    io.emit('performanceUpdate', perfData);
  } catch (error) {
    console.error('Errore quick check:', error);
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Avvio server
server.listen(PORT, async () => {
  console.log(`🚀 Dashboard SEO avviata su porta ${PORT}`);
  console.log(`📊 Interface: http://localhost:${PORT}`);
  
  // Check iniziale
  setTimeout(() => {
    runSEOCheck();
  }, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Shutdown graceful...');
  server.close(() => {
    console.log('✅ Server chiuso');
  });
});