require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
  'https://creareapp-seo.netlify.app/auth/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

console.log('🔑 Autorizzazione Google APIs per CreareApp.it\n');

// Step 1: Genera URL corretto
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
  response_type: 'code'
});

console.log('📋 STEP 1: Visita questo URL per autorizzare l\'app:');
console.log('─'.repeat(60));
console.log(authUrl);
console.log('─'.repeat(60));
console.log();

// Step 2: Chiedi il codice
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('📝 STEP 2: Incolla il codice di autorizzazione qui: ', async (code) => {
  try {
    console.log('\n🔄 Scambio codice con token...');
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Salva i token
    const tokensPath = './tokens.json';
    fs.writeFileSync(tokensPath, JSON.stringify({
      site_url: 'https://www.creareapp.it',
      tokens: tokens,
      created_at: new Date().toISOString()
    }, null, 2));
    
    console.log('✅ Token salvati con successo!');
    console.log(`📁 File: ${tokensPath}`);
    
    // Test immediato
    console.log('\n🧪 Test immediato delle API...');
    
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    
    try {
      const sites = await searchconsole.sites.list();
      console.log('✅ Search Console API funziona!');
      console.log('📊 Siti disponibili:');
      sites.data.siteEntry?.forEach(site => {
        console.log(`   - ${site.siteUrl} (${site.permissionLevel})`);
      });
      
      // Test specifico per CreareApp.it
      const siteUrl = 'https://www.creareapp.it/';
      try {
        const siteInfo = await searchconsole.sites.get({
          siteUrl: siteUrl
        });
        console.log(`✅ ${siteUrl} è accessibile!`);
        console.log(`   Livello permessi: ${siteInfo.data.permissionLevel}`);
      } catch (error) {
        console.log(`⚠️  ${siteUrl} non trovato o non autorizzato`);
        console.log('   Verifica che il sito sia aggiunto a Search Console');
      }
      
    } catch (error) {
      console.log('❌ Errore Search Console:', error.message);
    }
    
    console.log('\n🎉 Autorizzazione completata!');
    console.log('🚀 Ora puoi avviare la dashboard SEO:');
    console.log('   cd dashboard && npm start');
    
  } catch (error) {
    console.error('❌ Errore durante l\'autorizzazione:', error.message);
  }
  
  rl.close();
});