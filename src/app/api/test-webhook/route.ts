import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    console.log('🧪 Test webhook received:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received successfully',
      body: body
    }, { status: 200 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 