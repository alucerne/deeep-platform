// app/api/submit-batch/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { api_key, emails, callback_url } = await req.json()

    if (!api_key) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Emails array is required' }, { status: 400 })
    }

    if (!callback_url) {
      return NextResponse.json({ error: 'Callback URL is required' }, { status: 400 })
    }

    // Call DEEEP API to submit batch
    const deeepRes = await fetch(`https://al-api.proxy4smtp.com/audlabapi/${api_key}/email-validate-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callback_url,
        items: emails.join(',')
      })
    })

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

    return NextResponse.json(responseData, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('API error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 