require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');
const keywords = require('./config/keywords');

class SEOMonitor {
  constructor() {
    this.searchConsole = null;
    this.analytics = null;
    this.initializeAPIs();
  }

  async initializeAPIs() {
    // Inizializza Google Search Console
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
      process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET
    );
    
    this.searchConsole = google.searchconsole({ version: 'v1', auth });
    this.analytics = google.analytics({ version: 'v3', auth });
  }

  // Monitora posizioni keyword in Search Console
  async checkKeywordRankings() {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const request = {
        siteUrl: process.env.SITE_URL,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          dimensionFilterGroups: [{
            filters: keywords.primary.map(keyword => ({
              dimension: 'query',
              operator: 'contains',
              expression: keyword
            }))
          }],
          rowLimit: 1000
        }
      };

      const response = await this.searchConsole.searchanalytics.query(request);
      return this.processRankingData(response.data.rows);
    } catch (error) {
      console.error('Errore nel check ranking:', error);
      return null;
    }
  }

  // Analizza Core Web Vitals
  async checkCoreWebVitals() {
    try {
      const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
      const params = {
        url: process.env.SITE_URL,
        category: ['performance', 'seo', 'accessibility'],
        strategy: 'mobile'
      };

      const response = await axios.get(pagespeedUrl, { params });
      const { lighthouseResult } = response.data;

      return {
        performance: lighthouseResult.categories.performance.score * 100,
        seo: lighthouseResult.categories.seo.score * 100,
        accessibility: lighthouseResult.categories.accessibility.score * 100,
        metrics: {
          FCP: lighthouseResult.audits['first-contentful-paint'].displayValue,
          LCP: lighthouseResult.audits['largest-contentful-paint'].displayValue,
          CLS: lighthouseResult.audits['cumulative-layout-shift'].displayValue,
          TTI: lighthouseResult.audits['interactive'].displayValue
        }
      };
    } catch (error) {
      console.error('Errore Core Web Vitals:', error);
      return null;
    }
  }

  // Controlla errori di crawling
  async checkCrawlErrors() {
    try {
      const response = await this.searchConsole.urlInspection.index.inspect({
        siteUrl: process.env.SITE_URL,
        inspectionUrl: process.env.SITE_URL
      });

      return {
        indexingStatus: response.data.inspectionResult.indexStatusResult.indexingStatus,
        crawledAs: response.data.inspectionResult.indexStatusResult.crawledAs,
        lastCrawlTime: response.data.inspectionResult.indexStatusResult.lastCrawlTime
      };
    } catch (error) {
      console.error('Errore crawl check:', error);
      return null;
    }
  }

  // Analizza traffico organico
  async analyzeOrganicTraffic() {
    try {
      const response = await this.analytics.data.ga.get({
        ids: `ga:${process.env.GOOGLE_ANALYTICS_VIEW_ID}`,
        'start-date': '30daysAgo',
        'end-date': 'today',
        metrics: 'ga:organicSearches,ga:users,ga:newUsers,ga:sessions,ga:bounceRate',
        dimensions: 'ga:source,ga:landingPagePath'
      });

      return this.processTrafficData(response.data);
    } catch (error) {
      console.error('Errore analisi traffico:', error);
      return null;
    }
  }

  // Processa dati ranking
  processRankingData(rows) {
    const rankings = {};
    
    rows.forEach(row => {
      const query = row.keys[0];
      const page = row.keys[1];
      
      if (!rankings[query]) {
        rankings[query] = {
          impressions: 0,
          clicks: 0,
          positions: [],
          pages: []
        };
      }
      
      rankings[query].impressions += row.impressions;
      rankings[query].clicks += row.clicks;
      rankings[query].positions.push(row.position);
      rankings[query].pages.push(page);
    });

    // Calcola posizione media
    Object.keys(rankings).forEach(query => {
      const positions = rankings[query].positions;
      rankings[query].averagePosition = 
        positions.reduce((a, b) => a + b, 0) / positions.length;
      rankings[query].ctr = 
        (rankings[query].clicks / rankings[query].impressions * 100).toFixed(2);
    });

    return rankings;
  }

  // Processa dati traffico
  processTrafficData(data) {
    const summary = {
      totalOrganicSearches: 0,
      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      averageBounceRate: 0,
      topLandingPages: []
    };

    data.rows.forEach(row => {
      summary.totalOrganicSearches += parseInt(row[2]);
      summary.totalUsers += parseInt(row[3]);
      summary.newUsers += parseInt(row[4]);
      summary.sessions += parseInt(row[5]);
    });

    // Top landing pages
    const landingPages = {};
    data.rows.forEach(row => {
      const page = row[1];
      if (!landingPages[page]) {
        landingPages[page] = { sessions: 0, bounceRate: 0 };
      }
      landingPages[page].sessions += parseInt(row[5]);
      landingPages[page].bounceRate = parseFloat(row[6]);
    });

    summary.topLandingPages = Object.entries(landingPages)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 10)
      .map(([page, data]) => ({ page, ...data }));

    return summary;
  }

  // Genera report completo
  async generateDailyReport() {
    console.log('🔍 Avvio monitoraggio SEO giornaliero...');
    
    const report = {
      date: new Date().toISOString(),
      rankings: await this.checkKeywordRankings(),
      coreWebVitals: await this.checkCoreWebVitals(),
      crawlStatus: await this.checkCrawlErrors(),
      organicTraffic: await this.analyzeOrganicTraffic()
    };

    // Salva report (implementare database)
    console.log('📊 Report generato:', JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Esegui monitoraggio
const monitor = new SEOMonitor();
monitor.generateDailyReport();