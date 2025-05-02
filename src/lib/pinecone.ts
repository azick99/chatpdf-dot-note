import { Pinecone } from '@pinecone-database/pinecone'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { pipeline } from 'stream'
import { promisify } from 'util'
import {
  Document,
  RecursiveCharacterTextSplitter,
} from '@pinecone-database/doc-splitter'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const indexName = 'chatpdf-dot-note'

const initializePinecone = async () => {
  const indexExists = await pc.describeIndex(indexName).catch(() => null)
  if (!indexExists) {
    console.log('Creating Pinecone index...')
    await pc.createIndex({
      name: indexName,
      dimension: 1024,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    })
  } else {
    console.log('Pinecone index already exists.')
  }
}

initializePinecone()

const s3Client = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
})

const streamPipeline = promisify(pipeline)

export async function downloadFileFromS3(
  file_key: string
): Promise<string | null> {
  try {
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: file_key,
    })

    const { Body } = await s3Client.send(command)

    if (!Body || typeof Body === 'string') {
      throw new Error('Invalid data stream from S3')
    }

    const filePath = path.join(
      os.tmpdir(),
      `s3-${Date.now()}-${file_key.split('/').pop()}`
    )
    const fileStream = fs.createWriteStream(filePath)

    // Use pipeline to safely write stream to file
    await streamPipeline(Body as NodeJS.ReadableStream, fileStream)

    return filePath
  } catch (error) {
    console.error('Error downloading file from S3:', error)
    return null
  }
}

type PDFPage = {
  pageContent: string
  metadata: { loc: { pageNumber: number } }
}

export async function loadS3IntoPinecone(file_key: string) {
  const file_name = await downloadFileFromS3(file_key)
  if (!file_name) {
    throw new Error('Failed to download file from S3')
  }

  try {
    // 1. obtain the pdf -> download and read from pdf
    const loader = new PDFLoader(file_name)
    const pages = (await loader.load()) as PDFPage[]

    // 2. split the pdf into chunks -> chunk the pdf into smaller pieces

    const chunkedDocs = await Promise.all(pages.map(prepareDocuments))

    // 3. vectorize and embed the chunks -> vectorize the chunks and store them in pinecone

    return pages
  } catch (error) {
    console.error('Error loading PDF:', error)
    throw error
  }
}

export const truncateStringByBytes = (str: string, maxBytes: number) => {
  const encoder = new TextEncoder()
  return new TextDecoder('utf-8').decode(encoder.encode(str).slice(0, maxBytes))
}

async function prepareDocuments(page: PDFPage) {
  let { pageContent, metadata } = page
  pageContent = pageContent.replace(/\n/g, ' ').replace(/\s+/g, ' ')
  const textSplitter = new RecursiveCharacterTextSplitter()
  const docs = await textSplitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 30000),
      },
    }),
  ])

  return docs
}
