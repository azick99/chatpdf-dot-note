import { loadS3IntoPinecone } from '@/lib/pinecone'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { file_key, file_name } = body

    console.log('Received file_key:', file_key, 'file_name:', file_name)
    const pages = await loadS3IntoPinecone(file_key)
    // Format the response to include only text and metadata
    const formattedPages = pages.map((page) => ({
      text: page.pageContent,
      pageNumber: page.metadata?.pageNumber || null,
    }))
    return NextResponse.json({ pages: formattedPages })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
