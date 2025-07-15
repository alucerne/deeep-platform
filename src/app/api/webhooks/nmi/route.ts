import { NextRequest, NextResponse } from 'next/server'

// Disable automatic body parsing for webhook
export const config = {
  api: {
    bodyParser: false,
  },
}

interface NMIWebhookData {
  response: string
  responsetext: string
  authcode: string
  transactionid: string
  avsresponse: string
  cvvresponse: string
  orderid: string
  type: string
  response_code: string
  amount: string
  currency: string
  firstname: string
  lastname: string
  email: string
  ipaddress: string
  // Custom fields we'll add
  api_key?: string
  credits?: string
}

export async function POST(req: NextRequest) {
  console.log('🔔 NMI Webhook received:', req.method, req.url)
  
  try {
    // Get the raw body
    const rawBody = await req.text()
    console.log('📝 NMI Webhook raw body:', rawBody)

    // Parse the form data
    const formData = new URLSearchParams(rawBody)
    
    // Extract webhook data
    const webhookData: NMIWebhookData = {
      response: formData.get('response') || '',
      responsetext: formData.get('responsetext') || '',
      authcode: formData.get('authcode') || '',
      transactionid: formData.get('transactionid') || '',
      avsresponse: formData.get('avsresponse') || '',
      cvvresponse: formData.get('cvvresponse') || '',
      orderid: formData.get('orderid') || '',
      type: formData.get('type') || '',
      response_code: formData.get('response_code') || '',
      amount: formData.get('amount') || '',
      currency: formData.get('currency') || '',
      firstname: formData.get('firstname') || '',
      lastname: formData.get('lastname') || '',
      email: formData.get('email') || '',
      ipaddress: formData.get('ipaddress') || '',
      api_key: formData.get('api_key') || '',
      credits: formData.get('credits') || ''
    }

    console.log('📋 NMI Webhook parsed data:', {
      transactionid: webhookData.transactionid,
      response: webhookData.response,
      responsetext: webhookData.responsetext,
      orderid: webhookData.orderid,
      amount: webhookData.amount,
      api_key: webhookData.api_key ? `${webhookData.api_key.substring(0, 8)}...` : 'Missing',
      credits: webhookData.credits
    })

    // Check if payment was successful
    if (webhookData.response === '1') {
      console.log('✅ NMI payment successful:', webhookData.transactionid)
      
      // Extract API key and credits from order ID or custom fields
      let api_key = webhookData.api_key
      let credits = webhookData.credits ? parseInt(webhookData.credits) : 0

      // If not in custom fields, try to extract from order ID
      if (!api_key && webhookData.orderid) {
        const orderParts = webhookData.orderid.split('_')
        if (orderParts.length >= 3) {
          api_key = orderParts[2] // Format: DEEEP_timestamp_api_key
        }
      }

      if (!api_key) {
        console.error('❌ No API key found in webhook data')
        return NextResponse.json({ error: 'No API key found' }, { status: 400 })
      }

      if (!credits || credits <= 0) {
        console.error('❌ No valid credits amount found in webhook data')
        return NextResponse.json({ error: 'No valid credits amount found' }, { status: 400 })
      }

      console.log('🎯 About to add', credits, 'credits to API key:', api_key.substring(0, 8) + '...')
      
      // Add credits to DEEEP API
      try {
        console.log('🌐 Calling DEEEP API to add credits...')
        const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/addcredits', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key,
            credits: credits
          })
        })
        
        console.log('📡 DEEEP API response status:', deeepRes.status)
        
        if (!deeepRes.ok) {
          const errorText = await deeepRes.text()
          console.error('❌ DEEEP API error when adding credits:', deeepRes.status, errorText)
          return NextResponse.json({ 
            error: `Failed to add credits to DEEEP: ${errorText}` 
          }, { status: 500 })
        }
        
        const responseText = await deeepRes.text()
        console.log('✅ Credits added successfully to DEEEP:', responseText)

        // TODO: Store transaction in database for payment history
        // This would involve creating a transactions table and storing:
        // - transaction_id
        // - api_key
        // - credits
        // - amount
        // - status
        // - created_at
        
      } catch (error) {
        console.error('❌ Error adding credits to DEEEP:', error)
        return NextResponse.json({ 
          error: 'Failed to add credits to DEEEP' 
        }, { status: 500 })
      }

    } else {
      console.error('❌ NMI payment failed:', webhookData.responsetext)
      // Payment failed - log for monitoring but don't add credits
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ NMI webhook error:', errorMessage)
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }
} 