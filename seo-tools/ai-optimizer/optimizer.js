require('dotenv').config({ path: '../.env' });
const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const cron = require('node-cron');

const KeywordAnalyzer = require('./services/keyword-analyzer');
const SERPAnalyzer = require('./services/serp-analyzer');
const ContentOptimizer = require('./services/content-optimizer');
const SiteUpdater = require('./services/site-updater');

class SEOAutoOptimizer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.keywordAnalyzer = new KeywordAnalyzer();
    this.serpAnalyzer = new SERPAnalyzer();
    this.contentOptimizer = new ContentOptimizer(this.openai);
    this.siteUpdater = new SiteUpdater();
    
    this.siteDir = path.join(__dirname, '../../sito per app');
    this.optimizationLog = [];
  }

  // Ciclo principale di ottimizzazione
  async runOptimizationCycle() {
    console.log('🤖 Avvio ciclo di ottimizzazione automatica...');
    
    try {
      // 1. Analizza performance keyword attuali
      const keywordPerformance = await this.keywordAnalyzer.analyzeCurrentPerformance();
      console.log('📊 Analisi keyword completata');
      
      // 2. Identifica opportunità di miglioramento
      const opportunities = await this.identifyOpportunities(keywordPerformance);
      console.log(`🎯 Trovate ${opportunities.length} opportunità di ottimizzazione`);
      
      // 3. Analizza SERP dei competitor per keyword target
      const serpData = await this.serpAnalyzer.analyzeCompetitorSERP(opportunities);
      console.log('🕵️ Analisi SERP competitor completata');
      
      // 4. Genera ottimizzazioni content
      const optimizations = await this.contentOptimizer.generateOptimizations(
        keywordPerformance, 
        opportunities, 
        serpData
      );
      console.log(`✍️ Generate ${optimizations.length} ottimizzazioni`);
      
      // 5. Applica modifiche al sito
      const results = await this.siteUpdater.applyOptimizations(optimizations);
      console.log('🔄 Modifiche applicate al sito');
      
      // 6. Salva log delle modifiche
      await this.logOptimizations(optimizations, results);
      
      return {
        opportunities,
        optimizations: optimizations.length,
        applied: results.applied,
        errors: results.errors
      };
      
    } catch (error) {
      console.error('❌ Errore nel ciclo di ottimizzazione:', error);
      return { error: error.message };
    }
  }

  // Identifica opportunità di miglioramento
  async identifyOpportunities(keywordPerformance) {
    const opportunities = [];
    
    for (const [keyword, data] of Object.entries(keywordPerformance)) {
      // Keyword che possono salire in prima pagina
      if (data.position > 10 && data.position <= 20 && data.impressions > 100) {
        opportunities.push({
          type: 'ranking_boost',
          keyword: keyword,
          currentPosition: data.position,
          targetPosition: 5,
          priority: 'high',
          impressions: data.impressions,
          ctr: data.ctr
        });
      }
      
      // Keyword con CTR basso da ottimizzare
      if (data.position <= 10 && data.ctr < 3) {
        opportunities.push({
          type: 'ctr_improvement',
          keyword: keyword,
          currentPosition: data.position,
          currentCTR: data.ctr,
          targetCTR: 5,
          priority: 'medium'
        });
      }
      
      // Keyword con alto volume ma posizione bassa
      if (data.position > 20 && data.impressions > 500) {
        opportunities.push({
          type: 'content_expansion',
          keyword: keyword,
          currentPosition: data.position,
          impressions: data.impressions,
          priority: 'high'
        });
      }
    }
    
    return opportunities.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  // Trova keyword emergenti da Google Trends/Autocomplete
  async findEmergingKeywords() {
    const baseKeywords = [
      'sviluppo app',
      'creare app',
      'app mobile'
    ];
    
    const emergingKeywords = [];
    
    for (const baseKeyword of baseKeywords) {
      try {
        // Ottieni suggerimenti Google Autocomplete
        const suggestions = await this.getGoogleSuggestions(baseKeyword);
        
        // Filtra suggerimenti rilevanti e nuovi
        const relevant = suggestions.filter(suggestion => 
          suggestion.includes('2024') || 
          suggestion.includes('nuovo') ||
          suggestion.includes('migliore') ||
          suggestion.includes('gratis')
        );
        
        emergingKeywords.push(...relevant);
        
      } catch (error) {
        console.error(`Errore analisi keyword emergenti per ${baseKeyword}:`, error);
      }
    }
    
    return [...new Set(emergingKeywords)];
  }

  async getGoogleSuggestions(keyword) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`;
      const response = await axios.get(url);
      return response.data[1] || [];
    } catch (error) {
      console.error('Errore Google Suggestions:', error);
      return [];
    }
  }

  // Monitora trend e adatta strategia
  async adaptStrategy() {
    console.log('📈 Analisi trend e adattamento strategia...');
    
    // 1. Trova keyword emergenti
    const emergingKeywords = await this.findEmergingKeywords();
    
    // 2. Analizza keyword competitor che performano bene
    const competitorKeywords = await this.serpAnalyzer.findCompetitorWinningKeywords();
    
    // 3. Identifica gap di contenuto
    const contentGaps = await this.identifyContentGaps(emergingKeywords, competitorKeywords);
    
    // 4. Genera nuovi contenuti per colmare gap
    if (contentGaps.length > 0) {
      const newContent = await this.contentOptimizer.generateNewContent(contentGaps);
      await this.siteUpdater.createNewPages(newContent);
    }
    
    return {
      emergingKeywords: emergingKeywords.length,
      competitorKeywords: competitorKeywords.length,
      contentGaps: contentGaps.length
    };
  }

  async identifyContentGaps(emergingKeywords, competitorKeywords) {
    const gaps = [];
    const currentPages = await this.getCurrentSitePages();
    
    // Combina keyword emergenti e competitor
    const allOpportunities = [...emergingKeywords, ...competitorKeywords];
    
    for (const keyword of allOpportunities) {
      // Controlla se abbiamo già contenuto per questa keyword
      const hasContent = currentPages.some(page => 
        page.title.toLowerCase().includes(keyword.toLowerCase()) ||
        page.content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!hasContent) {
        gaps.push({
          keyword: keyword,
          type: 'missing_content',
          suggestedPageType: this.suggestPageType(keyword),
          priority: this.calculateKeywordPriority(keyword)
        });
      }
    }
    
    return gaps.slice(0, 5); // Massimo 5 gap per ciclo
  }

  async getCurrentSitePages() {
    const pages = [];
    const indexPath = path.join(this.siteDir, 'index.html');
    
    if (await fs.pathExists(indexPath)) {
      const content = await fs.readFile(indexPath, 'utf8');
      const $ = cheerio.load(content);
      
      pages.push({
        path: 'index.html',
        title: $('title').text(),
        content: $('body').text(),
        h1: $('h1').text(),
        metaDescription: $('meta[name="description"]').attr('content') || ''
      });
    }
    
    return pages;
  }

  suggestPageType(keyword) {
    if (keyword.includes('costo') || keyword.includes('prezzo')) {
      return 'pricing_page';
    }
    if (keyword.includes('come') || keyword.includes('guida')) {
      return 'guide_page';
    }
    if (keyword.includes('migliore') || keyword.includes('top')) {
      return 'comparison_page';
    }
    return 'service_page';
  }

  calculateKeywordPriority(keyword) {
    let score = 0;
    
    // Parole ad alto valore commerciale
    if (keyword.includes('costo') || keyword.includes('prezzo')) score += 3;
    if (keyword.includes('migliore') || keyword.includes('professionale')) score += 2;
    if (keyword.includes('gratis') || keyword.includes('economico')) score += 2;
    if (keyword.includes('2024') || keyword.includes('nuovo')) score += 1;
    
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  // Log delle ottimizzazioni
  async logOptimizations(optimizations, results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      optimizations: optimizations.length,
      applied: results.applied,
      errors: results.errors,
      details: optimizations.map(opt => ({
        type: opt.type,
        target: opt.target,
        change: opt.change
      }))
    };
    
    this.optimizationLog.push(logEntry);
    
    // Salva log su file
    const logPath = path.join(__dirname, 'optimization-log.json');
    await fs.writeJson(logPath, this.optimizationLog, { spaces: 2 });
    
    console.log(`📝 Log salvato: ${optimizations.length} ottimizzazioni applicate`);
  }

  // Scheduling automatico
  setupAutomaticOptimization() {
    console.log('⏰ Setup ottimizzazione automatica...');
    
    // Ottimizzazione principale ogni 6 ore
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Ciclo di ottimizzazione automatica...');
      await this.runOptimizationCycle();
    });
    
    // Analisi trend giornaliera
    cron.schedule('0 2 * * *', async () => {
      console.log('📈 Analisi trend giornaliera...');
      await this.adaptStrategy();
    });
    
    // Quick optimization ogni 2 ore (solo CTR e meta)
    cron.schedule('0 */2 * * *', async () => {
      console.log('⚡ Quick optimization...');
      await this.quickOptimization();
    });
    
    console.log('✅ Scheduling configurato:');
    console.log('   - Ottimizzazione completa: ogni 6 ore');
    console.log('   - Analisi trend: ogni giorno alle 2:00');
    console.log('   - Quick optimization: ogni 2 ore');
  }

  async quickOptimization() {
    // Ottimizzazioni rapide solo su meta tag e titles
    const opportunities = await this.keywordAnalyzer.findQuickWins();
    
    for (const opportunity of opportunities) {
      if (opportunity.type === 'meta_optimization') {
        await this.siteUpdater.updateMetaTags(opportunity);
      }
    }
  }

  // Genera report delle ottimizzazioni
  async generateOptimizationReport() {
    const report = {
      period: 'Ultimi 30 giorni',
      totalOptimizations: this.optimizationLog.length,
      successRate: this.calculateSuccessRate(),
      keywordImprovements: await this.calculateKeywordImprovements(),
      recommendations: await this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, 'optimization-report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    return report;
  }

  calculateSuccessRate() {
    if (this.optimizationLog.length === 0) return 0;
    
    const successful = this.optimizationLog.filter(log => log.errors === 0).length;
    return Math.round((successful / this.optimizationLog.length) * 100);
  }

  async calculateKeywordImprovements() {
    // Analizza miglioramenti posizioni keyword dopo ottimizzazioni
    // Placeholder - da implementare con dati storici
    return {
      improved: 15,
      stable: 8,
      declined: 2
    };
  }

  async generateRecommendations() {
    return [
      'Considera di creare contenuto per "sviluppo app 2024"',
      'Ottimizza meta description per migliorare CTR',
      'Aggiungi schema markup per migliore visibilità SERP'
    ];
  }
}

// Esegui ottimizzatore
async function main() {
  const optimizer = new SEOAutoOptimizer();
  
  // Avvia ciclo manuale per test
  console.log('🚀 Avvio SEO Auto-Optimizer...');
  
  const result = await optimizer.runOptimizationCycle();
  console.log('📊 Risultato ciclo:', result);
  
  // Setup scheduling automatico
  optimizer.setupAutomaticOptimization();
  
  // Genera report iniziale
  const report = await optimizer.generateOptimizationReport();
  console.log('📋 Report generato:', report);
  
  // Mantieni processo attivo
  process.stdin.resume();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SEOAutoOptimizer;