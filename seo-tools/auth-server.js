require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Configura OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
  `http://localhost:${PORT}/auth/callback`
);

// Homepage con link di autorizzazione
app.get('/', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SEO Tool - Autorizzazione Google</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .btn {
          display: inline-block;
          background: #4285f4;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .btn:hover { background: #357ae8; }
        .success { color: #0f9d58; }
        .error { color: #ea4335; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Autorizzazione Google APIs</h1>
        <p>Clicca il pulsante per autorizzare l'accesso a:</p>
        <ul>
          <li>Google Search Console (lettura dati SEO)</li>
          <li>Google Analytics (lettura metriche)</li>
        </ul>
        <a href="${authUrl}" class="btn">Autorizza con Google</a>
      </div>
    </body>
    </html>
  `);
});

// Callback OAuth2
app.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`
      <div class="container">
        <h1 class="error">❌ Errore</h1>
        <p>Autorizzazione negata: ${error}</p>
      </div>
    `);
  }
  
  try {
    // Scambia il codice per i token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Salva i token in un file
    const tokenPath = path.join(__dirname, 'tokens.json');
    await fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2));
    
    console.log('✅ Token salvati in tokens.json');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autorizzazione Completata</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success { color: #0f9d58; }
          .token-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">✅ Autorizzazione Completata!</h1>
          <p>I token di accesso sono stati salvati con successo.</p>
          
          <h3>Informazioni Token:</h3>
          <div class="token-info">
            <strong>Access Token:</strong> ${tokens.access_token.substring(0, 20)}...<br>
            <strong>Refresh Token:</strong> ${tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'Non presente'}<br>
            <strong>Scadenza:</strong> ${new Date(tokens.expiry_date).toLocaleString('it-IT')}
          </div>
          
          <h3>✅ Prossimi passi:</h3>
          <ol>
            <li>I token sono stati salvati in <code>tokens.json</code></li>
            <li>Puoi chiudere questa finestra</li>
            <li>Ora puoi usare gli script di monitoraggio SEO!</li>
          </ol>
          
          <p><strong>Test rapido:</strong></p>
          <code>node test-search-console.js</code>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Errore nello scambio token:', error);
    res.send(`
      <div class="container">
        <h1 class="error">❌ Errore</h1>
        <p>Errore durante l'autorizzazione: ${error.message}</p>
      </div>
    `);
  }
});

// Avvia server
app.listen(PORT, () => {
  console.log(`🚀 Server di autorizzazione avviato!`);
  console.log(`📍 Visita: http://localhost:${PORT}`);
  console.log(`\n⏸️  Premi Ctrl+C per fermare il server dopo l'autorizzazione`);
});