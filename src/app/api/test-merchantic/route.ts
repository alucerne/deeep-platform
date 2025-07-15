import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Check if environment variables are set
    if (!process.env.MERCHANT_USERNAME || !process.env.MERCHANT_PASSWORD || !process.env.MERCHANT_GATEWAY_URL) {
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error - Missing environment variables',
        missing: {
          username: !process.env.MERCHANT_USERNAME,
          password: !process.env.MERCHANT_PASSWORD,
          gateway_url: !process.env.MERCHANT_GATEWAY_URL
        }
      }, { status: 500 })
    }

    // Test with a minimal request to Merchantic
    const testData = new URLSearchParams({
      username: process.env.MERCHANT_USERNAME,
      password: process.env.MERCHANT_PASSWORD,
      type: 'sale',
      ccnumber: '4111111111111111',
      ccexp: '1225',
      cvv: '123',
      amount: '1.00',
      currency: 'usd',
      orderid: `TEST_${Date.now()}`,
      orderdescription: 'Test payment',
      email: 'test@example.com'
    })

    console.log('🔐 Testing Merchantic API connection...')

    const response = await fetch(process.env.MERCHANT_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testData.toString()
    })

    const responseText = await response.text()
    console.log('📡 Merchantic test response:', responseText)

    // Parse the response
    const responseParams = new URLSearchParams(responseText)
    const responseCode = responseParams.get('response')
    const responseText_parsed = responseParams.get('responsetext')

    return NextResponse.json({
      success: true,
      message: 'Merchantic API test completed',
      response_code: responseCode,
      response_text: responseText_parsed,
      environment: process.env.NODE_ENV,
      gateway_url: process.env.MERCHANT_GATEWAY_URL ? 'Set' : 'Not set'
    })

  } catch (error) {
    console.error('❌ Merchantic test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
} 