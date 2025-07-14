import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { api_key, credits } = await req.json()

    // Validate required fields
    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return NextResponse.json({ error: 'Valid credits amount is required' }, { status: 400 })
    }

    // Validate environment variable
    if (!process.env.DEEEP_BEARER_TOKEN) {
      console.error('DEEEP_BEARER_TOKEN environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Call DEEEP API to deduct credits (using negative credits)
    const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/addcredits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key,
        credits: -credits // Negative credits to deduct
      })
    })

    // Get response text first to handle both JSON and error responses
    const responseText = await deeepRes.text()
    
    if (!deeepRes.ok) {
      console.error('DEEEP API error:', deeepRes.status, responseText)
      return NextResponse.json({ 
        error: `DEEEP API error: ${responseText}` 
      }, { status: deeepRes.status })
    }

    // Try to parse as JSON, fallback to text if not JSON
    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { message: responseText }
    }

    console.log('✅ Credits deducted successfully:', { api_key: api_key.substring(0, 8) + '...', credits })

    return NextResponse.json(responseData, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('API error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 