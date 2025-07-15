import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    environment: process.env.NODE_ENV,
    nmi_required_vars: {
      MERCHANT_USERNAME: {
        exists: !!process.env.MERCHANT_USERNAME,
        value: process.env.MERCHANT_USERNAME ? `${process.env.MERCHANT_USERNAME.substring(0, 4)}...` : 'Not set',
        length: process.env.MERCHANT_USERNAME?.length || 0
      },
      MERCHANT_PASSWORD: {
        exists: !!process.env.MERCHANT_PASSWORD,
        value: process.env.MERCHANT_PASSWORD ? `${process.env.MERCHANT_PASSWORD.substring(0, 4)}...` : 'Not set',
        length: process.env.MERCHANT_PASSWORD?.length || 0
      },
      MERCHANT_GATEWAY_URL: {
        exists: !!process.env.MERCHANT_GATEWAY_URL,
        value: process.env.MERCHANT_GATEWAY_URL || 'Not set',
        length: process.env.MERCHANT_GATEWAY_URL?.length || 0
      }
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: envCheck,
    message: 'NMI environment check completed'
  })
} 