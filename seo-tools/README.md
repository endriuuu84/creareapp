# Sistema Automazione SEO 🚀

Sistema completo per monitoraggio e ottimizzazione SEO automatizzata.

## 🛠 Setup Iniziale

### 1. Installa dipendenze
```bash
cd seo-tools
npm install
```

### 2. Configura variabili ambiente
```bash
cp .env.example .env
# Modifica .env con le tue credenziali
```

### 3. Setup Google APIs

#### Search Console:
1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea nuovo progetto o seleziona esistente
3. Abilita "Google Search Console API"
4. Crea credenziali OAuth 2.0
5. Aggiungi redirect URI: `http://localhost:3000/auth/callback`

#### Analytics:
1. Abilita "Google Analytics Reporting API"
2. Usa stesse credenziali OAuth
3. Ottieni View ID da Google Analytics

#### PageSpeed:
- Non richiede autenticazione, funziona subito!

## 📊 Funzionalità

### Monitoraggio Automatico (Gratuito)
- **Giornaliero**: Ranking keywords, Core Web Vitals
- **Settimanale**: Keyword research, analisi SERP
- **Mensile**: Audit completo, competitor analysis

### Keyword Research Automation
```bash
npm run keywords
```
Trova automaticamente:
- Google Autocomplete suggestions
- People Also Ask
- Related searches
- SERP analysis

### Report Automatici
```bash
npm run report
```
Genera e invia report HTML via email con:
- Performance metrics
- Ranking changes
- Traffic analysis
- Actionable recommendations

## 🚀 Avvio

### Modalità Development
```bash
npm run dev
```

### Scheduler Automatico
```bash
npm run schedule
```

### Controlli Manuali
```bash
npm run monitor    # Check immediato
npm run keywords   # Ricerca keywords
npm run report     # Genera report
```

## 📈 Upgrade Piano Premium

### Fase 1 (Mese 1-2): Base
- ✅ Google APIs (gratuito)
- ✅ Automation scripts
- ✅ Email reports

### Fase 2 (Mese 3-4): Essenziale
Aggiungi:
- DataForSEO API ($50/mese): Tracking competitor
- Screaming Frog ($15/mese): Audit tecnico

### Fase 3 (Mese 5+): Avanzato
Aggiungi:
- SEMrush API ($120/mese): Full suite
- o Ahrefs API ($100/mese): Alternative

## 🔧 Personalizzazioni

### Aggiungi Keywords
Modifica `src/config/keywords.js`

### Cambia Schedule
Modifica `src/scheduler.js` con sintassi cron

### Custom Reports
Estendi `src/generate-report.js`

## 📝 Note Importanti

1. **Rate Limiting**: Google APIs hanno limiti giornalieri
2. **Puppeteer**: Richiede Chrome/Chromium installato
3. **Email**: Configura app password per Gmail

## 🐛 Troubleshooting

### "API quota exceeded"
- Riduci frequenza checks
- Usa caching Redis

### "Puppeteer fails"
```bash
# Mac
brew install chromium

# Linux
sudo apt-get install chromium-browser
```

### "Email not sending"
- Verifica 2FA Gmail
- Usa app-specific password

---

Built with ❤️ for SEO automation