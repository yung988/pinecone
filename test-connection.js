// Simple test script to verify Pinecone connection
// Run with: node test-connection.js

require('dotenv').config();

const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeConnection() {
  try {
    console.log('Testing Pinecone connection...');
    
    // Check if API key is set
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ PINECONE_API_KEY not found in environment variables');
      return;
    }
    
    console.log('✅ API key found');
    
    // Create Pinecone client
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    console.log('✅ Pinecone client created');
    
    // List indexes
    const indexes = await pc.listIndexes();
    console.log('✅ Connection successful!');
    console.log('Available indexes:', indexes?.indexes?.map(i => ({ name: i.name, dimension: i.dimension })));
    
    // Test specific index if PINECONE_INDEX is set
    if (process.env.PINECONE_INDEX) {
      const indexName = process.env.PINECONE_INDEX;
      console.log(`\nTesting index: ${indexName}`);
      
      const index = pc.index(indexName);
      const stats = await index.describeIndexStats();
      console.log('✅ Index accessible');
      console.log('Index stats:', {
        totalVectorCount: stats.totalVectorCount,
        dimension: stats.dimension
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('401')) {
      console.error('Check your PINECONE_API_KEY - it may be invalid or expired');
    }
  }
}

testPineconeConnection();

