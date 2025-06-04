const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class ReportGenerator {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Genera report HTML
  generateHTMLReport(data) {
    const { rankings, coreWebVitals, traffic, newKeywords } = data;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric-card { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .warning { color: #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Report SEO Settimanale</h1>
          <p>Periodo: ${new Date().toLocaleDateString('it-IT')}</p>
        </div>
        
        <h2>🎯 Core Web Vitals</h2>
        <div class="metric-card">
          <div class="metric-value ${this.getScoreClass(coreWebVitals.performance)}">${coreWebVitals.performance}%</div>
          <div class="metric-label">Performance Score</div>
        </div>
        
        <h2>📊 Top Keywords Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Posizione Media</th>
              <th>Impressioni</th>
              <th>Click</th>
              <th>CTR</th>
            </tr>
          </thead>
          <tbody>
            ${this.generateKeywordRows(rankings)}
          </tbody>
        </table>
        
        <h2>📈 Traffico Organico</h2>
        <div class="metric-card">
          <div class="metric-value">${traffic.totalUsers}</div>
          <div class="metric-label">Utenti totali (ultimi 30 giorni)</div>
        </div>
        
        <h2>🔍 Nuove Opportunità Keyword</h2>
        <ul>
          ${newKeywords.map(kw => `<li>${kw}</li>`).join('')}
        </ul>
        
        <h2>💡 Raccomandazioni</h2>
        ${this.generateRecommendations(data)}
      </div>
    </body>
    </html>
    `;
  }

  generateKeywordRows(rankings) {
    return Object.entries(rankings)
      .slice(0, 10)
      .map(([keyword, data]) => `
        <tr>
          <td>${keyword}</td>
          <td class="${data.averagePosition <= 10 ? 'positive' : 'warning'}">${data.averagePosition.toFixed(1)}</td>
          <td>${data.impressions}</td>
          <td>${data.clicks}</td>
          <td>${data.ctr}%</td>
        </tr>
      `).join('');
  }

  getScoreClass(score) {
    if (score >= 90) return 'positive';
    if (score >= 50) return 'warning';
    return 'negative';
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    // Performance recommendations
    if (data.coreWebVitals.performance < 90) {
      recommendations.push('⚡ Ottimizza le performance: considera lazy loading e compressione immagini');
    }
    
    // Keyword recommendations
    const lowCTRKeywords = Object.entries(data.rankings)
      .filter(([_, d]) => d.ctr < 2 && d.averagePosition < 10);
    
    if (lowCTRKeywords.length > 0) {
      recommendations.push('📝 Migliora meta description per keyword con CTR basso');
    }
    
    // Content recommendations
    if (data.newKeywords.length > 5) {
      recommendations.push('✍️ Crea nuovi contenuti per le keyword opportunità trovate');
    }
    
    return `<ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`;
  }

  // Invia report via email
  async sendEmailReport(htmlReport) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `Report SEO Settimanale - ${new Date().toLocaleDateString('it-IT')}`,
      html: htmlReport
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Report inviato con successo!');
    } catch (error) {
      console.error('❌ Errore invio email:', error);
    }
  }

  // Salva report su file
  async saveReport(data, htmlReport) {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportsDir = path.join(__dirname, '../reports');
    
    // Crea directory se non esiste
    try {
      await fs.mkdir(reportsDir, { recursive: true });
    } catch (error) {
      // Directory già esiste
    }
    
    // Salva JSON
    await fs.writeFile(
      path.join(reportsDir, `report-${timestamp}.json`),
      JSON.stringify(data, null, 2)
    );
    
    // Salva HTML
    await fs.writeFile(
      path.join(reportsDir, `report-${timestamp}.html`),
      htmlReport
    );
    
    console.log(`📁 Report salvato in: reports/report-${timestamp}`);
  }

  // Genera report settimanale completo
  async generateWeeklyReport() {
    console.log('📊 Generazione report settimanale...');
    
    // Raccogli dati (mock per esempio)
    const data = {
      rankings: {
        'sviluppo app': {
          averagePosition: 3.2,
          impressions: 1250,
          clicks: 89,
          ctr: '7.12'
        },
        'creare app': {
          averagePosition: 5.8,
          impressions: 890,
          clicks: 45,
          ctr: '5.06'
        },
        'costo sviluppo app': {
          averagePosition: 8.4,
          impressions: 2100,
          clicks: 120,
          ctr: '5.71'
        }
      },
      coreWebVitals: {
        performance: 92,
        seo: 98,
        accessibility: 95
      },
      traffic: {
        totalUsers: 3450,
        newUsers: 2100,
        organicSearches: 2890
      },
      newKeywords: [
        'sviluppo app flutter 2024',
        'creare app senza codice',
        'quanto costa app aziendale',
        'sviluppo app b2b milano',
        'app personalizzate per ristoranti'
      ]
    };
    
    const htmlReport = this.generateHTMLReport(data);
    
    // Salva e invia
    await this.saveReport(data, htmlReport);
    await this.sendEmailReport(htmlReport);
    
    return data;
  }
}

module.exports = ReportGenerator;

// Esegui se chiamato direttamente
if (require.main === module) {
  const generator = new ReportGenerator();
  generator.generateWeeklyReport();
}