const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');

class KeywordAnalyzer {
  constructor() {
    this.oauth2Client = null;
    this.webmasters = null;
    this.initializeAPIs();
  }

  async initializeAPIs() {
    try {
      // Carica tokens salvati
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
      this.webmasters = google.webmasters({ version: 'v3', auth: this.oauth2Client });

      console.log('✅ Keyword Analyzer APIs inizializzate');
    } catch (error) {
      console.error('❌ Errore inizializzazione Keyword Analyzer:', error.message);
    }
  }

  // Analizza performance delle keyword attuali
  async analyzeCurrentPerformance() {
    if (!this.webmasters) {
      console.log('⚠️ APIs non inizializzate, uso dati mock');
      return this.getMockKeywordData();
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Ultimi 30 giorni

      const response = await this.webmasters.searchanalytics.query({
        siteUrl: process.env.SITE_URL || 'https://www.balzacmodena.it/',
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 100
        }
      });

      const keywordData = {};
      
      if (response.data.rows) {
        response.data.rows.forEach(row => {
          const keyword = row.keys[0];
          keywordData[keyword] = {
            position: row.position,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: (row.ctr * 100).toFixed(2)
          };
        });
      }

      return keywordData;
      
    } catch (error) {
      console.error('Errore analisi keyword performance:', error);
      return this.getMockKeywordData();
    }
  }

  getMockKeywordData() {
    return {
      'sviluppo app': {
        position: 12.5,
        clicks: 45,
        impressions: 1200,
        ctr: 3.75
      },
      'creare app': {
        position: 8.2,
        clicks: 32,
        impressions: 890,
        ctr: 3.6
      },
      'sviluppare app mobile': {
        position: 15.8,
        clicks: 18,
        impressions: 650,
        ctr: 2.8
      },
      'agenzia sviluppo app': {
        position: 6.4,
        clicks: 28,
        impressions: 420,
        ctr: 6.7
      },
      'costo sviluppo app': {
        position: 18.2,
        clicks: 12,
        impressions: 980,
        ctr: 1.2
      },
      'quanto costa sviluppare un app': {
        position: 22.5,
        clicks: 8,
        impressions: 1150,
        ctr: 0.7
      }
    };
  }

  // Trova quick wins (ottimizzazioni facili)
  async findQuickWins() {
    const keywordData = await this.analyzeCurrentPerformance();
    const quickWins = [];

    Object.entries(keywordData).forEach(([keyword, data]) => {
      // CTR basso per posizioni buone (quick win meta description)
      if (data.position <= 10 && data.ctr < 3) {
        quickWins.push({
          type: 'meta_optimization',
          keyword: keyword,
          currentPosition: data.position,
          currentCTR: data.ctr,
          targetCTR: 5,
          priority: 'high',
          effort: 'low'
        });
      }

      // Keyword vicine alla prima pagina (quick win content)
      if (data.position > 10 && data.position <= 15 && data.impressions > 100) {
        quickWins.push({
          type: 'content_boost',
          keyword: keyword,
          currentPosition: data.position,
          targetPosition: 8,
          impressions: data.impressions,
          priority: 'medium',
          effort: 'medium'
        });
      }
    });

    return quickWins;
  }

  // Identifica keyword con trend crescente
  async findTrendingKeywords() {
    // Integrazione con Google Trends sarebbe ideale
    // Per ora simuliamo con dati mock
    const trendingKeywords = [
      {
        keyword: 'sviluppo app AI 2024',
        trend: 'rising',
        interest: 85,
        competition: 'medium'
      },
      {
        keyword: 'app no code',
        trend: 'rising',
        interest: 72,
        competition: 'low'
      },
      {
        keyword: 'sviluppo app flutter',
        trend: 'stable',
        interest: 68,
        competition: 'high'
      },
      {
        keyword: 'costo app personalizzata',
        trend: 'rising',
        interest: 59,
        competition: 'medium'
      }
    ];

    return trendingKeywords.filter(kw => kw.trend === 'rising');
  }

  // Analizza gap di keyword vs competitor
  async analyzeKeywordGaps(competitorDomains) {
    const gaps = [];
    
    // Simulazione analisi gap (normalmente useremmo API di SEMrush/Ahrefs)
    const competitorKeywords = {
      'competitor1.com': [
        'sviluppo app react native',
        'app cross platform',
        'sviluppo app startup'
      ],
      'competitor2.com': [
        'manutenzione app',
        'aggiornamento app',
        'consulenza mobile'
      ]
    };

    const ourKeywords = Object.keys(await this.analyzeCurrentPerformance());

    Object.entries(competitorKeywords).forEach(([domain, keywords]) => {
      keywords.forEach(keyword => {
        if (!ourKeywords.some(ourKw => ourKw.includes(keyword.split(' ')[0]))) {
          gaps.push({
            keyword: keyword,
            competitorDomain: domain,
            opportunity: 'missing_keyword',
            estimatedTraffic: Math.floor(Math.random() * 500) + 100,
            difficulty: Math.floor(Math.random() * 100)
          });
        }
      });
    });

    return gaps.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic);
  }

  // Trova keyword correlate semanticamente
  async findSemanticKeywords(mainKeyword) {
    // Normalmente useremmo NLP o API di keyword research
    const semanticMaps = {
      'sviluppo app': [
        'creazione applicazioni',
        'programmazione mobile',
        'sviluppo software mobile',
        'creazione app personalizzate',
        'sviluppo applicazioni native'
      ],
      'creare app': [
        'costruire applicazione',
        'realizzare app',
        'progettare software mobile',
        'sviluppare applicazione mobile'
      ]
    };

    return semanticMaps[mainKeyword] || [];
  }

  // Calcola keyword difficulty
  calculateKeywordDifficulty(keyword, serpData) {
    let difficulty = 0;
    
    // Fattori che aumentano la difficoltà
    if (serpData.topDomains?.includes('wikipedia.org')) difficulty += 20;
    if (serpData.topDomains?.includes('amazon.com')) difficulty += 15;
    if (serpData.avgDomainAuthority > 60) difficulty += 25;
    if (serpData.paidAdsCount > 3) difficulty += 20;
    if (serpData.featuredSnippet) difficulty += 10;
    
    // Fattori che riducono la difficoltà
    if (serpData.avgWordCount < 500) difficulty -= 10;
    if (serpData.lowQualityResults > 2) difficulty -= 15;
    
    return Math.max(0, Math.min(100, difficulty));
  }

  // Analizza intento di ricerca
  analyzeSearchIntent(keyword) {
    const intentSignals = {
      informational: ['come', 'cosa', 'perché', 'guida', 'tutorial'],
      commercial: ['migliore', 'confronto', 'recensione', 'vs'],
      transactional: ['comprare', 'prezzo', 'costo', 'preventivo', 'acquista'],
      navigational: ['login', 'accesso', 'sito', 'homepage']
    };

    const lowercaseKeyword = keyword.toLowerCase();
    
    for (const [intent, signals] of Object.entries(intentSignals)) {
      if (signals.some(signal => lowercaseKeyword.includes(signal))) {
        return intent;
      }
    }

    return 'informational'; // Default
  }

  // Prioritizza keyword per ottimizzazione
  prioritizeKeywords(keywordData, opportunities) {
    const prioritized = [];

    Object.entries(keywordData).forEach(([keyword, data]) => {
      const intent = this.analyzeSearchIntent(keyword);
      const commercialValue = intent === 'transactional' ? 3 : intent === 'commercial' ? 2 : 1;
      
      const score = (
        (data.impressions / 100) * 0.3 +
        (21 - data.position) * 0.4 +
        data.ctr * 0.2 +
        commercialValue * 0.1
      );

      prioritized.push({
        keyword,
        ...data,
        intent,
        priority: score > 15 ? 'high' : score > 8 ? 'medium' : 'low',
        score: score.toFixed(2)
      });
    });

    return prioritized.sort((a, b) => b.score - a.score);
  }

  // Genera report keyword
  async generateKeywordReport() {
    const currentPerformance = await this.analyzeCurrentPerformance();
    const quickWins = await this.findQuickWins();
    const trendingKeywords = await this.findTrendingKeywords();
    const prioritized = this.prioritizeKeywords(currentPerformance);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalKeywords: Object.keys(currentPerformance).length,
        averagePosition: this.calculateAveragePosition(currentPerformance),
        quickWins: quickWins.length,
        trendingOpportunities: trendingKeywords.length
      },
      topPerformers: prioritized.slice(0, 5),
      quickWins: quickWins,
      trendingKeywords: trendingKeywords,
      recommendations: this.generateKeywordRecommendations(prioritized, quickWins)
    };

    // Salva report
    const reportPath = path.join(__dirname, '../reports/keyword-analysis.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJson(reportPath, report, { spaces: 2 });

    return report;
  }

  calculateAveragePosition(keywordData) {
    const positions = Object.values(keywordData).map(data => data.position);
    return (positions.reduce((sum, pos) => sum + pos, 0) / positions.length).toFixed(1);
  }

  generateKeywordRecommendations(prioritized, quickWins) {
    const recommendations = [];

    if (quickWins.length > 0) {
      recommendations.push({
        type: 'quick_wins',
        message: `${quickWins.length} quick wins disponibili per miglioramenti immediati`,
        priority: 'high'
      });
    }

    const lowCTRKeywords = prioritized.filter(kw => kw.position <= 10 && kw.ctr < 3);
    if (lowCTRKeywords.length > 0) {
      recommendations.push({
        type: 'ctr_optimization',
        message: `${lowCTRKeywords.length} keyword in top 10 con CTR basso da ottimizzare`,
        priority: 'high'
      });
    }

    const nearFirstPage = prioritized.filter(kw => kw.position > 10 && kw.position <= 20);
    if (nearFirstPage.length > 0) {
      recommendations.push({
        type: 'ranking_boost',
        message: `${nearFirstPage.length} keyword possono raggiungere la prima pagina`,
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

module.exports = KeywordAnalyzer;