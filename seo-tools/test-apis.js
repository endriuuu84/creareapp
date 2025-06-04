require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');

console.log('🧪 Test delle API Google...\n');

// Test 1: PageSpeed API
async function testPageSpeed() {
  console.log('1️⃣ Test PageSpeed API...');
  try {
    const url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const params = {
      url: 'https://google.com',
      key: process.env.GOOGLE_PAGESPEED_API_KEY,
      strategy: 'mobile'
    };
    
    const response = await axios.get(url, { params });
    const score = response.data.lighthouseResult.categories.performance.score * 100;
    
    console.log('✅ PageSpeed API funziona!');
    console.log(`   Score di esempio (google.com mobile): ${score}/100\n`);
    return true;
  } catch (error) {
    console.log('❌ PageSpeed API errore:', error.message);
    console.log('   Verifica la API key nel file .env\n');
    return false;
  }
}

// Test 2: OAuth2 Setup
async function testOAuth2() {
  console.log('2️⃣ Test OAuth2 Configuration...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
    process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
    'http://localhost:3000/auth/callback'
  );
  
  // Genera URL per autorizzazione
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  console.log('✅ OAuth2 configurato correttamente!');
  console.log('   Per autorizzare l\'accesso, visita questo URL:');
  console.log(`   ${authUrl}\n`);
  
  return authUrl;
}

// Test 3: Verifica configurazione
function checkConfiguration() {
  console.log('3️⃣ Verifica configurazione...');
  
  const required = {
    'Client ID': process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
    'Client Secret': process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
    'PageSpeed API Key': process.env.GOOGLE_PAGESPEED_API_KEY
  };
  
  let allGood = true;
  
  for (const [name, value] of Object.entries(required)) {
    if (value && value !== 'your_' && !value.includes('your_')) {
      console.log(`✅ ${name}: Configurato`);
    } else {
      console.log(`❌ ${name}: Mancante`);
      allGood = false;
    }
  }
  
  console.log('\n');
  return allGood;
}

// Esegui tutti i test
async function runAllTests() {
  console.log('🚀 Avvio test delle Google APIs...\n');
  
  // Check configurazione
  const configOk = checkConfiguration();
  
  if (!configOk) {
    console.log('⚠️  Alcune configurazioni mancano. Controlla il file .env');
    return;
  }
  
  // Test PageSpeed
  const pageSpeedOk = await testPageSpeed();
  
  // Setup OAuth2
  const authUrl = await testOAuth2();
  
  // Risultato finale
  console.log('📊 Risultato Test:');
  console.log('─────────────────');
  
  if (pageSpeedOk) {
    console.log('✅ Tutto pronto per iniziare!');
    console.log('\n🔑 Prossimi passi:');
    console.log('1. Visita l\'URL di autorizzazione OAuth2 sopra');
    console.log('2. Autorizza l\'app con il tuo account Google');
    console.log('3. Copia il codice di autorizzazione');
    console.log('4. Useremo questo codice per ottenere i token di accesso');
  } else {
    console.log('❌ Alcuni test sono falliti. Verifica la configurazione.');
  }
}

// Esegui i test
runAllTests().catch(console.error);