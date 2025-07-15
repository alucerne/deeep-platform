import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔐 Testing Merchantic API connection...')

    // Validate environment variables
    if (!process.env.MERCHANT_USERNAME || !process.env.MERCHANT_PASSWORD || !process.env.MERCHANT_GATEWAY_URL) {
      console.error('❌ Merchantic environment variables are not set')
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'Merchantic environment variables are not configured'
      }, { status: 500 })
    }

    // Prepare test request data
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
      orderdescription: 'Test transaction'
    })

    // Make test request to Merchantic API
    const response = await fetch(process.env.MERCHANT_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: testData.toString()
    })

    if (!response.ok) {
      console.error('❌ Merchantic API request failed:', response.status, response.statusText)
      return NextResponse.json({ 
        error: 'Payment gateway error',
        status: response.status,
        statusText: response.statusText
      }, { status: 500 })
    }

    const responseText = await response.text()
    console.log('📡 Merchantic test response:', responseText)

    // Parse response
    const responseParams = new URLSearchParams(responseText)
    const responseCode = responseParams.get('response')
    const responseText_ = responseParams.get('responsetext')

    if (responseCode === '1') {
      return NextResponse.json({ 
        success: true,
        message: 'Merchantic API connection successful',
        response: responseText_
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Merchantic API connection failed',
        response: responseText_,
        response_code: responseCode
      }, { status: 400 })
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('❌ Merchantic test error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 