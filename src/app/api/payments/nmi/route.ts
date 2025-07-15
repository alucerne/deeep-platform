import { NextRequest, NextResponse } from 'next/server'

interface NMIPaymentRequest {
  credits: number
  api_key: string
  card_number: string
  card_expiry: string
  card_cvv: string
  card_holder_name: string
  billing_address: {
    first_name: string
    last_name: string
    address1: string
    city: string
    state: string
    zip: string
    country: string
  }
}

interface NMIResponse {
  response: string
  responsetext: string
  authcode: string
  transactionid: string
  avsresponse: string
  cvvresponse: string
  orderid: string
  type: string
  response_code: string
}

export async function POST(req: NextRequest) {
  try {
    const { credits, api_key, card_number, card_expiry, card_cvv, card_holder_name, billing_address }: NMIPaymentRequest = await req.json()

    // Validate required fields
    if (!credits || typeof credits !== 'number' || credits < 1000) {
      return NextResponse.json({ error: 'Valid credits amount (minimum 1000) is required' }, { status: 400 })
    }

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'Valid API key is required' }, { status: 400 })
    }

    if (!card_number || !card_expiry || !card_cvv || !card_holder_name) {
      return NextResponse.json({ error: 'All card details are required' }, { status: 400 })
    }

    if (!billing_address) {
      return NextResponse.json({ error: 'Billing address is required' }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.MERCHANT_USERNAME || !process.env.MERCHANT_PASSWORD || !process.env.MERCHANT_GATEWAY_URL) {
      console.error('NMI environment variables are not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Calculate price: $0.0005 per credit
    const price = credits * 0.0005

    // Parse card expiry (MM/YY format)
    const [expiryMonth, expiryYear] = card_expiry.split('/')
    if (!expiryMonth || !expiryYear) {
      return NextResponse.json({ error: 'Invalid card expiry format. Use MM/YY' }, { status: 400 })
    }

    // Prepare NMI API request
    const nmiRequestData = new URLSearchParams({
      username: process.env.MERCHANT_USERNAME,
      password: process.env.MERCHANT_PASSWORD,
      type: 'sale',
      ccnumber: card_number.replace(/\s/g, ''),
      ccexp: `${expiryMonth}${expiryYear}`,
      cvv: card_cvv,
      amount: price.toFixed(2),
      currency: 'usd',
      orderid: `DEEEP_${Date.now()}_${api_key}`,
      orderdescription: `${credits.toLocaleString()} DEEEP Credits`,
      firstname: billing_address.first_name,
      lastname: billing_address.last_name,
      address1: billing_address.address1,
      city: billing_address.city,
      state: billing_address.state,
      zip: billing_address.zip,
      country: billing_address.country,
      email: card_holder_name, // Using card holder name as email placeholder
      ipaddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      // Add webhook URL for payment confirmation
      webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/nmi`,
      // Add custom fields for webhook processing
      api_key: api_key,
      credits: credits.toString()
    })

    console.log('🔐 Processing NMI payment for:', {
      credits: credits.toLocaleString(),
      amount: `$${price.toFixed(2)}`,
      api_key: `${api_key.substring(0, 8)}...`
    })

    // Make request to NMI API
    const nmiResponse = await fetch(process.env.MERCHANT_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: nmiRequestData.toString()
    })

    if (!nmiResponse.ok) {
      console.error('❌ NMI API request failed:', nmiResponse.status, nmiResponse.statusText)
      return NextResponse.json({ 
        error: 'Payment gateway error' 
      }, { status: 500 })
    }

    const nmiResponseText = await nmiResponse.text()
    console.log('📡 NMI API response:', nmiResponseText)

    // Parse NMI response
    const responseParams = new URLSearchParams(nmiResponseText)
    const response: NMIResponse = {
      response: responseParams.get('response') || '',
      responsetext: responseParams.get('responsetext') || '',
      authcode: responseParams.get('authcode') || '',
      transactionid: responseParams.get('transactionid') || '',
      avsresponse: responseParams.get('avsresponse') || '',
      cvvresponse: responseParams.get('cvvresponse') || '',
      orderid: responseParams.get('orderid') || '',
      type: responseParams.get('type') || '',
      response_code: responseParams.get('response_code') || ''
    }

    // Check if payment was successful
    if (response.response === '1') {
      console.log('✅ NMI payment successful:', response.transactionid)
      
      // Payment successful - credits will be added via webhook
      return NextResponse.json({ 
        success: true,
        transaction_id: response.transactionid,
        auth_code: response.authcode,
        credits: credits,
        amount: price,
        message: 'Payment successful! Credits will be added shortly via webhook.'
      }, { status: 200 })

    } else {
      console.error('❌ NMI payment failed:', response.responsetext)
      return NextResponse.json({ 
        error: response.responsetext || 'Payment failed',
        response_code: response.response_code
      }, { status: 400 })
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('❌ NMI API error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 