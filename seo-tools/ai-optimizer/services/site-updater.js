const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { diff } = require('diff');

class SiteUpdater {
  constructor() {
    this.siteDir = path.join(__dirname, '../../../sito per app');
    this.backupDir = path.join(__dirname, '../backups');
  }

  // Applica le ottimizzazioni al sito
  async applyOptimizations(optimizations) {
    console.log(`🔄 Applicando ${optimizations.length} ottimizzazioni...`);
    
    const results = {
      applied: 0,
      errors: 0,
      changes: []
    };
    
    // Crea backup prima delle modifiche
    await this.createBackup();
    
    for (const optimization of optimizations) {
      try {
        const result = await this.applyOptimization(optimization);
        if (result.success) {
          results.applied++;
          results.changes.push(result.change);
          console.log(`✅ ${optimization.type}: ${optimization.reason}`);
        } else {
          results.errors++;
          console.log(`❌ Errore ${optimization.type}: ${result.error}`);
        }
      } catch (error) {
        results.errors++;
        console.error(`❌ Errore applicazione ottimizzazione:`, error);
      }
    }
    
    // Aggiorna sitemap se sono state create nuove pagine
    if (results.applied > 0) {
      await this.updateSitemap();
    }
    
    return results;
  }

  async applyOptimization(optimization) {
    const filePath = path.join(this.siteDir, optimization.target);
    
    // Verifica che il file esista
    if (!await fs.pathExists(filePath)) {
      return { success: false, error: 'File non trovato' };
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const $ = cheerio.load(content);
      
      let modified = false;
      let changeDescription = '';
      
      switch (optimization.type) {
        case 'title_optimization':
          const currentTitle = $('title').text();
          $('title').text(optimization.newValue);
          changeDescription = `Title: "${currentTitle}" → "${optimization.newValue}"`;
          modified = true;
          break;
          
        case 'meta_description_optimization':
          const currentMeta = $('meta[name="description"]').attr('content') || '';
          $('meta[name="description"]').attr('content', optimization.newValue);
          changeDescription = `Meta description aggiornata per "${optimization.keyword}"`;
          modified = true;
          break;
          
        case 'h1_optimization':
          const currentH1 = $('h1').first().text();
          $('h1').first().text(optimization.newValue);
          changeDescription = `H1: "${currentH1}" → "${optimization.newValue}"`;
          modified = true;
          break;
          
        case 'content_addition':
          if (optimization.insertPosition === 'after') {
            $(optimization.selector).after(optimization.content);
          } else if (optimization.insertPosition === 'before') {
            $(optimization.selector).before(optimization.content);
          } else {
            $(optimization.selector).append(optimization.content);
          }
          changeDescription = `Contenuto aggiunto per "${optimization.keyword}"`;
          modified = true;
          break;
          
        case 'content_expansion':
          $(optimization.selector).before(optimization.content);
          changeDescription = `Sezione espansa per "${optimization.keyword}"`;
          modified = true;
          break;
          
        default:
          return { success: false, error: 'Tipo ottimizzazione non supportato' };
      }
      
      if (modified) {
        // Salva il file modificato
        await fs.writeFile(filePath, $.html(), 'utf8');
        
        return {
          success: true,
          change: {
            file: optimization.target,
            type: optimization.type,
            keyword: optimization.keyword,
            description: changeDescription,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      return { success: false, error: 'Nessuna modifica applicata' };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Crea nuove pagine per gap di contenuto
  async createNewPages(newPages) {
    console.log(`📄 Creando ${newPages.length} nuove pagine...`);
    
    const results = [];
    
    for (const page of newPages) {
      try {
        const filePath = path.join(this.siteDir, page.filename);
        
        // Verifica che la pagina non esista già
        if (await fs.pathExists(filePath)) {
          console.log(`⚠️ Pagina ${page.filename} già esistente, skip`);
          continue;
        }
        
        // Applica template base se il contenuto non è HTML completo
        let htmlContent = page.content;
        if (!htmlContent.includes('<!DOCTYPE html>')) {
          htmlContent = this.wrapWithTemplate(page.content, page.keyword);
        }
        
        await fs.writeFile(filePath, htmlContent, 'utf8');
        
        results.push({
          filename: page.filename,
          keyword: page.keyword,
          type: page.type,
          success: true
        });
        
        console.log(`✅ Pagina creata: ${page.filename} per "${page.keyword}"`);
        
      } catch (error) {
        console.error(`❌ Errore creazione pagina ${page.filename}:`, error);
        results.push({
          filename: page.filename,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  wrapWithTemplate(content, keyword) {
    return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${keyword} - Sviluppo App Mobile</title>
    <meta name="description" content="Scopri tutto su ${keyword}. Servizi professionali di sviluppo app mobile.">
    
    <!-- Styles -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://creareapp.it/${keyword.replace(/\s+/g, '-').toLowerCase()}">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="navbar">
            <div class="container">
                <div class="nav-wrapper">
                    <a href="/" class="logo">
                        <span class="logo-text">AppDev</span>
                    </a>
                    <ul class="nav-menu">
                        <li><a href="/#servizi">Servizi</a></li>
                        <li><a href="/#tipologie">Tipologie App</a></li>
                        <li><a href="/#processo">Come Lavoriamo</a></li>
                        <li><a href="/#portfolio">Portfolio</a></li>
                        <li><a href="/#contatti" class="cta-button">Contatti</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main>
        ${content}
        
        <!-- CTA Section -->
        <section class="cta-section">
            <div class="container">
                <h2>Pronto a Sviluppare la Tua App?</h2>
                <p>Contattaci per un preventivo gratuito e personalizzato.</p>
                <a href="/#contatti" class="btn btn-primary btn-large">Richiedi Preventivo</a>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Servizi</h4>
                    <ul>
                        <li><a href="/sviluppo-app-native">Sviluppo App Native</a></li>
                        <li><a href="/app-cross-platform">App Cross-Platform</a></li>
                        <li><a href="/consulenza-mobile">Consulenza Mobile</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 Sviluppo App Mobile. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  }

  // Crea backup del sito prima delle modifiche
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    try {
      await fs.ensureDir(this.backupDir);
      await fs.copy(this.siteDir, backupPath);
      console.log(`💾 Backup creato: ${backupPath}`);
      
      // Mantieni solo gli ultimi 10 backup
      await this.cleanupOldBackups();
      
    } catch (error) {
      console.error('❌ Errore creazione backup:', error);
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await fs.readdir(this.backupDir);
      const backupDirs = backups
        .filter(dir => dir.startsWith('backup-'))
        .sort()
        .reverse();
      
      // Rimuovi backup più vecchi di 10
      if (backupDirs.length > 10) {
        for (const oldBackup of backupDirs.slice(10)) {
          await fs.remove(path.join(this.backupDir, oldBackup));
          console.log(`🗑️ Backup rimosso: ${oldBackup}`);
        }
      }
    } catch (error) {
      console.error('Errore cleanup backup:', error);
    }
  }

  // Aggiorna sitemap con nuove pagine
  async updateSitemap() {
    const sitemapPath = path.join(this.siteDir, 'sitemap.xml');
    
    try {
      // Trova tutti i file HTML nel sito
      const htmlFiles = await this.findHtmlFiles(this.siteDir);
      
      // Genera nuovo sitemap
      const sitemap = this.generateSitemap(htmlFiles);
      
      await fs.writeFile(sitemapPath, sitemap, 'utf8');
      console.log('🗺️ Sitemap aggiornata');
      
    } catch (error) {
      console.error('❌ Errore aggiornamento sitemap:', error);
    }
  }

  async findHtmlFiles(dir, baseDir = dir) {
    const files = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        const subFiles = await this.findHtmlFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (item.endsWith('.html')) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }
    
    return files;
  }

  generateSitemap(htmlFiles) {
    const baseUrl = 'https://creareapp.it';
    const today = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    htmlFiles.forEach(file => {
      const url = file === 'index.html' ? '' : file.replace('.html', '');
      const priority = file === 'index.html' ? '1.0' : '0.8';
      
      sitemap += `
    <url>
        <loc>${baseUrl}/${url}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority}</priority>
    </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    return sitemap;
  }

  // Ottimizzazioni specifiche per meta tag
  async updateMetaTags(optimization) {
    const filePath = path.join(this.siteDir, 'index.html');
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const $ = cheerio.load(content);
      
      // Aggiorna o aggiungi meta tag specifici
      if (optimization.metaType === 'keywords') {
        $('meta[name="keywords"]').attr('content', optimization.keywords);
      } else if (optimization.metaType === 'author') {
        $('meta[name="author"]').attr('content', optimization.author);
      }
      
      await fs.writeFile(filePath, $.html(), 'utf8');
      console.log(`✅ Meta tag ${optimization.metaType} aggiornati`);
      
    } catch (error) {
      console.error('❌ Errore aggiornamento meta tag:', error);
    }
  }

  // Rollback a backup precedente
  async rollbackToBackup(backupName) {
    const backupPath = path.join(this.backupDir, backupName);
    
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup ${backupName} non trovato`);
    }
    
    try {
      // Crea backup dello stato attuale prima del rollback
      await this.createBackup();
      
      // Ripristina dal backup
      await fs.remove(this.siteDir);
      await fs.copy(backupPath, this.siteDir);
      
      console.log(`🔄 Rollback completato a: ${backupName}`);
      
    } catch (error) {
      console.error('❌ Errore durante rollback:', error);
      throw error;
    }
  }

  // Genera diff delle modifiche
  async generateChangeDiff(beforeContent, afterContent) {
    const changes = diff(beforeContent, afterContent);
    
    let diffOutput = '';
    changes.forEach(change => {
      if (change.added) {
        diffOutput += `+ ${change.value}`;
      } else if (change.removed) {
        diffOutput += `- ${change.value}`;
      }
    });
    
    return diffOutput;
  }
}

module.exports = SiteUpdater;