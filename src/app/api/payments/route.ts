import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' })

export async function GET() {
  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 50 })
    const payments = sessions.data.filter(
      (s) => s.payment_status === 'paid' && s.metadata?.credits && s.metadata?.api_key
    )
    return NextResponse.json({ payments }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
} 