import { loadS3IntoPinecone } from '@/lib/pinecone'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { file_key} = body

    const pages = await loadS3IntoPinecone(file_key)
    // Format the response to include only text and metadata
    const formattedPages = pages.map((page) => ({
      pageContent: page.pageContent,
      pageNumber: page.metadata.loc.pageNumber,
    }))
    return NextResponse.json({ pages: formattedPages })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      { error: error || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
