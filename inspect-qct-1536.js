require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function inspectIndex() {
  try {
    console.log('🔍 Inspekce indexu qct-1536...');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = 'qct-1536';
    
    // Get index
    const index = pinecone.index(indexName);
    
    // Get index stats
    const stats = await index.describeIndexStats();
    
    console.log(`📊 Statistiky indexu ${indexName}:`);
    console.log(`   - Celkový počet vektorů: ${stats.totalVectorCount}`);
    console.log(`   - Dimenze: ${stats.dimension}`);
    console.log(`   - Namespaces:`, Object.keys(stats.namespaces || {}));
    
    if (stats.totalVectorCount > 0 || Object.keys(stats.namespaces || {}).length > 0) {
      console.log('✅ Index obsahuje data!');
      
      // Try to query some data
      console.log('🔎 Zkouším dotaz na první data...');
      const queryResult = await index.query({
        vector: new Array(1536).fill(0.1), // dummy vector for testing
        topK: 3,
        includeMetadata: true
      });
      
      console.log('📄 Nalezené dokumenty:');
      queryResult.matches?.forEach((match, i) => {
        console.log(`   ${i + 1}. Soubor: ${match.metadata?.path}`);
        console.log(`      Skóre: ${match.score}`);
        console.log(`      Začátek textu: ${match.metadata?.chunk?.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('❌ Index je prázdný');
    }
    
  } catch (error) {
    console.error('❌ Chyba při inspekci:', error.message);
  }
}

if (require.main === module) {
  inspectIndex()
    .then(() => {
      console.log('✅ Inspekce dokončena!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Chyba:', error);
      process.exit(1);
    });
}

module.exports = inspectIndex;

