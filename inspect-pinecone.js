const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function inspectPineconeDatabase() {
  try {
    console.log('🔍 Inspekce Pinecone databáze...');
    
    // Inicializace Pinecone klienta
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    // Získání seznamu indexů
    const indexList = await pinecone.listIndexes();
    console.log('📋 Dostupné indexy:', indexList.indexes.map(idx => idx.name));
    
    // Připojení k našemu indexu
    const indexName = process.env.PINECONE_INDEX || 'qct';
    console.log(`\n🎯 Kontrola indexu: ${indexName}`);
    
    const index = pinecone.Index(indexName);
    
    // Získání statistik indexu
    const stats = await index.describeIndexStats();
    console.log('📊 Statistiky indexu:');
    console.log('   - Celkový počet vektorů:', stats.totalVectorCount);
    console.log('   - Dimenze:', stats.dimension);
    console.log('   - Namespaces:', Object.keys(stats.namespaces || {}));
    
    if (stats.namespaces) {
      for (const [namespace, data] of Object.entries(stats.namespaces)) {
        console.log(`   - Namespace '${namespace}': ${data.vectorCount} vektorů`);
      }
    }
    
    // Pokud jsou v indexu nějaká data, zkusme načíst pár vzorků
    if (stats.totalVectorCount > 0) {
      console.log('\n🔎 Načítání vzorků dat...');
      
      // Zkusíme dotaz s náhodným vektorem
      const dummyVector = new Array(stats.dimension).fill(0.1);
      const queryResult = await index.query({
        vector: dummyVector,
        topK: 5,
        includeMetadata: true
      });
      
      console.log(`\n📝 Nalezeno ${queryResult.matches.length} vzorků:`);
      queryResult.matches.forEach((match, i) => {
        console.log(`\n   ${i + 1}. ID: ${match.id}`);
        console.log(`      Score: ${match.score}`);
        if (match.metadata) {
          console.log(`      URL: ${match.metadata.url || 'N/A'}`);
          console.log(`      Text preview: ${(match.metadata.chunk || match.metadata.text || 'N/A').substring(0, 100)}...`);
        }
      });
    } else {
      console.log('\n❌ Index je prázdný - žádná data nebyla nalezena');
      console.log('💡 Pro přidání dat můžeš použít:');
      console.log('   1. Webové rozhraní aplikace (npm run dev)');
      console.log('   2. API endpoint /api/crawl');
      console.log('   3. Vlastní script pro upload dat');
    }
    
  } catch (error) {
    console.error('❌ Chyba při inspekci:', error.message);
  }
}

// Funkce pro vmazání všech dat z indexu
async function clearIndex() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = process.env.PINECONE_INDEX || 'qct';
    const index = pinecone.Index(indexName);
    
    console.log(`🗑️  Mazání všech dat z indexu ${indexName}...`);
    await index.deleteAll();
    console.log('✅ Index byl úspěšně vymazán');
    
  } catch (error) {
    console.error('❌ Chyba při mazání:', error.message);
  }
}

// Spuštění podle argumentu
const command = process.argv[2];

if (command === 'clear') {
  clearIndex();
} else {
  inspectPineconeDatabase();
}

