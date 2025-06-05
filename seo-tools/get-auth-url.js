require('dotenv').config();

console.log('🔑 Link di autorizzazione manuale per CreareApp.it\n');

const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;

if (!clientId) {
  console.log('❌ GOOGLE_SEARCH_CONSOLE_CLIENT_ID non trovato nel .env');
  process.exit(1);
}

const scopes = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly'
];

const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: 'https://creareapp-seo.netlify.app/auth/callback',
  response_type: 'code',
  scope: scopes.join(' '),
  access_type: 'offline',
  prompt: 'consent'
});

const authUrl = `${baseUrl}?${params.toString()}`;

console.log('📋 STEP 1: Copia questo URL nel browser:');
console.log('─'.repeat(80));
console.log(authUrl);
console.log('─'.repeat(80));
console.log();
console.log('📝 STEP 2: Dopo l\'autorizzazione:');
console.log('   1. Copia il codice dalla URL (dopo code=)');
console.log('   2. Esegui: node save-token.js [IL_TUO_CODICE]');
console.log();
console.log('⚠️  NOTA: Se ricevi "redirect_uri_mismatch", devi aggiungere');
console.log('   https://creareapp-seo.netlify.app/auth/callback');
console.log('   agli Authorized redirect URIs in Google Cloud Console');