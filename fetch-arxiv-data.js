const fs = require('fs');
const https = require('https');
const xml2js = require('xml2js');

// Hlavní fyzikální kategorie na arXiv
const PHYSICS_CATEGORIES = [
  'physics.gen-ph',  // Obecná fyzika
  'quant-ph',        // Kvantová fyzika
  'cond-mat',        // Kondenzované látky
  'hep-th',          // Teoretická fyzika vysokých energií
  'hep-ph',          // Fenomenologie vysokých energií
  'gr-qc',           // Obecná relativita a kvantová kosmologie
  'astro-ph',        // Astrofyzika
  'nucl-th',         // Jaderná teorie
  'physics.atom-ph', // Atomová fyzika
  'physics.optics',  // Optika
  'physics.plasm-ph',// Fyzika plazmatu
  'physics.flu-dyn', // Dynamika tekutin
  'math-ph'          // Matematická fyzika
];

class ArXivDataFetcher {
  constructor() {
    this.baseUrl = 'https://export.arxiv.org/api/query';
    this.dataDir = './physics-research-data';
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Vytvoření podadresářů pro každou kategorii
    PHYSICS_CATEGORIES.forEach(category => {
      const categoryDir = `${this.dataDir}/${category.replace('.', '_')}`;
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
    });
  }

  async fetchFromCategory(category, maxResults = 100, startIndex = 0) {
    console.log(`Stahuji data z kategorie: ${category}`);
    
    const query = `search_query=cat:${category}&start=${startIndex}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    const url = `${this.baseUrl}?${query}`;
    
    try {
      const xmlData = await this.httpGet(url);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const entries = result.feed.entry || [];
      console.log(`Nalezeno ${entries.length} článků v kategorii ${category}`);
      
      const articles = entries.map(entry => this.parseEntry(entry));
      
      // Uložení do souboru
      const filename = `${this.dataDir}/${category.replace('.', '_')}/articles_${startIndex}-${startIndex + maxResults}.json`;
      fs.writeFileSync(filename, JSON.stringify(articles, null, 2));
      
      console.log(`Uloženo do: ${filename}`);
      return articles;
      
    } catch (error) {
      console.error(`Chyba při stahování z kategorie ${category}:`, error.message);
      return [];
    }
  }

  parseEntry(entry) {
    return {
      id: entry.id[0],
      title: entry.title[0].replace(/\n/g, ' ').trim(),
      summary: entry.summary[0].replace(/\n/g, ' ').trim(),
      authors: entry.author ? entry.author.map(author => author.name[0]) : [],
      published: entry.published[0],
      updated: entry.updated[0],
      categories: entry.category ? entry.category.map(cat => cat.$.term) : [],
      pdfUrl: entry.link ? entry.link.find(link => link.$.type === 'application/pdf')?.$.href : null,
      arxivUrl: entry.link ? entry.link.find(link => link.$.rel === 'alternate')?.$.href : null
    };
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  async fetchAllCategories(articlesPerCategory = 100) {
    console.log('Začínám stahování ze všech fyzikálních kategorií...');
    
    for (const category of PHYSICS_CATEGORIES) {
      await this.fetchFromCategory(category, articlesPerCategory);
      // Pauza mezi požadavky (arXiv rate limiting)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('Stahování dokončeno!');
  }

  async searchByKeywords(keywords, maxResults = 50) {
    console.log(`Vyhledávání článků s klíčovými slovy: ${keywords.join(', ')}`);
    
    const searchQuery = keywords.map(kw => `all:${kw}`).join('+AND+');
    const query = `search_query=${searchQuery}&max_results=${maxResults}&sortBy=relevance`;
    const url = `${this.baseUrl}?${query}`;
    
    try {
      const xmlData = await this.httpGet(url);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      const entries = result.feed.entry || [];
      const articles = entries.map(entry => this.parseEntry(entry));
      
      const filename = `${this.dataDir}/search_${keywords.join('_')}.json`;
      fs.writeFileSync(filename, JSON.stringify(articles, null, 2));
      
      console.log(`Nalezeno ${articles.length} článků, uloženo do: ${filename}`);
      return articles;
      
    } catch (error) {
      console.error('Chyba při vyhledávání:', error.message);
      return [];
    }
  }
}

// Export pro použití jako modul
module.exports = ArXivDataFetcher;

// Pokud je spuštěn přímo
if (require.main === module) {
  const fetcher = new ArXivDataFetcher();
  
  // Příklady použití:
  
  // 1. Stáhnout nejnovější články ze všech kategorií
  // fetcher.fetchAllCategories(50);
  
  // 2. Vyhledat specifická témata
  const importantTopics = [
    ['quantum', 'computing'],
    ['machine', 'learning', 'physics'],
    ['dark', 'matter'],
    ['gravitational', 'waves'],
    ['superconductivity'],
    ['quantum', 'field', 'theory'],
    ['condensed', 'matter'],
    ['particle', 'physics'],
    ['cosmology'],
    ['string', 'theory']
  ];
  
  async function searchImportantTopics() {
    for (const keywords of importantTopics) {
      await fetcher.searchByKeywords(keywords, 100);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Spustit vyhledávání
  searchImportantTopics();
}

