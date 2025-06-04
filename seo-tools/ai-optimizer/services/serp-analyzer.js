const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');

class SERPAnalyzer {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Analizza SERP dei competitor per keyword specifiche
  async analyzeCompetitorSERP(opportunities) {
    await this.initialize();
    
    const serpData = {};
    
    for (const opportunity of opportunities.slice(0, 5)) { // Limita a 5 per evitare rate limiting
      try {
        const keyword = opportunity.keyword;
        console.log(`🔍 Analizzando SERP per: ${keyword}`);
        
        const data = await this.scrapeSERP(keyword);
        serpData[keyword] = data;
        
        // Pausa tra richieste
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Errore analisi SERP per ${opportunity.keyword}:`, error);
      }
    }
    
    await this.cleanup();
    return serpData;
  }

  async scrapeSERP(keyword) {
    const page = await this.browser.newPage();
    
    try {
      // Imposta user agent e headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=it&gl=it`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Estrai dati SERP
      const serpData = await page.evaluate(() => {
        const results = [];
        const resultElements = document.querySelectorAll('div[data-ved] h3');
        
        resultElements.forEach((element, index) => {
          if (index < 10) { // Top 10 risultati
            const titleElement = element;
            const linkElement = titleElement.closest('a');
            const snippetElement = titleElement.closest('[data-ved]').querySelector('[data-sncf]');
            
            results.push({
              position: index + 1,
              title: titleElement.textContent,
              url: linkElement ? linkElement.href : '',
              snippet: snippetElement ? snippetElement.textContent : '',
              domain: linkElement ? new URL(linkElement.href).hostname : ''
            });
          }
        });
        
        // Controlla se c'è un featured snippet
        const featuredSnippet = document.querySelector('[data-attrid="wa:/description"]');
        
        // Conta annunci pubblicitari
        const ads = document.querySelectorAll('[data-text-ad]').length;
        
        return {
          results,
          featuredSnippet: featuredSnippet ? featuredSnippet.textContent : null,
          adsCount: ads,
          peopleAlsoAsk: Array.from(document.querySelectorAll('[data-q]')).map(el => el.getAttribute('data-q'))
        };
      });
      
      await page.close();
      
      // Analizza i risultati
      const analysis = this.analyzeSERPResults(serpData, keyword);
      
      return {
        ...serpData,
        ...analysis
      };
      
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  analyzeSERPResults(serpData, keyword) {
    const results = serpData.results;
    
    // Analizza domini dominanti
    const domainCount = {};
    results.forEach(result => {
      domainCount[result.domain] = (domainCount[result.domain] || 0) + 1;
    });
    
    // Estrai pattern nei title
    const titles = results.map(r => r.title);
    const titlePatterns = this.findTitlePatterns(titles, keyword);
    
    // Analizza lunghezza snippet
    const snippetLengths = results.map(r => r.snippet.length).filter(len => len > 0);
    const avgSnippetLength = snippetLengths.reduce((sum, len) => sum + len, 0) / snippetLengths.length;
    
    // Analizza content structure
    const contentAnalysis = this.analyzeContentStructure(results);
    
    return {
      topDomains: Object.keys(domainCount).slice(0, 5),
      domainDistribution: domainCount,
      titlePatterns,
      avgSnippetLength: Math.round(avgSnippetLength),
      contentAnalysis,
      competitorGaps: this.identifyContentGaps(results, keyword)
    };
  }

  findTitlePatterns(titles, keyword) {
    const patterns = {
      hasNumbers: titles.filter(title => /\d+/.test(title)).length,
      hasYear: titles.filter(title => /202[0-9]/.test(title)).length,
      hasBrackets: titles.filter(title => /[\[\(\{]/.test(title)).length,
      hasQuestion: titles.filter(title => /\?/.test(title)).length,
      startsWithKeyword: titles.filter(title => title.toLowerCase().startsWith(keyword.toLowerCase())).length,
      containsKeyword: titles.filter(title => title.toLowerCase().includes(keyword.toLowerCase())).length
    };
    
    // Trova parole comuni nei title
    const allWords = titles.join(' ').toLowerCase().split(/\s+/);
    const wordFreq = {};
    allWords.forEach(word => {
      if (word.length > 3 && !keyword.toLowerCase().includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const commonWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    return {
      ...patterns,
      commonWords
    };
  }

  analyzeContentStructure(results) {
    const analysis = {
      ecommerce: 0,
      informational: 0,
      commercial: 0,
      local: 0
    };
    
    results.forEach(result => {
      const text = (result.title + ' ' + result.snippet).toLowerCase();
      
      if (text.includes('prezzo') || text.includes('comprare') || text.includes('acquista')) {
        analysis.ecommerce++;
      } else if (text.includes('come') || text.includes('guida') || text.includes('tutorial')) {
        analysis.informational++;
      } else if (text.includes('migliore') || text.includes('confronto') || text.includes('recensione')) {
        analysis.commercial++;
      } else if (text.includes('vicino') || text.includes('zona') || text.includes('milano')) {
        analysis.local++;
      }
    });
    
    return analysis;
  }

  identifyContentGaps(results, keyword) {
    const gaps = [];
    
    // Analizza cosa manca nei primi 10 risultati
    const allContent = results.map(r => r.title + ' ' + r.snippet).join(' ').toLowerCase();
    
    // Gap tematici comuni per sviluppo app
    const expectedTopics = [
      'costo',
      'prezzo', 
      'tempo',
      'processo',
      'tecnologie',
      'esempi',
      'portfolio',
      'preventivo',
      'consulenza'
    ];
    
    expectedTopics.forEach(topic => {
      if (!allContent.includes(topic)) {
        gaps.push({
          type: 'missing_topic',
          topic: topic,
          opportunity: `Nessun risultato copre "${topic}" per "${keyword}"`,
          priority: 'medium'
        });
      }
    });
    
    // Gap di formato contenuto
    const hasVideo = results.some(r => r.url.includes('youtube') || r.url.includes('video'));
    const hasGuide = results.some(r => r.title.toLowerCase().includes('guida'));
    const hasPricing = results.some(r => r.title.toLowerCase().includes('prezzo') || r.title.toLowerCase().includes('costo'));
    
    if (!hasVideo) {
      gaps.push({
        type: 'content_format',
        format: 'video',
        opportunity: 'Nessun video nei top 10 risultati',
        priority: 'low'
      });
    }
    
    if (!hasGuide) {
      gaps.push({
        type: 'content_format',
        format: 'guide',
        opportunity: 'Mancano guide dettagliate nei risultati',
        priority: 'high'
      });
    }
    
    if (!hasPricing) {
      gaps.push({
        type: 'content_format',
        format: 'pricing',
        opportunity: 'Nessuna informazione sui prezzi nei top risultati',
        priority: 'high'
      });
    }
    
    return gaps;
  }

  // Trova keyword su cui stanno vincendo i competitor
  async findCompetitorWinningKeywords() {
    // Simulazione - normalmente useremmo API di SEMrush/Ahrefs
    const competitorKeywords = [
      {
        keyword: 'sviluppo app react native',
        competitor: 'competitor1.com',
        position: 2,
        estimatedTraffic: 850
      },
      {
        keyword: 'app cross platform costi',
        competitor: 'competitor2.com', 
        position: 1,
        estimatedTraffic: 1200
      },
      {
        keyword: 'manutenzione app mobile',
        competitor: 'competitor1.com',
        position: 3,
        estimatedTraffic: 640
      },
      {
        keyword: 'sviluppo app flutter italia',
        competitor: 'competitor3.com',
        position: 1,
        estimatedTraffic: 920
      }
    ];
    
    return competitorKeywords.filter(kw => kw.position <= 5);
  }

  // Analizza featured snippets per le nostre keyword
  async analyzeFeaturedSnippets(keywords) {
    const snippetOpportunities = [];
    
    for (const keyword of keywords) {
      const serpData = await this.scrapeSERP(keyword);
      
      if (serpData.featuredSnippet) {
        snippetOpportunities.push({
          keyword: keyword,
          currentSnippet: serpData.featuredSnippet,
          snippetType: this.identifySnippetType(serpData.featuredSnippet),
          opportunity: 'optimize_for_snippet'
        });
      } else {
        snippetOpportunities.push({
          keyword: keyword,
          currentSnippet: null,
          opportunity: 'create_snippet_content'
        });
      }
    }
    
    return snippetOpportunities;
  }

  identifySnippetType(snippet) {
    if (snippet.includes('1.') || snippet.includes('Step')) {
      return 'list';
    } else if (snippet.includes('|') || snippet.includes('\t')) {
      return 'table';
    } else if (snippet.split('.').length > 3) {
      return 'paragraph';
    }
    return 'definition';
  }

  // Monitora cambiamenti SERP nel tempo
  async trackSERPChanges(keyword, previousResults) {
    const currentResults = await this.scrapeSERP(keyword);
    
    if (!previousResults) {
      return { changes: [], isFirstAnalysis: true };
    }
    
    const changes = [];
    const currentUrls = currentResults.results.map(r => r.url);
    const previousUrls = previousResults.results.map(r => r.url);
    
    // Nuovi entranti in top 10
    currentUrls.forEach((url, index) => {
      if (!previousUrls.includes(url)) {
        changes.push({
          type: 'new_entry',
          url: url,
          position: index + 1,
          domain: new URL(url).hostname
        });
      }
    });
    
    // URL che sono usciti dalla top 10
    previousUrls.forEach((url, index) => {
      if (!currentUrls.includes(url)) {
        changes.push({
          type: 'dropped_out',
          url: url,
          previousPosition: index + 1,
          domain: new URL(url).hostname
        });
      }
    });
    
    // Cambiamenti di posizione
    currentUrls.forEach((url, newIndex) => {
      const oldIndex = previousUrls.indexOf(url);
      if (oldIndex !== -1 && oldIndex !== newIndex) {
        const movement = oldIndex - newIndex; // Positivo = salita, negativo = discesa
        changes.push({
          type: 'position_change',
          url: url,
          oldPosition: oldIndex + 1,
          newPosition: newIndex + 1,
          movement: movement,
          domain: new URL(url).hostname
        });
      }
    });
    
    return {
      changes,
      volatility: changes.length / 10, // Indice di volatilità SERP
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SERPAnalyzer;