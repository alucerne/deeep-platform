// app/api/create-checkout-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })

export async function POST(req: NextRequest) {
  try {
    const { credits, api_key } = await req.json()

    // Validate required fields
    if (!credits || typeof credits !== 'number' || credits < 1000) {
      return NextResponse.json({ error: 'Valid credits amount (minimum 1000) is required' }, { status: 400 })
    }

    if (!api_key || typeof api_key !== 'string') {
      return NextResponse.json({ error: 'Valid API key is required' }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('NEXT_PUBLIC_SITE_URL environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Calculate price: $5 per 1000 credits
    const price = (credits / 1000) * 5

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `${credits.toLocaleString()} DEEEP Credits`,
            description: `Credit bundle for API key: ${api_key.substring(0, 8)}...`
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      metadata: {
        api_key,
        credits: credits.toString()
      }
    })

    return NextResponse.json({ 
      success: true, 
      url: session.url 
    }, { status: 200 })

  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ 
      error: err.message || 'Internal server error' 
    }, { status: 500 })
  }
} 