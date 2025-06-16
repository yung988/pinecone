require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
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
async function chunkedUpsert(index, vectors, namespace = '', chunkSize = 20) {
  for (let i = 0; i < vectors.length; i += chunkSize) {
    const chunk = vectors.slice(i, i + chunkSize);
    await index.namespace(namespace).upsert(chunk);
    console.log(`✅ Nahráno chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(vectors.length/chunkSize)}`);
  }
}

// Allowed file extensions
const allowedExtensions = ['.md', '.py', '.txt', '.js', '.ts', '.json'];

// Read directory recursively
async function readDirectoryRecursive(dirPath) {
  let files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip .git directory
        if (entry.name === '.git') {
          continue;
        }
        files = files.concat(await readDirectoryRecursive(fullPath));
      } else if (allowedExtensions.includes(path.extname(fullPath))) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({ filePath: fullPath, content });
        } catch (error) {
          console.log(`❌ Chyba při čtení souboru ${fullPath}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Chyba při čtení složky ${dirPath}: ${error.message}`);
  }
  
  return files;
}

// Process single file
async function processFile(file, splitter) {
  const docs = await splitter.splitDocuments([
    {
      pageContent: file.content,
      metadata: {
        path: file.filePath,
        text: file.content.substring(0, 36000)
      },
    },
  ]);

  const vectors = [];
  
  for (const doc of docs) {
    try {
      const embedding = await getEmbeddings(doc.pageContent);
      const hash = md5(doc.pageContent);
      
      vectors.push({
        id: hash,
        values: embedding,
        metadata: {
          chunk: doc.pageContent,
          text: doc.metadata.text,
          path: doc.metadata.path,
          hash: hash
        }
      });
    } catch (error) {
      console.error(`❌ Chyba při embedování: ${error.message}`);
    }
  }
  
  return vectors;
}

// Main upload function
async function uploadAllFiles() {
  try {
    console.log('🚀 Začínám nahrávání všech souborů ze slabophon-qct-theory/');
    console.log('⚡ Rychlý režim - bez zbytečných zpoždění');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = 'qct-1536';
    console.log(`📊 Používám index: ${indexName}`);
    
    const index = pinecone.index(indexName);
    
    // Read all files
    const dirPath = './slabophon-qct-theory';
    const files = await readDirectoryRecursive(dirPath);
    
    console.log(`📚 Nalezeno ${files.length} souborů k nahrání`);
    
    // Document splitter
    const splitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    let totalVectors = 0;
    let processedFiles = 0;
    
    // Process files one by one
    for (const file of files) {
      processedFiles++;
      console.log(`\n📄 [${processedFiles}/${files.length}] Zpracovávám: ${file.filePath}`);
      console.log(`   Velikost: ${file.content.length} znaků`);
      
      try {
        // Process file
        const vectors = await processFile(file, splitter);
        
        if (vectors.length > 0) {
          // Upload to Pinecone
          await chunkedUpsert(index, vectors, '', 20);
          totalVectors += vectors.length;
          console.log(`   ✅ Nahráno ${vectors.length} vektorů`);
        } else {
          console.log(`   ⚠️  Žádné vektory nevytvořeny`);
        }
        
      } catch (error) {
        console.error(`   ❌ Chyba při zpracování souboru: ${error.message}`);
      }
      
      // Progress info
      const progress = ((processedFiles / files.length) * 100).toFixed(1);
      console.log(`   📈 Postup: ${progress}% (${processedFiles}/${files.length})`);
    }
    
    console.log('\n🎉 Nahrávání dokončeno!');
    console.log(`📊 Celková statistika:`);
    console.log(`   - Zpracováno souborů: ${processedFiles}`);
    console.log(`   - Nahráno celkem vektorů: ${totalVectors}`);
    console.log(`   - Index: ${indexName}`);
    
  } catch (error) {
    console.error('❌ Hlavní chyba:', error.message);
    throw error;
  }
}

if (require.main === module) {
  uploadAllFiles()
    .then(() => {
      console.log('✅ Script dokončen úspěšně!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script selhal:', error);
      process.exit(1);
    });
}

module.exports = uploadAllFiles;

