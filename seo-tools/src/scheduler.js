const cron = require('node-cron');
const SEOMonitor = require('./monitor');
const KeywordResearchAutomation = require('./keyword-research');
const ReportGenerator = require('./generate-report');

console.log('🚀 SEO Automation Scheduler avviato!');

// Monitor giornaliero alle 6:00
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ Avvio monitoraggio SEO giornaliero...');
  const monitor = new SEOMonitor();
  await monitor.generateDailyReport();
});

// Keyword research settimanale - Lunedì alle 9:00
cron.schedule('0 9 * * 1', async () => {
  console.log('🔍 Avvio ricerca keyword settimanale...');
  const researcher = new KeywordResearchAutomation();
  
  const keywords = require('./config/keywords');
  for (const keyword of keywords.primary.slice(0, 3)) {
    const research = await researcher.completeKeywordResearch(keyword);
    const results = researcher.exportResults(research);
    
    // Salva in database o invia notifica
    console.log(`Trovate ${results.total} nuove keyword per: ${keyword}`);
  }
});

// Check competitor mensile - Primo del mese alle 10:00
cron.schedule('0 10 1 * *', async () => {
  console.log('🕵️ Avvio analisi competitor mensile...');
  // Implementare analisi competitor
});

// Report performance settimanale - Venerdì alle 17:00
cron.schedule('0 17 * * 5', async () => {
  console.log('📊 Generazione report settimanale...');
  const reporter = new ReportGenerator();
  await reporter.generateWeeklyReport();
});

// Quick health check ogni ora
cron.schedule('0 * * * *', async () => {
  console.log('💓 Health check orario...');
  // Check veloce performance e uptime
});

// Keep process alive
process.stdin.resume();