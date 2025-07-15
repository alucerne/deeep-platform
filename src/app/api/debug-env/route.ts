import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Only allow this in development or with a secret key
  const authHeader = req.headers.get('authorization')
  const isAuthorized = process.env.NODE_ENV === 'development' || 
                      authHeader === `Bearer ${process.env.DEBUG_SECRET_KEY}`

  if (!isAuthorized) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: 'This endpoint is only available in development or with proper authorization'
    }, { status: 401 })
  }

  const envCheck = {
    environment: process.env.NODE_ENV,
    merchantic: {
      username: !!process.env.MERCHANT_USERNAME,
      password: !!process.env.MERCHANT_PASSWORD,
      gateway_url: !!process.env.MERCHANT_GATEWAY_URL,
      username_value: process.env.MERCHANT_USERNAME ? `${process.env.MERCHANT_USERNAME.substring(0, 4)}...` : 'Not set'
    },
    deeep: {
      bearer_token: !!process.env.DEEEP_BEARER_TOKEN,
      token_value: process.env.DEEEP_BEARER_TOKEN ? `${process.env.DEEEP_BEARER_TOKEN.substring(0, 8)}...` : 'Not set'
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: 'Environment check completed'
  })
} 