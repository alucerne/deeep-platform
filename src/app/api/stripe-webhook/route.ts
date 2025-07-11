import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { buffer } from 'stream/consumers'

// Set this to your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

// Disables automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received:', req.method, req.url)
  
  const rawBody = await req.arrayBuffer()
  const body = Buffer.from(rawBody)
  const sig = req.headers.get('stripe-signature') as string

  console.log('📝 Webhook signature:', sig ? 'Present' : 'Missing')
  console.log('🔑 Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('✅ Webhook signature verified, event type:', event.type)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('✅ Payment success:', session)
    console.log('📋 Session metadata:', session.metadata)
    
    // Extract metadata
    const api_key = session.metadata?.api_key
    const credits = session.metadata?.credits
    
    console.log('🔑 API Key from metadata:', api_key ? `${api_key.substring(0, 8)}...` : 'Missing')
    console.log('💰 Credits from metadata:', credits)
    
    if (!api_key || !credits) {
      console.error('❌ Missing api_key or credits in session metadata')
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
    }
    
    const creditsAmount = parseInt(credits)
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      console.error('❌ Invalid credits amount:', credits)
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }
    
    console.log('🎯 About to add', creditsAmount, 'credits to API key:', api_key.substring(0, 8) + '...')
    
    try {
      // Call DEEEP API to add credits
      console.log('🌐 Calling DEEEP API to add credits...')
      const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/addcredits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key,
          credits: creditsAmount
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
      
    } catch (error) {
      console.error('Error adding credits to DEEEP:', error)
      return NextResponse.json({ 
        error: 'Failed to add credits to DEEEP' 
      }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
} 