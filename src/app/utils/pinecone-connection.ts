import { Pinecone } from '@pinecone-database/pinecone';

// Basic Pinecone connection setup
export const createPineconeConnection = () => {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || ''
  });
  
  return pc;
};

// Test basic connection
export const testConnection = async () => {
  try {
    const pc = createPineconeConnection();
    
    // List indexes to verify connection
    const indexes = await pc.listIndexes();
    console.log('Connection successful! Available indexes:', indexes?.indexes?.map(i => i.name));
    
    return { success: true, indexes: indexes?.indexes };
  } catch (error) {
    console.error('Connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get a specific index
export const getIndex = (indexName?: string) => {
  const pc = createPineconeConnection();
  const name = indexName || process.env.PINECONE_INDEX || 'quickstart';
  
  return pc.index(name);
};

