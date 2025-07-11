// app/api/get-credits/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

interface CreditInfo {
  email: string
  api_key: string
  credits: number
}

export async function GET(req: NextRequest) {
  // Validate environment variable
  if (!process.env.DEEEP_BEARER_TOKEN) {
    console.error('DEEEP_BEARER_TOKEN environment variable is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Create Supabase client with user's authorization header
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') || ''
        }
      }
    }
  )

  try {
    // Get the currently logged-in user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query the deeep_api_keys table for the user's API keys
    const { data: apiKeys, error: dbError } = await supabase
      .from('deeep_api_keys')
      .select('email, api_key, customer_link')
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Supabase query error:', dbError)
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({ credits: [] }, { status: 200 })
    }

    // Fetch credits for each API key
    const creditPromises = apiKeys.map(async (apiKey) => {
      if (!apiKey.customer_link) {
        return {
          email: apiKey.email,
          api_key: apiKey.api_key,
          credits: 0,
          error: 'No customer link available'
        }
      }

      try {
        const deeepRes = await fetch(
          `https://al-api.proxy4smtp.com/audlabserviceusers/getuser/${encodeURIComponent(apiKey.customer_link)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!deeepRes.ok) {
          console.error(`DEEEP API error for ${apiKey.email}:`, deeepRes.status)
          return {
            email: apiKey.email,
            api_key: apiKey.api_key,
            credits: 0,
            error: `DEEEP API error: ${deeepRes.status}`
          }
        }

        const deeepData = await deeepRes.json()

        // Extract credits from DEEEP response - check api_keys array first
        let credits = 0
        if (deeepData.api_keys && Array.isArray(deeepData.api_keys)) {
          const matchingApiKey = deeepData.api_keys.find((key: any) => key.api_key === apiKey.api_key)
          if (matchingApiKey && matchingApiKey.credits) {
            credits = parseInt(matchingApiKey.credits) || 0
          }
        }
        
        // Fallback to direct field access if api_keys structure not found
        if (credits === 0) {
          credits = deeepData.credits || deeepData.Credits || deeepData.credit || deeepData.credit_balance || deeepData.balance || 0
        }

        return {
          email: apiKey.email,
          api_key: apiKey.api_key,
          credits: typeof credits === 'number' ? credits : 0
        }
      } catch (error) {
        console.error(`Error fetching credits for ${apiKey.email}:`, error)
        return {
          email: apiKey.email,
          api_key: apiKey.api_key,
          credits: 0,
          error: 'Failed to fetch credits'
        }
      }
    })

    const creditResults = await Promise.all(creditPromises)

    return NextResponse.json({ 
      success: true, 
      credits: creditResults 
    }, { status: 200 })

  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ 
      error: err.message || 'Internal server error' 
    }, { status: 500 })
  }
} 