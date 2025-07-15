import { NextRequest, NextResponse } from 'next/server'

interface MerchanticRequest {
  email: string
  amount: number // in dollars (e.g. 10.00)
  ccnumber: string // e.g. "4111111111111111"
  ccexp: string // MMYY (e.g. "1225")
  cvv: string // "123"
}

interface MerchanticResponse {
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
    const { email, amount, ccnumber, ccexp, cvv }: MerchanticRequest = await req.json()

    // Validate required fields
    if (!email || !amount || !ccnumber || !ccexp || !cvv) {
      return NextResponse.json({ 
        success: false, 
        response: 'All fields are required: email, amount, ccnumber, ccexp, cvv' 
      }, { status: 400 })
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        response: 'Amount must be a positive number' 
      }, { status: 400 })
    }

    // Validate card number (basic check)
    if (!/^\d{13,19}$/.test(ccnumber.replace(/\s/g, ''))) {
      return NextResponse.json({ 
        success: false, 
        response: 'Invalid card number format' 
      }, { status: 400 })
    }

    // Validate expiry (MMYY format)
    if (!/^\d{2}\d{2}$/.test(ccexp)) {
      return NextResponse.json({ 
        success: false, 
        response: 'Invalid expiry format. Use MMYY (e.g., "1225")' 
      }, { status: 400 })
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json({ 
        success: false, 
        response: 'Invalid CVV format' 
      }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.MERCHANT_USERNAME || !process.env.MERCHANT_PASSWORD || !process.env.MERCHANT_GATEWAY_URL) {
      console.error('Merchantic environment variables are not set')
      return NextResponse.json({ 
        success: false, 
        response: 'Server configuration error' 
      }, { status: 500 })
    }

    console.log('🔐 Processing Merchantic payment:', {
      email,
      amount: `$${amount.toFixed(2)}`,
      cardNumber: `${ccnumber.substring(0, 4)}••••••••${ccnumber.substring(-4)}`
    })

    // Prepare Merchantic API request
    const merchanticRequestData = new URLSearchParams({
      username: process.env.MERCHANT_USERNAME,
      password: process.env.MERCHANT_PASSWORD,
      type: 'sale',
      ccnumber: ccnumber.replace(/\s/g, ''),
      ccexp: ccexp,
      cvv: cvv,
      amount: amount.toFixed(2),
      currency: 'usd',
      orderid: `MERCHANTIC_${Date.now()}_${email}`,
      orderdescription: `Payment for ${email}`,
      email: email,
      ipaddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    })

    // Make request to Merchantic API
    const merchanticResponse = await fetch(process.env.MERCHANT_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: merchanticRequestData.toString()
    })

    if (!merchanticResponse.ok) {
      console.error('❌ Merchantic API request failed:', merchanticResponse.status, merchanticResponse.statusText)
      return NextResponse.json({ 
        success: false, 
        response: 'Payment gateway error' 
      }, { status: 500 })
    }

    const merchanticResponseText = await merchanticResponse.text()
    console.log('📡 Merchantic API response:', merchanticResponseText)

    // Parse Merchantic response
    const responseParams = new URLSearchParams(merchanticResponseText)
    const response: MerchanticResponse = {
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
      console.log('✅ Merchantic payment successful:', response.transactionid)
      
      return NextResponse.json({ 
        success: true, 
        transaction_id: response.transactionid,
        response: response.responsetext || 'Payment successful'
      }, { status: 200 })

    } else {
      console.error('❌ Merchantic payment failed:', response.responsetext)
      return NextResponse.json({ 
        success: false, 
        response: response.responsetext || 'Payment failed'
      }, { status: 400 })
    }

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('❌ Merchantic API error:', errorMessage)
    return NextResponse.json({ 
      success: false, 
      response: errorMessage
    }, { status: 500 })
  }
} 