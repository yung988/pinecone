const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { openai } = require('@ai-sdk/openai');
const { embedMany } = require('ai');

class WorldResearchUploader {
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    this.indexName = process.env.PINECONE_INDEX;
    this.dataDirectories = [
      './physics-research-data',
      './world-research-data',
      './slabophon-qct-theory'
    ];
  }

  async init() {
    try {
      this.index = this.pinecone.Index(this.indexName);
      console.log(`✅ Připojen k Pinecone indexu: ${this.indexName}`);
    } catch (error) {
      console.error('❌ Chyba při připojení k Pinecone:', error.message);
      throw error;
    }
  }

  async processArXivData() {
    console.log('\n📄 Zpracovávám arXiv data...');
    const arxivDir = './physics-research-data';
    const files = fs.readdirSync(arxivDir).filter(f => f.endsWith('.json'));
    
    const allDocuments = [];
    
    for (const file of files) {
      const filePath = path.join(arxivDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      console.log(`   Zpracovávám ${file}: ${data.length} článků`);
      
      for (const article of data) {
        // Kombinace title + abstract jako text pro embedding (zkráceno pro embedding)
        const content = `Title: ${article.title}\n\nAbstract: ${article.summary}`.substring(0, 4000);
        
        allDocuments.push({
          id: `arxiv_${article.id.split('/').pop()}`, // Použití arXiv ID
          content: content,
          metadata: {
            source: 'arXiv',
            title: article.title,
            authors: article.authors.join(', '),
            categories: article.categories.join(', '),
            published: article.published,
            arxiv_url: article.arxivUrl,
            pdf_url: article.pdfUrl,
            type: 'research_paper',
            dataset: file.replace('.json', '')
          }
        });
      }
    }
    
    console.log(`   📊 Celkem arXiv dokumentů: ${allDocuments.length}`);
    return allDocuments;
  }

  async processINSPIREData() {
    console.log('\n🔬 Zpracovávám INSPIRE-HEP data...');
    const inspireFile = './world-research-data/inspire/inspire_data.json';
    
    if (!fs.existsSync(inspireFile)) {
      console.log('   ⚠️ INSPIRE data nenalezena');
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(inspireFile, 'utf8'));
    console.log(`   Zpracovávám ${data.length} INSPIRE článků`);
    
    const documents = data.map(article => {
      const content = `Title: ${article.title}\n\nAbstract: ${article.abstract}\n\nKeywords: ${article.keywords.join(', ')}`.substring(0, 4000);
      
      return {
        id: `inspire_${article.id}`,
        content: content,
        metadata: {
          source: 'INSPIRE-HEP',
          title: article.title,
          authors: article.authors.join(', '),
          journal: article.journal || '',
          citations: article.citations || 0,
          date: article.date,
          topic: article.topic,
          arxiv_eprint: article.arxiv_eprint || '',
          inspire_url: article.url,
          type: 'research_paper'
        }
      };
    });
    
    console.log(`   📊 Celkem INSPIRE dokumentů: ${documents.length}`);
    return documents;
  }

  async processEducationalData() {
    console.log('\n🎓 Zpracovávám vzdělávací data...');
    const eduFile = './world-research-data/educational/physics_education.json';
    
    if (!fs.existsSync(eduFile)) {
      console.log('   ⚠️ Vzdělávací data nenalezena');
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(eduFile, 'utf8'));
    console.log(`   Zpracovávám ${data.length} vzdělávacích zdrojů`);
    
    const documents = data.map((resource, index) => {
      const content = `Title: ${resource.title}\n\nDescription: ${resource.description}\n\nType: ${resource.type}`;
      
      return {
        id: `edu_${index + 1}`,
        content: content,
        metadata: {
          source: resource.source,
          title: resource.title,
          type: 'educational_resource',
          resource_type: resource.type,
          category: resource.category,
          url: resource.url
        }
      };
    });
    
    console.log(`   📊 Celkem vzdělávacích dokumentů: ${documents.length}`);
    return documents;
  }

  async processQCTData() {
    console.log('\n⚛️ Zpracovávám QCT teorii data...');
    const qctDir = './slabophon-qct-theory';
    
    if (!fs.existsSync(qctDir)) {
      console.log('   ⚠️ QCT data nenalezena');
      return [];
    }
    
    const documents = [];
    
    // Načtení README
    const readmePath = path.join(qctDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf8');
      documents.push({
        id: 'qct_readme',
        content: content,
        metadata: {
          source: 'QCT Theory',
          title: 'Slabophon QCT Theory - README',
          type: 'documentation',
          file_type: 'markdown'
        }
      });
    }
    
    // Rekurzivní procházení všech .md a .txt souborů
    const processDirectory = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.')) {
          processDirectory(fullPath, `${prefix}${item}_`);
        } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.txt') || item.endsWith('.py'))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.length > 50) { // Ignorovat velmi krátké soubory
              documents.push({
                id: `qct_${prefix}${item.replace(/[^a-zA-Z0-9]/g, '_')}`,
                content: content.substring(0, 4000), // Zkráceno pro embedding
                metadata: {
                  source: 'QCT Theory',
                  title: `QCT: ${item}`,
                  type: 'research_code',
                  file_type: item.split('.').pop(),
                  file_path: fullPath.replace('./slabophon-qct-theory/', '')
                }
              });
            }
          } catch (error) {
            console.log(`   ⚠️ Nelze číst soubor ${fullPath}: ${error.message}`);
          }
        }
      }
    };
    
    processDirectory(qctDir);
    console.log(`   📊 Celkem QCT dokumentů: ${documents.length}`);
    return documents;
  }

  async generateEmbeddings(documents, batchSize = 50) {
    console.log(`\n🧠 Generuji embeddingy pro ${documents.length} dokumentů...`);
    
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    
    const allVectors = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`   Batch ${i + 1}/${batches.length}: ${batch.length} dokumentů`);
      
      try {
        const texts = batch.map(doc => doc.content);
        const { embeddings } = await embedMany({
          model: openai.embedding('text-embedding-3-small'),
          values: texts
        });
        
        const vectors = batch.map((doc, index) => ({
          id: doc.id,
          values: embeddings[index],
          metadata: {
            ...doc.metadata,
            content_preview: doc.content.substring(0, 200) + '...'
          }
        }));
        
        allVectors.push(...vectors);
        
        // Pauza mezi batchy
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`   ❌ Chyba v batch ${i + 1}:`, error.message);
      }
    }
    
    console.log(`   ✅ Vygenerováno ${allVectors.length} embeddingů`);
    return allVectors;
  }

  async uploadToPinecone(vectors, batchSize = 100) {
    console.log(`\n📤 Nahrávám ${vectors.length} vektorů do Pinecone...`);
    
    const batches = [];
    for (let i = 0; i < vectors.length; i += batchSize) {
      batches.push(vectors.slice(i, i + batchSize));
    }
    
    let uploaded = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        await this.index.upsert(batch);
        uploaded += batch.length;
        console.log(`   Nahráno ${uploaded}/${vectors.length} vektorů (${Math.round(uploaded/vectors.length*100)}%)`);
        
        // Pauza mezi uploady
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`   ❌ Chyba při uploadu batch ${i + 1}:`, error.message);
      }
    }
    
    console.log(`   ✅ Upload dokončen: ${uploaded} vektorů`);
    return uploaded;
  }

  async uploadAllResearchData() {
    console.log('🚀 ZAČÍNÁM NAHRÁVÁNÍ SVĚTOVÝCH FYZIKÁLNÍCH DAT');
    console.log('=' .repeat(60));
    
    try {
      await this.init();
      
      // Sbírání všech dokumentů
      const allDocuments = [];
      
      const arxivDocs = await this.processArXivData();
      allDocuments.push(...arxivDocs);
      
      const inspireDocs = await this.processINSPIREData();
      allDocuments.push(...inspireDocs);
      
      const eduDocs = await this.processEducationalData();
      allDocuments.push(...eduDocs);
      
      const qctDocs = await this.processQCTData();
      allDocuments.push(...qctDocs);
      
      console.log(`\n📋 SOUHRN ZPRACOVANÝCH DAT:`);
      console.log(`   arXiv články: ${arxivDocs.length}`);
      console.log(`   INSPIRE články: ${inspireDocs.length}`);
      console.log(`   Vzdělávací zdroje: ${eduDocs.length}`);
      console.log(`   QCT dokumenty: ${qctDocs.length}`);
      console.log(`   CELKEM: ${allDocuments.length} dokumentů`);
      
      if (allDocuments.length === 0) {
        console.log('❌ Žádná data k nahrání!');
        return;
      }
      
      // Generování embeddingů
      const vectors = await this.generateEmbeddings(allDocuments);
      
      // Upload do Pinecone
      const uploaded = await this.uploadToPinecone(vectors);
      
      // Finální report
      console.log('\n' + '=' .repeat(60));
      console.log('🎉 NAHRÁVÁNÍ DOKONČENO!');
      console.log(`   Zpracováno: ${allDocuments.length} dokumentů`);
      console.log(`   Nahráno: ${uploaded} vektorů`);
      console.log(`   Úspěšnost: ${Math.round(uploaded/allDocuments.length*100)}%`);
      
      // Uložení metadat
      const metadata = {
        timestamp: new Date().toISOString(),
        total_documents: allDocuments.length,
        uploaded_vectors: uploaded,
        sources: {
          arxiv: arxivDocs.length,
          inspire: inspireDocs.length,
          educational: eduDocs.length,
          qct_theory: qctDocs.length
        }
      };
      
      fs.writeFileSync('./upload_metadata.json', JSON.stringify(metadata, null, 2));
      console.log(`   Metadata uložena do: ./upload_metadata.json`);
      
    } catch (error) {
      console.error('❌ KRITICKÁ CHYBA:', error.message);
      throw error;
    }
  }

  // Testovací funkce pro ověření indexu
  async testIndex() {
    console.log('\n🔍 Testuji Pinecone index...');
    
    try {
      await this.init();
      
      const stats = await this.index.describeIndexStats();
      console.log('📊 Statistiky indexu:');
      console.log(`   Celkem vektorů: ${stats.totalVectorCount}`);
      console.log(`   Dimenze: ${stats.dimension}`);
      
      // Testovací dotaz
      const { embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: ['quantum physics fundamentals']
      });
      
      const results = await this.index.query({
        vector: embeddings[0],
        topK: 5,
        includeMetadata: true
      });
      
      console.log('\n🔍 Testovací vyhledávání pro "quantum physics fundamentals":');
      results.matches.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match.metadata.title} (${match.score.toFixed(3)})`);
        console.log(`      Zdroj: ${match.metadata.source}`);
      });
      
    } catch (error) {
      console.error('❌ Chyba při testování:', error.message);
    }
  }
}

module.exports = WorldResearchUploader;

// Pokud je spuštěn přímo
if (require.main === module) {
  const uploader = new WorldResearchUploader();
  
  // Spustit upload
  uploader.uploadAllResearchData()
    .then(() => {
      console.log('\n🧪 Spouštím test indexu...');
      return uploader.testIndex();
    })
    .then(() => {
      console.log('\n✅ Vše dokončeno!');
    })
    .catch(error => {
      console.error('💥 Celkový proces selhal:', error.message);
      process.exit(1);
    });
}

