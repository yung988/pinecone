const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

async function debugPinecone() {
  try {
    console.log('Pinecone API Key:', process.env.PINECONE_API_KEY ? 'Set' : 'Not set');
    console.log('Pinecone Index:', process.env.PINECONE_INDEX);
    console.log('Pinecone Environment:', process.env.PINECONE_ENVIRONMENT);
    console.log('Pinecone Region:', process.env.PINECONE_REGION);
    
    const pinecone = new Pinecone();
    
    console.log('\nListing indexes...');
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', JSON.stringify(indexes, null, 2));
    
    const indexName = process.env.PINECONE_INDEX;
    if (indexes?.indexes) {
      const foundIndex = indexes.indexes.find(i => i.name === indexName);
      if (foundIndex) {
        console.log(`\nIndex '${indexName}' found:`, JSON.stringify(foundIndex, null, 2));
      } else {
        console.log(`\nIndex '${indexName}' NOT found`);
        console.log('Available index names:', indexes.indexes.map(i => i.name));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugPinecone();

