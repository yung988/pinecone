import seed from './seed'
import { NextResponse } from 'next/server';
import { ServerlessSpecCloudEnum } from '@pinecone-database/pinecone'
import path from 'path';

export async function POST(req: Request) {
  const { dirPath, options } = await req.json();

  if (!dirPath) {
    return NextResponse.json({ success: false, error: "No directory path provided" }, { status: 400 });
  }

  try {
    // Construct an absolute path to prevent directory traversal attacks
    // and ensure we're reading from a known location inside the project.
    const projectRoot = process.cwd();
    const safePath = path.join(projectRoot, dirPath);

    // Basic check to see if we're still inside the project
    if (!safePath.startsWith(projectRoot)) {
        return NextResponse.json({ success: false, error: "Invalid path provided" }, { status: 400 });
    }

    const documents = await seed(
      safePath,
      process.env.PINECONE_INDEX!,
      process.env.PINECONE_CLOUD as ServerlessSpecCloudEnum || 'aws',
      process.env.PINECONE_REGION || 'us-west-2',
      options
    )
    return NextResponse.json({ success: true, documents })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: `Failed crawling local directory: ${error.message}` })
  }
} 