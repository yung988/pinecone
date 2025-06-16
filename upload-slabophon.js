require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter, MarkdownTextSplitter } = require('@pinecone-database/doc-splitter');
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

// Truncate string by bytes
function truncateStringByBytes(str, bytes) {
  const enc = new TextEncoder();
  return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
}

// Chunked upsert function
async function chunkedUpsert(index, vectors, namespace, chunkSize = 10) {
  for (let i = 0; i < vectors.length; i += chunkSize) {
    const chunk = vectors.slice(i, i + chunkSize);
    await index.namespace(namespace).upsert(chunk);
    console.log(`Uploaded chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(vectors.length/chunkSize)}`);
  }
}

// Allowed file extensions
const allowedExtensions = ['.md', '.py', '.txt', '.js', '.ts', '.json'];

// Read directory recursively
async function readDirectoryRecursive(dirPath) {
  console.log(`📁 Čtení složky: ${dirPath}`);
  let files = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip .git directory
        if (entry.name === '.git') {
          console.log(`⏭️  Přeskakuji .git složku`);
          continue;
        }
        files = files.concat(await readDirectoryRecursive(fullPath));
      } else if (allowedExtensions.includes(path.extname(fullPath))) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({ filePath: fullPath, content });
          console.log(`✅ Načten soubor: ${fullPath}`);
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

// Prepare documents for embedding
async function prepareDocument(file, splitter) {
  const pageContent = file.content;
  const docs = await splitter.splitDocuments([
    {
      pageContent,
      metadata: {
        path: file.filePath,
        text: truncateStringByBytes(pageContent, 36000)
      },
    },
  ]);

  return docs.map((doc) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        hash: md5(doc.pageContent)
      },
    };
  });
}

// Embed document
async function embedDocument(doc) {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    
    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text,
        path: doc.metadata.path,
        hash: doc.metadata.hash
      }
    };
  } catch (error) {
    console.log(`❌ Chyba při embedování dokumentu: ${error.message}`);
    throw error;
  }
}

// Main upload function
async function uploadSlabophonFiles() {
  try {
    console.log('🚀 Začínám nahrávání souborů ze slabophon-qct-theory/');
    
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    const indexName = process.env.PINECONE_INDEX || 'qct';
    console.log(`📊 Používám index: ${indexName}`);
    
    // Get index
    const index = pinecone.index(indexName);
    
    // Read all files from slabophon-qct-theory directory
    const dirPath = './slabophon-qct-theory';
    const files = await readDirectoryRecursive(dirPath);
    
    if (files.length === 0) {
      console.log('❌ Žádné soubory nebyly nalezeny!');
      return;
    }
    
    console.log(`📚 Nalezeno ${files.length} souborů k nahrání`);
    
    // Prepare document splitter
    const splitter = new MarkdownTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    // Prepare documents
    console.log('🔧 Příprava dokumentů...');
    const allDocuments = [];
    
    for (const file of files) {
      const docs = await prepareDocument(file, splitter);
      allDocuments.push(...docs);
    }
    
    console.log(`📄 Vytvořeno ${allDocuments.length} dokumentových chunků`);
    
    // Embed documents
    console.log('🧠 Embedování dokumentů...');
    const vectors = [];
    
    for (let i = 0; i < allDocuments.length; i++) {
      const doc = allDocuments[i];
      console.log(`Embedování ${i + 1}/${allDocuments.length}: ${doc.metadata.path}`);
      
      try {
        const vector = await embedDocument(doc);
        vectors.push(vector);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Chyba při embedování dokumentu ${doc.metadata.path}: ${error.message}`);
      }
    }
    
    console.log(`✅ Úspěšně embedováno ${vectors.length} dokumentů`);
    
    // Upload to Pinecone
    console.log('☁️ Nahrávání do Pinecone...');
    await chunkedUpsert(index, vectors, '', 10);
    
    console.log('🎉 Nahrávání dokončeno!');
    console.log(`📊 Nahráno celkem ${vectors.length} vektorů`);
    
  } catch (error) {
    console.error('❌ Chyba při nahrávání:', error.message);
    throw error;
  }
}

// Run the upload
if (require.main === module) {
  uploadSlabophonFiles()
    .then(() => {
      console.log('✅ Script dokončen úspěšně!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script selhal:', error);
      process.exit(1);
    });
}

module.exports = uploadSlabophonFiles;

