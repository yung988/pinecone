require('dotenv').config();
const fs = require('fs/promises');
const { Pinecone } = require('@pinecone-database/pinecone');
const { MarkdownTextSplitter } = require('@pinecone-database/doc-splitter');
const { openai } = require('@ai-sdk/openai');
const { embed } = require('ai');
const md5 = require('md5');

// Get embeddings using AI SDK
async function getEmbeddings(text) {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-ada-002'),
    value: text,
  });
  return embedding;
}

// Chunked upsert function
async function chunkedUpsert(index, vectors, namespace = '', chunkSize = 10) {
  for (let i = 0; i < vectors.length; i += chunkSize) {
    const chunk = vectors.slice(i, i + chunkSize);
    await index.namespace(namespace).upsert(chunk);
    console.log(`✅ Nahráno chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(vectors.length/chunkSize)}`);
  }
}

// Upload single file
async function uploadSingleFile(filePath) {
  try {
    console.log(`🚀 Začínám nahrávání souboru: ${filePath}`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`❌ Soubor ${filePath} neexistuje!`);
      return;
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`📄 Načten soubor (${content.length} znaků)`);
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = 'qct-1536'; // Using new index with dimension 1536
    console.log(`📊 Používám index: ${indexName}`);
    
    // Get index
    const index = pinecone.index(indexName);
    
    // Split document
    const splitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    const docs = await splitter.splitDocuments([
      {
        pageContent: content,
        metadata: {
          path: filePath,
          text: content.substring(0, 36000)
        },
      },
    ]);
    
    console.log(`📄 Vytvořeno ${docs.length} chunků`);
    
    // Create vectors
    const vectors = [];
    
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      console.log(`🧠 Embedování chunk ${i + 1}/${docs.length}...`);
      
      try {
        const embedding = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);
        
        const vector = {
          id: hash,
          values: embedding,
          metadata: {
            chunk: doc.pageContent,
            text: doc.metadata.text,
            path: doc.metadata.path,
            hash: hash
          }
        };
        
        vectors.push(vector);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Chyba při embedování chunk ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`✅ Úspěšně embedováno ${vectors.length} chunků`);
    
    // Upload to Pinecone
    console.log('☁️ Nahrávání do Pinecone...');
    await chunkedUpsert(index, vectors, '', 5);
    
    console.log('🎉 Nahrávání dokončeno!');
    console.log(`📊 Nahráno celkem ${vectors.length} vektorů ze souboru ${filePath}`);
    
  } catch (error) {
    console.error('❌ Chyba při nahrávání:', error.message);
    console.error(error);
  }
}

// Get file path from command line argument or use default
const filePath = process.argv[2] || './slabophon-qct-theory/README.md';

if (require.main === module) {
  uploadSingleFile(filePath)
    .then(() => {
      console.log('✅ Script dokončen úspěšně!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script selhal:', error);
      process.exit(1);
    });
}

module.exports = uploadSingleFile;

