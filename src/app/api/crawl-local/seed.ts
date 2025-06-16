import { getEmbeddings } from "@/utils/embeddings";
import { Document, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { Pinecone, PineconeRecord, ServerlessSpecCloudEnum } from "@pinecone-database/pinecone";
import { chunkedUpsert } from '../../utils/chunkedUpsert'
import md5 from "md5";
import { truncateStringByBytes } from "@/utils/truncateString"
import fs from "fs/promises";
import path from "path";

// New interface for local files
interface LocalFile {
  filePath: string;
  content: string;
}

interface SeedOptions {
  splittingMethod: string
  chunkSize: number
  chunkOverlap: number
}

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter

const allowedExtensions = ['.md', '.py'];

async function readDirectoryRecursive(dirPath: string): Promise<LocalFile[]> {
    console.log(`Reading directory: ${dirPath}`);
    let files: LocalFile[] = [];
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(await readDirectoryRecursive(fullPath));
            } else if (allowedExtensions.includes(path.extname(fullPath))) {
                const content = await fs.readFile(fullPath, 'utf-8');
                files.push({ filePath: fullPath, content });
                console.log(`- Found and read file: ${fullPath}`);
            }
        }
    } catch (e: any) {
        console.error(`Error reading directory ${dirPath}: ${e.message}`);
    }
    return files;
}

async function prepareDocument(file: LocalFile, splitter: DocumentSplitter): Promise<Document[]> {
  const pageContent = file.content;
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        path: file.filePath,
        text: truncateStringByBytes(pageContent, 36000)
      },
    }),
  ]);

  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        hash: md5(doc.pageContent)
      },
    };
  });
}

async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embedding,
      metadata: {
        chunk: doc.pageContent,
        text: doc.metadata.text as string,
        path: doc.metadata.path as string,
        hash: doc.metadata.hash as string
      }
    } as PineconeRecord;
  } catch (error) {
    console.log("Error embedding document: ", error)
    throw error
  }
}

async function seed(dirPath: string, indexName: string, cloudName: ServerlessSpecCloudEnum, regionName: string, options: SeedOptions) {
  try {
    console.log("--- Starting local seeding process ---");
    // Initialize the Pinecone client
    const pinecone = new Pinecone();
    console.log("Pinecone client initialized.");

    // Destructure the options object
    const { splittingMethod, chunkSize, chunkOverlap } = options;
    console.log(`Using options: splittingMethod=${splittingMethod}, chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}`);

    // Read files from the local directory
    const files = await readDirectoryRecursive(dirPath);

    if (files.length === 0) {
        console.log("Error: No files with allowed extensions (.md, .py) found in the directory.");
        return [];
    }
    console.log(`Found ${files.length} files to process.`);
    
    // Choose the appropriate document splitter based on the splitting method
    const splitter: DocumentSplitter = splittingMethod === 'recursive' ?
      new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap }) : new MarkdownTextSplitter({});
    console.log("Document splitter chosen.");

    // Prepare documents by splitting the pages
    const documents = (await Promise.all(files.map(file => prepareDocument(file, splitter)))).flat();
    console.log(`Created ${documents.length} document chunks.`);

    // Create Pinecone index if it does not exist
    console.log(`Checking for index "${indexName}"...`);
    const indexList: string[] = (await pinecone.listIndexes())?.indexes?.map(index => index.name) || [];
    const indexExists = indexList.includes(indexName);
    if (!indexExists) {
      console.log(`Index "${indexName}" does not exist. Creating...`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        waitUntilReady: true,
        spec: { 
          serverless: { 
              cloud: cloudName, 
              region: regionName
          }
        } 
      });
      console.log(`Index "${indexName}" created successfully.`);
    } else {
      console.log(`Index "${indexName}" already exists.`);
    }

    const index = pinecone.Index(indexName)

    // Get the vector embeddings for the documents
    console.log("Embedding documents...");
    const vectors = await Promise.all(documents.flat().map(embedDocument));
    console.log(`Successfully embedded ${vectors.length} documents.`);

    // Upsert vectors into the Pinecone index
    console.log(`Upserting ${vectors.length} vectors into index "${indexName}"...`);
    await chunkedUpsert(index!, vectors, '', 10);
    console.log("--- Seeding process completed successfully! ---");

    // Return the first document
    return documents;
  } catch (error) {
    console.error("Error during seeding process:", error);
    throw error;
  }
}

export default seed; 