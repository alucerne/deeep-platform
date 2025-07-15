import { NextResponse } from 'next/server'

// For now, we'll return an empty array since NMI doesn't provide a direct API for transaction history
// In a production environment, you would store transaction data in your database
export async function GET() {
  try {
    // TODO: Implement database storage for NMI transactions
    // For now, return empty array
    return NextResponse.json({ 
      payments: [],
      message: 'Payment history will be available once transactions are stored in database'
    }, { status: 200 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 