import { Pinecone } from '@pinecone-database/pinecone'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'
import os from 'os'

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

export async function downloadFileFromS3(
  file_key: string
): Promise<string | null> {
  try {
    console.log('Downloading file with key:', file_key)
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: file_key,
    })

    const { Body } = await s3Client.send(command)
    if (!Body) {
      throw new Error('No data returned from S3')
    }

    const filePath = path.join(
      os.tmpdir(),
      `s3-${Date.now()}-${file_key.split('/').pop()}`
    )
    const fileStream = fs.createWriteStream(filePath)
    await new Promise((resolve, reject) => {
      Body.pipe(fileStream).on('error', reject).on('close', resolve)
    })

    console.log('File downloaded to:', filePath)
    return filePath
  } catch (error) {
    console.error('Error downloading file from S3:', error)
    return null
  }
}

export async function loadS3IntoPinecone(file_key: string) {
  console.log('Downloading file from S3...')
  const file_name = await downloadFileFromS3(file_key)
  if (!file_name) {
    throw new Error('Failed to download file from S3')
  }

  console.log('Loading PDF from:', file_name)
  try {
    const loader = new PDFLoader(file_name)
    const pages = await loader.load()
    console.log(
      'Loaded pages:',
      pages.map((page) => ({
        pageContent: page.pageContent,
        metadata: page.metadata,
      }))
    )
    return pages
  } catch (error) {
    console.error('Error loading PDF:', error)
    throw error
  }
}
