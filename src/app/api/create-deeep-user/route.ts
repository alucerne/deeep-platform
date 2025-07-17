// app/api/create-deeep-user/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate environment variable
    if (!process.env.DEEEP_BEARER_TOKEN) {
      console.error('DEEEP_BEARER_TOKEN environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Call DEEEP API to create new user
    const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/newuser', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        initial_credits: 1000
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