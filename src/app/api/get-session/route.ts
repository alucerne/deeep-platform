// app/api/get-session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' })

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Validate environment variable
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({ 
      success: true, 
      session 
    }, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('API error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 