const cheerio = require('cheerio');
const natural = require('natural');
const compromise = require('compromise');

class ContentOptimizer {
  constructor(openaiClient) {
    this.openai = openaiClient;
    this.stemmer = natural.PorterStemmer;
  }

  // Genera ottimizzazioni per il contenuto
  async generateOptimizations(keywordPerformance, opportunities, serpData) {
    const optimizations = [];
    
    for (const opportunity of opportunities) {
      switch (opportunity.type) {
        case 'ranking_boost':
          const rankingOpt = await this.optimizeForRanking(opportunity, serpData);
          optimizations.push(...rankingOpt);
          break;
          
        case 'ctr_improvement':
          const ctrOpt = await this.optimizeForCTR(opportunity);
          optimizations.push(...ctrOpt);
          break;
          
        case 'content_expansion':
          const expansionOpt = await this.expandContent(opportunity, serpData);
          optimizations.push(...expansionOpt);
          break;
      }
    }
    
    return optimizations;
  }

  // Ottimizza per migliorare ranking
  async optimizeForRanking(opportunity, serpData) {
    const keyword = opportunity.keyword;
    const competitorData = serpData[keyword] || {};
    
    const optimizations = [];
    
    // 1. Ottimizza title tag
    const titleOpt = await this.optimizeTitle(keyword, competitorData);
    if (titleOpt) optimizations.push(titleOpt);
    
    // 2. Ottimizza meta description
    const metaOpt = await this.optimizeMetaDescription(keyword, competitorData);
    if (metaOpt) optimizations.push(metaOpt);
    
    // 3. Ottimizza H1
    const h1Opt = await this.optimizeH1(keyword);
    if (h1Opt) optimizations.push(h1Opt);
    
    // 4. Aggiungi contenuto correlato
    const contentOpt = await this.addRelatedContent(keyword, competitorData);
    if (contentOpt) optimizations.push(contentOpt);
    
    return optimizations;
  }

  async optimizeTitle(keyword, competitorData) {
    const prompt = `
Analizza questi title tag dei competitor per la keyword "${keyword}":
${JSON.stringify(competitorData.titles || [], null, 2)}

Genera un title tag ottimizzato che:
1. Include la keyword principale
2. È più accattivante dei competitor
3. Resta sotto i 60 caratteri
4. Include elementi di conversione (numeri, benefici)

Rispondi solo con il title tag ottimizzato.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      });

      const optimizedTitle = response.choices[0].message.content.trim();
      
      return {
        type: 'title_optimization',
        target: 'index.html',
        selector: 'title',
        currentValue: '', // Da riempire dal site updater
        newValue: optimizedTitle,
        keyword: keyword,
        reason: 'Ottimizzazione title per migliorare ranking'
      };
    } catch (error) {
      console.error('Errore ottimizzazione title:', error);
      return null;
    }
  }

  async optimizeMetaDescription(keyword, competitorData) {
    const prompt = `
Analizza queste meta description dei competitor per la keyword "${keyword}":
${JSON.stringify(competitorData.descriptions || [], null, 2)}

Genera una meta description ottimizzata che:
1. Include la keyword principale e varianti
2. Ha una call-to-action chiara
3. Resta tra 150-160 caratteri
4. È più convincente dei competitor
5. Include benefici specifici

Rispondi solo con la meta description ottimizzata.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7
      });

      const optimizedMeta = response.choices[0].message.content.trim();
      
      return {
        type: 'meta_description_optimization',
        target: 'index.html',
        selector: 'meta[name="description"]',
        attribute: 'content',
        currentValue: '',
        newValue: optimizedMeta,
        keyword: keyword,
        reason: 'Ottimizzazione meta description per migliorare CTR'
      };
    } catch (error) {
      console.error('Errore ottimizzazione meta description:', error);
      return null;
    }
  }

  async optimizeH1(keyword) {
    const prompt = `
Genera un H1 ottimizzato per la keyword "${keyword}" che:
1. Include la keyword in modo naturale
2. È accattivante e persuasivo
3. Comunica valore unico
4. È ottimizzato per conversioni
5. Massimo 70 caratteri

Esempi di H1 efficaci:
- "Sviluppo App Mobile che Trasformano le Tue Idee in Realtà"
- "Crea la Tua App di Successo: Sviluppo Professionale da Zero"

Rispondi solo con l'H1 ottimizzato.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0.8
      });

      const optimizedH1 = response.choices[0].message.content.trim();
      
      return {
        type: 'h1_optimization',
        target: 'index.html',
        selector: 'h1',
        currentValue: '',
        newValue: optimizedH1,
        keyword: keyword,
        reason: 'Ottimizzazione H1 per migliorare rilevanza keyword'
      };
    } catch (error) {
      console.error('Errore ottimizzazione H1:', error);
      return null;
    }
  }

  async addRelatedContent(keyword, competitorData) {
    const prompt = `
Basandoti sui contenuti dei competitor per "${keyword}":
${JSON.stringify(competitorData.contentTopics || [], null, 2)}

Genera un paragrafo di contenuto (200-300 parole) che:
1. Include la keyword principale e varianti LSI
2. Copre aspetti non trattati dai competitor
3. Fornisce valore unico agli utenti
4. Include call-to-action naturali
5. È ottimizzato per SEO

Rispondi solo con il paragrafo HTML formattato.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7
      });

      const additionalContent = response.choices[0].message.content.trim();
      
      return {
        type: 'content_addition',
        target: 'index.html',
        selector: '.services', // Aggiungi dopo la sezione servizi
        insertPosition: 'after',
        content: additionalContent,
        keyword: keyword,
        reason: 'Aggiunta contenuto per aumentare rilevanza topica'
      };
    } catch (error) {
      console.error('Errore aggiunta contenuto:', error);
      return null;
    }
  }

  // Ottimizza per migliorare CTR
  async optimizeForCTR(opportunity) {
    const keyword = opportunity.keyword;
    
    const prompt = `
Per la keyword "${keyword}" che è in posizione ${opportunity.currentPosition} con CTR del ${opportunity.currentCTR}%:

Genera varianti di title e meta description più accattivanti per aumentare il CTR:

1. Title con numeri/statistiche
2. Title con urgenza/scarsità  
3. Title con beneficio chiaro
4. Meta description con call-to-action forte
5. Meta description con prova sociale

Formato risposta:
TITLE_1: [title]
TITLE_2: [title]  
TITLE_3: [title]
META_1: [meta description]
META_2: [meta description]
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.8
      });

      const variations = this.parseVariations(response.choices[0].message.content);
      
      // Seleziona la migliore variante (per ora la prima)
      return [
        {
          type: 'ctr_title_test',
          target: 'index.html',
          selector: 'title',
          currentValue: '',
          newValue: variations.titles[0],
          keyword: keyword,
          reason: 'A/B test title per migliorare CTR'
        },
        {
          type: 'ctr_meta_test',
          target: 'index.html',
          selector: 'meta[name="description"]',
          attribute: 'content',
          currentValue: '',
          newValue: variations.metas[0],
          keyword: keyword,
          reason: 'A/B test meta description per migliorare CTR'
        }
      ];
    } catch (error) {
      console.error('Errore ottimizzazione CTR:', error);
      return [];
    }
  }

  parseVariations(content) {
    const lines = content.split('\n');
    const titles = [];
    const metas = [];
    
    lines.forEach(line => {
      if (line.startsWith('TITLE_')) {
        titles.push(line.split(': ')[1]);
      } else if (line.startsWith('META_')) {
        metas.push(line.split(': ')[1]);
      }
    });
    
    return { titles, metas };
  }

  // Espandi contenuto per keyword con alto volume
  async expandContent(opportunity, serpData) {
    const keyword = opportunity.keyword;
    const competitorData = serpData[keyword] || {};
    
    const prompt = `
Per la keyword "${keyword}" con ${opportunity.impressions} impressioni mensili:

Analizza i gap di contenuto basandoti sui competitor:
${JSON.stringify(competitorData.contentStructure || [], null, 2)}

Genera una sezione completa (400-600 parole) che includa:
1. H2 ottimizzato con la keyword
2. Paragrafi con sottotematiche correlate
3. Lista di benefici/caratteristiche
4. FAQ pertinenti
5. Call-to-action strategiche

Formato: HTML semantico con markup appropriato.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      });

      const expandedContent = response.choices[0].message.content.trim();
      
      return {
        type: 'content_expansion',
        target: 'index.html',
        selector: '.cta-section',
        insertPosition: 'before',
        content: expandedContent,
        keyword: keyword,
        reason: 'Espansione contenuto per keyword ad alto volume'
      };
    } catch (error) {
      console.error('Errore espansione contenuto:', error);
      return null;
    }
  }

  // Genera nuove pagine per gap di contenuto
  async generateNewContent(contentGaps) {
    const newPages = [];
    
    for (const gap of contentGaps) {
      const pageContent = await this.generateCompletePage(gap);
      if (pageContent) {
        newPages.push(pageContent);
      }
    }
    
    return newPages;
  }

  async generateCompletePage(gap) {
    const keyword = gap.keyword;
    const pageType = gap.suggestedPageType;
    
    const prompt = `
Genera una pagina HTML completa per la keyword "${keyword}" di tipo "${pageType}":

Struttura richiesta:
1. Title tag ottimizzato (max 60 caratteri)
2. Meta description accattivante (150-160 caratteri)  
3. H1 principale con keyword
4. Contenuto strutturato con H2/H3
5. Minimo 800 parole di contenuto di qualità
6. Call-to-action strategiche
7. Schema markup appropriato
8. Link interni al sito principale

Il contenuto deve essere:
- Informativo e utile per gli utenti
- Ottimizzato per SEO senza keyword stuffing
- Orientato alla conversione
- Unico e non duplicato

Rispondi con HTML completo pronto per la pubblicazione.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      });

      const htmlContent = response.choices[0].message.content.trim();
      
      // Genera nome file basato su keyword
      const filename = this.generateFilename(keyword);
      
      return {
        filename: filename,
        content: htmlContent,
        keyword: keyword,
        type: pageType,
        priority: gap.priority
      };
    } catch (error) {
      console.error('Errore generazione pagina:', error);
      return null;
    }
  }

  generateFilename(keyword) {
    return keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '.html';
  }

  // Analizza densità keyword e ottimizza
  analyzeKeywordDensity(content, keyword) {
    const words = content.toLowerCase().split(/\s+/);
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    
    let occurrences = 0;
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ');
      if (phrase === keyword.toLowerCase()) {
        occurrences++;
      }
    }
    
    const density = (occurrences / words.length) * 100;
    
    return {
      density: density.toFixed(2),
      occurrences,
      totalWords: words.length,
      optimal: density >= 0.5 && density <= 2.5
    };
  }

  // Trova keyword LSI (Latent Semantic Indexing)
  findLSIKeywords(keyword) {
    const doc = compromise(keyword);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    // Genera varianti semantiche
    const lsiKeywords = [];
    
    // Sinonimi e varianti
    const variations = {
      'sviluppo': ['creazione', 'realizzazione', 'progettazione'],
      'app': ['applicazione', 'software', 'programma'],
      'mobile': ['smartphone', 'telefono', 'cellulare']
    };
    
    Object.keys(variations).forEach(word => {
      if (keyword.toLowerCase().includes(word)) {
        variations[word].forEach(variant => {
          lsiKeywords.push(keyword.toLowerCase().replace(word, variant));
        });
      }
    });
    
    return lsiKeywords;
  }
}

module.exports = ContentOptimizer;