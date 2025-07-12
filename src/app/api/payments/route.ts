import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    // Validate environment variable
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Initialize Stripe client inside the function
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' })

    const sessions = await stripe.checkout.sessions.list({ limit: 50 })
    const payments = sessions.data.filter(
      (s) => s.payment_status === 'paid' && s.metadata?.credits && s.metadata?.api_key
    )
    return NextResponse.json({ payments }, { status: 200 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 