const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SEOMonitor {
  constructor() {
    this.oauth2Client = null;
    this.searchConsole = null;
    this.webmasters = null;
    this.initializeAPIs();
  }

  async initializeAPIs() {
    try {
      // Carica tokens
      const tokenPath = path.join(__dirname, '../../tokens.json');
      const tokenData = await fs.readFile(tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);

      // Setup OAuth2
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID,
        process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET,
        'http://localhost:3001/auth/callback'
      );

      this.oauth2Client.setCredentials(tokens);

      // Initialize APIs
      this.searchConsole = google.searchconsole({ version: 'v1', auth: this.oauth2Client });
      this.webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });

      console.log('✅ Google APIs inizializzate');
    } catch (error) {
      console.error('❌ Errore inizializzazione APIs:', error.message);
    }
  }

  // Monitor keyword rankings
  async checkKeywordRankings() {
    if (!this.webmasters) return null;

    try {
      const keywords = require('../config/target-keywords.json');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const results = {};

      for (const keyword of keywords.primary) {
        try {
          const response = await this.webmasters.searchanalytics.query({
            siteUrl: process.env.SITE_URL || 'https://www.balzacmodena.it/',
            requestBody: {
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              dimensions: ['query'],
              dimensionFilterGroups: [{
                filters: [{
                  dimension: 'query',
                  operator: 'contains',
                  expression: keyword
                }]
              }],
              rowLimit: 1
            }
          });

          const data = response.data.rows?.[0];
          results[keyword] = {
            position: data ? data.position : null,
            clicks: data ? data.clicks : 0,
            impressions: data ? data.impressions : 0,
            ctr: data ? (data.ctr * 100).toFixed(2) : 0,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          results[keyword] = {
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return results;
    } catch (error) {
      console.error('Errore check rankings:', error);
      return null;
    }
  }

  // Core Web Vitals check
  async checkCoreWebVitals() {
    try {
      const url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
      const siteUrl = process.env.SITE_URL || 'https://www.balzacmodena.it/';

      const [mobile, desktop] = await Promise.all([
        axios.get(url, {
          params: {
            url: siteUrl,
            key: process.env.GOOGLE_PAGESPEED_API_KEY,
            strategy: 'mobile',
            category: ['performance', 'seo', 'accessibility']
          }
        }),
        axios.get(url, {
          params: {
            url: siteUrl,
            key: process.env.GOOGLE_PAGESPEED_API_KEY,
            strategy: 'desktop',
            category: ['performance', 'seo', 'accessibility']
          }
        })
      ]);

      const extractMetrics = (data) => {
        const lighthouse = data.data.lighthouseResult;
        return {
          performance: Math.round(lighthouse.categories.performance.score * 100),
          seo: Math.round(lighthouse.categories.seo.score * 100),
          accessibility: Math.round(lighthouse.categories.accessibility.score * 100),
          metrics: {
            FCP: lighthouse.audits['first-contentful-paint']?.displayValue || 'N/A',
            LCP: lighthouse.audits['largest-contentful-paint']?.displayValue || 'N/A',
            CLS: lighthouse.audits['cumulative-layout-shift']?.displayValue || 'N/A',
            TTI: lighthouse.audits['interactive']?.displayValue || 'N/A',
            TBT: lighthouse.audits['total-blocking-time']?.displayValue || 'N/A'
          }
        };
      };

      return {
        mobile: extractMetrics(mobile),
        desktop: extractMetrics(desktop),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Errore Core Web Vitals:', error);
      return null;
    }
  }

  // Quick performance check (senza tutte le categorie)
  async quickPerformanceCheck() {
    try {
      const url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
      const siteUrl = process.env.SITE_URL || 'https://www.balzacmodena.it/';

      const response = await axios.get(url, {
        params: {
          url: siteUrl,
          key: process.env.GOOGLE_PAGESPEED_API_KEY,
          strategy: 'mobile',
          category: ['performance']
        }
      });

      const lighthouse = response.data.lighthouseResult;
      return {
        performance: Math.round(lighthouse.categories.performance.score * 100),
        FCP: lighthouse.audits['first-contentful-paint']?.numericValue || 0,
        LCP: lighthouse.audits['largest-contentful-paint']?.numericValue || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Errore quick performance:', error);
      return null;
    }
  }

  // Analyze traffic trends
  async analyzeTraffic() {
    // Placeholder - da implementare con Google Analytics
    return {
      organicSessions: Math.floor(Math.random() * 1000) + 500,
      organicUsers: Math.floor(Math.random() * 800) + 400,
      bounceRate: (Math.random() * 30 + 40).toFixed(1),
      avgSessionDuration: `${Math.floor(Math.random() * 3) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      topPages: [
        { page: '/', sessions: Math.floor(Math.random() * 200) + 100 },
        { page: '/servizi', sessions: Math.floor(Math.random() * 150) + 50 },
        { page: '/contatti', sessions: Math.floor(Math.random() * 100) + 25 }
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Check crawl errors
  async checkCrawlErrors() {
    if (!this.searchConsole) return null;

    try {
      // Placeholder - Search Console API v1 ha limitazioni
      return {
        crawlErrors: Math.floor(Math.random() * 5),
        indexedPages: Math.floor(Math.random() * 50) + 20,
        blockedPages: Math.floor(Math.random() * 3),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Errore crawl errors:', error);
      return null;
    }
  }

  // Monitor competitors (placeholder)
  async checkCompetitors() {
    // Simulazione dati competitor
    const competitors = ['competitor1.com', 'competitor2.com', 'competitor3.com'];
    
    return competitors.map(comp => ({
      domain: comp,
      estimatedTraffic: Math.floor(Math.random() * 10000) + 1000,
      topKeywords: Math.floor(Math.random() * 100) + 50,
      backlinks: Math.floor(Math.random() * 1000) + 500,
      change: (Math.random() * 20 - 10).toFixed(1) // -10% to +10%
    }));
  }
}

module.exports = SEOMonitor;