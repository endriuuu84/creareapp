require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
  'https://creareapp-seo.netlify.app/auth/callback'
);

const code = '4/0AUJR-x4VV6xc68XBnGXBp1QE72z5AsarHOCctpF0t9t8gId1Rjo_ZL4zna-1G1M_Qf4OAQ';

async function processToken() {
  try {
    console.log('🔄 Scambio codice con token...');
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Salva i token
    const tokensPath = './tokens.json';
    const tokenData = {
      site_url: 'https://www.creareapp.it',
      tokens: tokens,
      created_at: new Date().toISOString()
    };
    
    fs.writeFileSync(tokensPath, JSON.stringify(tokenData, null, 2));
    
    console.log('✅ Token salvati con successo!');
    console.log(`📁 File: ${tokensPath}`);
    
    // Test immediato delle API
    console.log('\n🧪 Test immediato delle API...');
    
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    
    try {
      const sites = await searchconsole.sites.list();
      console.log('✅ Search Console API funziona!');
      console.log('📊 Siti disponibili:');
      
      if (sites.data.siteEntry) {
        sites.data.siteEntry.forEach(site => {
          console.log(`   - ${site.siteUrl} (${site.permissionLevel})`);
        });
      }
      
      // Test specifico per CreareApp.it
      const siteUrl = 'https://www.creareapp.it/';
      try {
        const siteInfo = await searchconsole.sites.get({
          siteUrl: siteUrl
        });
        console.log(`✅ ${siteUrl} è accessibile!`);
        console.log(`   Livello permessi: ${siteInfo.data.permissionLevel}`);
        
        // Test query delle keyword
        console.log('\n🔍 Test query keyword...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startDate = yesterday.toISOString().split('T')[0];
        
        const queryRequest = {
          siteUrl: siteUrl,
          requestBody: {
            startDate: startDate,
            endDate: startDate,
            dimensions: ['query'],
            rowLimit: 5
          }
        };
        
        const queryResult = await searchconsole.searchanalytics.query(queryRequest);
        
        if (queryResult.data.rows) {
          console.log('✅ Query keywords funziona!');
          console.log('🔝 Top 5 keywords:');
          queryResult.data.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. "${row.keys[0]}" - ${row.clicks} clicks, pos ${row.position.toFixed(1)}`);
          });
        } else {
          console.log('⚠️  Nessun dato keyword disponibile (normale per siti nuovi)');
        }
        
      } catch (error) {
        console.log(`❌ Errore accesso ${siteUrl}:`, error.message);
      }
      
    } catch (error) {
      console.log('❌ Errore Search Console:', error.message);
    }
    
    console.log('\n🎉 Autorizzazione completata con successo!');
    console.log('🚀 Il sistema SEO è ora operativo');
    console.log('📊 Puoi avviare la dashboard con: cd dashboard && npm start');
    
  } catch (error) {
    console.error('❌ Errore durante l\'autorizzazione:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('💡 Il codice è scaduto, genera un nuovo link di autorizzazione');
    }
  }
}

processToken();