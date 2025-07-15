import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const envCheck = {
    merchantic: {
      username: !!process.env.MERCHANT_USERNAME,
      password: !!process.env.MERCHANT_PASSWORD,
      gateway_url: !!process.env.MERCHANT_GATEWAY_URL
    },
    deeep: {
      bearer_token: !!process.env.DEEEP_BEARER_TOKEN
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }

  return NextResponse.json({
    success: true,
    environment: process.env.NODE_ENV,
    variables: envCheck,
    message: 'Environment check completed'
  })
} 