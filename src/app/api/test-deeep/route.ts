// app/api/test-deeep/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { api_key, credits } = await req.json()

    console.log('🧪 Testing DEEEP API with:', { api_key: api_key?.substring(0, 8) + '...', credits })

    if (!api_key || !credits) {
      return NextResponse.json({ error: 'API key and credits are required' }, { status: 400 })
    }

    // Call DEEEP API to add credits
    const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/addcredits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key,
        credits: parseInt(credits)
      })
    })

    const responseText = await deeepRes.text()
    console.log('📡 DEEEP API response:', deeepRes.status, responseText)

    if (!deeepRes.ok) {
      return NextResponse.json({ 
        error: `DEEEP API error: ${responseText}`,
        status: deeepRes.status
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: responseText,
      status: deeepRes.status
    }, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('Test API error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 