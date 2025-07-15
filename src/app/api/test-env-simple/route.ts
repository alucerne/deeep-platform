import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const envCheck = {
    environment: process.env.NODE_ENV,
    debug_secret_key: {
      exists: !!process.env.DEBUG_SECRET_KEY,
      value: process.env.DEBUG_SECRET_KEY ? `${process.env.DEBUG_SECRET_KEY.substring(0, 4)}...` : 'Not set',
      length: process.env.DEBUG_SECRET_KEY?.length || 0
    },
    merchantic: {
      username: !!process.env.MERCHANT_USERNAME,
      password: !!process.env.MERCHANT_PASSWORD,
      gateway_url: !!process.env.MERCHANT_GATEWAY_URL,
      username_value: process.env.MERCHANT_USERNAME ? `${process.env.MERCHANT_USERNAME.substring(0, 4)}...` : 'Not set'
    },
    deeep: {
      bearer_token: !!process.env.DEEEP_BEARER_TOKEN,
      token_value: process.env.DEEEP_BEARER_TOKEN ? `${process.env.DEEEP_BEARER_TOKEN.substring(0, 8)}...` : 'Not set'
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: 'Simple environment check completed'
  })
} 