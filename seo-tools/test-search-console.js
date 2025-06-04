require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

async function testSearchConsole() {
  try {
    // Carica i token salvati
    const tokenPath = path.join(__dirname, 'tokens.json');
    const tokenData = await fs.readFile(tokenPath, 'utf8');
    const tokens = JSON.parse(tokenData);
    
    // Configura OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
      'http://localhost:3001/auth/callback'
    );
    
    oauth2Client.setCredentials(tokens);
    
    // Inizializza Search Console API
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    
    console.log('🔍 Test Google Search Console API...\n');
    
    // 1. Lista siti verificati
    console.log('1️⃣ Siti verificati in Search Console:');
    const sitesResponse = await searchconsole.sites.list();
    const sites = sitesResponse.data.siteEntry || [];
    
    if (sites.length === 0) {
      console.log('   ⚠️  Nessun sito trovato. Verifica di aver aggiunto il tuo sito in Search Console.');
      return;
    }
    
    sites.forEach(site => {
      console.log(`   ✅ ${site.siteUrl} (Livello: ${site.permissionLevel})`);
    });
    
    // Usa il primo sito per i test
    const siteUrl = sites[0].siteUrl;
    console.log(`\n📊 Analisi dati per: ${siteUrl}\n`);
    
    // 2. Query performance (ultimi 7 giorni)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    console.log('2️⃣ Performance keywords (ultimi 7 giorni):');
    
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
    const performanceResponse = await webmasters.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 10
      }
    });
    
    const rows = performanceResponse.data.rows || [];
    
    if (rows.length === 0) {
      console.log('   ⚠️  Nessun dato disponibile per questo periodo.');
    } else {
      console.log('   Top 10 query:\n');
      rows.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.keys[0]}"`);
        console.log(`      Clicks: ${row.clicks} | Impressions: ${row.impressions}`);
        console.log(`      Position: ${row.position.toFixed(1)} | CTR: ${(row.ctr * 100).toFixed(2)}%\n`);
      });
    }
    
    // 3. Pagine più visitate
    console.log('3️⃣ Pagine con migliori performance:');
    const pagesResponse = await webmasters.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 5
      }
    });
    
    const pages = pagesResponse.data.rows || [];
    pages.forEach((page, index) => {
      const url = page.keys[0].replace(siteUrl, '');
      console.log(`   ${index + 1}. ${url}`);
      console.log(`      Clicks: ${page.clicks} | Position media: ${page.position.toFixed(1)}\n`);
    });
    
    console.log('✅ Test completato con successo!');
    console.log('\n💡 Ora puoi usare il sistema di monitoraggio SEO completo.');
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('❌ File tokens.json non trovato!');
      console.log('   Prima esegui: node auth-server.js');
      console.log('   E completa il processo di autorizzazione.');
    } else if (error.code === 401) {
      console.log('❌ Token scaduti o non validi.');
      console.log('   Riesegui il processo di autorizzazione.');
    } else {
      console.log('❌ Errore:', error.message);
      console.log('\n💡 Suggerimenti:');
      console.log('   1. Verifica di aver completato l\'autorizzazione');
      console.log('   2. Controlla che il sito sia verificato in Search Console');
      console.log('   3. Aspetta 24-48h per avere dati se il sito è nuovo');
    }
  }
}

// Esegui test
testSearchConsole();