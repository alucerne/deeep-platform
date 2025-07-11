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
  const rawBody = await req.arrayBuffer()
  const body = Buffer.from(rawBody)
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('✅ Payment success:', session)
    // TODO: Add logic to increase credits via DEEEP
  }

  return NextResponse.json({ received: true }, { status: 200 })
} 