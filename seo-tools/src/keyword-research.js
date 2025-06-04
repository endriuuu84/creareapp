const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

class KeywordResearchAutomation {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox'] 
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Ottieni suggerimenti da Google Autocomplete
  async getGoogleSuggestions(keyword) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`;
      const response = await axios.get(url);
      const suggestions = response.data[1];
      
      return {
        keyword,
        suggestions: suggestions.slice(0, 10)
      };
    } catch (error) {
      console.error('Errore Google Suggestions:', error);
      return { keyword, suggestions: [] };
    }
  }

  // Estrai "People Also Ask" da Google
  async getPeopleAlsoAsk(keyword) {
    try {
      const page = await this.browser.newPage();
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, {
        waitUntil: 'networkidle2'
      });

      const questions = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-q]');
        return Array.from(elements).map(el => el.getAttribute('data-q'));
      });

      await page.close();
      return questions.filter(q => q);
    } catch (error) {
      console.error('Errore People Also Ask:', error);
      return [];
    }
  }

  // Estrai Related Searches
  async getRelatedSearches(keyword) {
    try {
      const page = await this.browser.newPage();
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, {
        waitUntil: 'networkidle2'
      });

      const related = await page.evaluate(() => {
        const elements = document.querySelectorAll('a[href*="/search?q="]');
        return Array.from(elements)
          .map(el => el.textContent)
          .filter(text => text && text.length > 10 && text.length < 100);
      });

      await page.close();
      return [...new Set(related)].slice(0, 8);
    } catch (error) {
      console.error('Errore Related Searches:', error);
      return [];
    }
  }

  // Analizza SERP per identificare intent e tipologia contenuti
  async analyzeSERP(keyword) {
    try {
      const page = await this.browser.newPage();
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, {
        waitUntil: 'networkidle2'
      });

      const serpData = await page.evaluate(() => {
        const results = [];
        const elements = document.querySelectorAll('div[data-sokoban-container] h3');
        
        elements.forEach((el, index) => {
          if (index < 10) {
            const link = el.parentElement;
            const snippet = el.parentElement.parentElement.querySelector('span[style*="-webkit-line-clamp"]');
            
            results.push({
              position: index + 1,
              title: el.textContent,
              url: link ? link.href : '',
              snippet: snippet ? snippet.textContent : ''
            });
          }
        });

        return results;
      });

      await page.close();
      
      // Analizza tipo di contenuto dominante
      const contentTypes = this.analyzeContentTypes(serpData);
      
      return {
        keyword,
        topResults: serpData,
        dominantContentType: contentTypes
      };
    } catch (error) {
      console.error('Errore analisi SERP:', error);
      return null;
    }
  }

  // Analizza tipologia contenuti nei risultati
  analyzeContentTypes(results) {
    const types = {
      guide: 0,
      list: 0,
      comparison: 0,
      review: 0,
      tool: 0,
      service: 0
    };

    results.forEach(result => {
      const title = result.title.toLowerCase();
      const snippet = result.snippet.toLowerCase();
      const combined = title + ' ' + snippet;

      if (combined.includes('guida') || combined.includes('come')) types.guide++;
      if (combined.includes('migliori') || combined.includes('top')) types.list++;
      if (combined.includes('vs') || combined.includes('confronto')) types.comparison++;
      if (combined.includes('recensione') || combined.includes('opinioni')) types.review++;
      if (combined.includes('calcolatore') || combined.includes('tool')) types.tool++;
      if (combined.includes('servizio') || combined.includes('agenzia')) types.service++;
    });

    return Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }

  // Genera variazioni keyword
  generateKeywordVariations(baseKeyword) {
    const prefixes = ['come', 'migliore', 'quanto costa', 'dove', 'quando'];
    const suffixes = ['gratis', 'online', 'professionale', 'economico', 'veloce'];
    const locations = ['milano', 'roma', 'italia', 'vicino a me'];
    
    const variations = [];
    
    // Aggiungi prefissi
    prefixes.forEach(prefix => {
      variations.push(`${prefix} ${baseKeyword}`);
    });
    
    // Aggiungi suffissi
    suffixes.forEach(suffix => {
      variations.push(`${baseKeyword} ${suffix}`);
    });
    
    // Aggiungi località
    locations.forEach(location => {
      variations.push(`${baseKeyword} ${location}`);
    });
    
    return variations;
  }

  // Ricerca keyword complete per un topic
  async completeKeywordResearch(seedKeyword) {
    console.log(`\n🔎 Avvio ricerca keyword per: "${seedKeyword}"`);
    
    await this.initialize();
    
    const research = {
      seed: seedKeyword,
      timestamp: new Date().toISOString(),
      suggestions: await this.getGoogleSuggestions(seedKeyword),
      variations: this.generateKeywordVariations(seedKeyword),
      peopleAlsoAsk: await this.getPeopleAlsoAsk(seedKeyword),
      relatedSearches: await this.getRelatedSearches(seedKeyword),
      serpAnalysis: await this.analyzeSERP(seedKeyword)
    };
    
    // Ottieni suggerimenti per le variazioni principali
    research.expandedSuggestions = [];
    for (const variation of research.variations.slice(0, 5)) {
      const suggestions = await this.getGoogleSuggestions(variation);
      research.expandedSuggestions.push(suggestions);
    }
    
    await this.cleanup();
    
    return research;
  }

  // Esporta risultati in formato utilizzabile
  exportResults(research) {
    const allKeywords = new Set();
    
    // Aggiungi tutte le keyword trovate
    allKeywords.add(research.seed);
    research.suggestions.suggestions.forEach(s => allKeywords.add(s));
    research.variations.forEach(v => allKeywords.add(v));
    research.peopleAlsoAsk.forEach(q => allKeywords.add(q));
    research.relatedSearches.forEach(r => allKeywords.add(r));
    research.expandedSuggestions.forEach(group => {
      group.suggestions.forEach(s => allKeywords.add(s));
    });
    
    // Categorizza per lunghezza (indicatore di long-tail)
    const categorized = {
      short: [], // 1-2 parole
      medium: [], // 3-4 parole
      long: [] // 5+ parole
    };
    
    allKeywords.forEach(keyword => {
      const wordCount = keyword.split(' ').length;
      if (wordCount <= 2) categorized.short.push(keyword);
      else if (wordCount <= 4) categorized.medium.push(keyword);
      else categorized.long.push(keyword);
    });
    
    return {
      total: allKeywords.size,
      keywords: Array.from(allKeywords),
      categorized,
      contentStrategy: this.generateContentStrategy(research)
    };
  }

  // Genera strategia contenuti basata su ricerca
  generateContentStrategy(research) {
    const strategy = {
      primaryTopic: research.seed,
      contentTypes: [],
      suggestedTitles: [],
      targetQueries: []
    };
    
    // Basato su SERP analysis
    if (research.serpAnalysis && research.serpAnalysis.dominantContentType) {
      const dominant = research.serpAnalysis.dominantContentType[0];
      
      switch(dominant.type) {
        case 'guide':
          strategy.contentTypes.push('Guida completa', 'Tutorial step-by-step');
          strategy.suggestedTitles.push(
            `Guida Completa: ${research.seed} nel 2024`,
            `Come ${research.seed}: Tutorial Passo-Passo`
          );
          break;
        case 'list':
          strategy.contentTypes.push('Listicle', 'Confronto');
          strategy.suggestedTitles.push(
            `I 10 Migliori Servizi per ${research.seed}`,
            `Top 15 Consigli per ${research.seed}`
          );
          break;
        case 'service':
          strategy.contentTypes.push('Landing page', 'Case study');
          strategy.suggestedTitles.push(
            `${research.seed} Professionale - Risultati Garantiti`,
            `Perché Scegliere Noi per ${research.seed}`
          );
          break;
      }
    }
    
    // Target queries da People Also Ask
    strategy.targetQueries = research.peopleAlsoAsk.slice(0, 5);
    
    return strategy;
  }
}

// Esegui ricerca
async function runKeywordResearch() {
  const researcher = new KeywordResearchAutomation();
  
  // Keywords principali da ricercare
  const seedKeywords = [
    'sviluppo app',
    'creare app mobile',
    'quanto costa sviluppare app'
  ];
  
  const allResults = [];
  
  for (const seed of seedKeywords) {
    const research = await researcher.completeKeywordResearch(seed);
    const results = researcher.exportResults(research);
    
    console.log(`\n📊 Risultati per "${seed}":`);
    console.log(`   - Totale keyword trovate: ${results.total}`);
    console.log(`   - Short-tail: ${results.categorized.short.length}`);
    console.log(`   - Medium-tail: ${results.categorized.medium.length}`);
    console.log(`   - Long-tail: ${results.categorized.long.length}`);
    console.log(`\n📝 Strategia contenuti consigliata:`);
    console.log(results.contentStrategy);
    
    allResults.push(results);
    
    // Pausa tra ricerche per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Salva risultati (implementare database/file)
  const fs = require('fs');
  fs.writeFileSync(
    'keyword-research-results.json', 
    JSON.stringify(allResults, null, 2)
  );
  
  console.log('\n✅ Ricerca keyword completata!');
}

// Esegui se chiamato direttamente
if (require.main === module) {
  runKeywordResearch();
}

module.exports = KeywordResearchAutomation;