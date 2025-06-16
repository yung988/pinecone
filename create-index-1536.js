require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

async function createIndex1536() {
  try {
    console.log('🚀 Vytváření nového indexu s dimenzemi 1536...');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = 'qct-1536';
    
    // Check if index already exists
    const indexes = (await pinecone.listIndexes())?.indexes?.map(i => i.name) || [];
    
    if (indexes.includes(indexName)) {
      console.log(`✅ Index "${indexName}" již existuje`);
      return;
    }
    
    // Create new index
    await pinecone.createIndex({
      name: indexName,
      dimension: 1536,
      waitUntilReady: true,
      spec: { 
        serverless: { 
          cloud: 'aws',
          region: 'us-east-1'
        }
      } 
    });
    
    console.log(`🎉 Index "${indexName}" byl úspěšně vytvořen!`);
    console.log('📊 Parametry indexu:');
    console.log('   - Název:', indexName);
    console.log('   - Dimenze: 1536');
    console.log('   - Cloud: AWS');
    console.log('   - Region: us-east-1');
    
  } catch (error) {
    console.error('❌ Chyba při vytváření indexu:', error.message);
    throw error;
  }
}

if (require.main === module) {
  createIndex1536()
    .then(() => {
      console.log('✅ Script dokončen úspěšně!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script selhal:', error);
      process.exit(1);
    });
}

module.exports = createIndex1536;

