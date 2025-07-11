// app/api/create-api-key/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  // Validate environment variables
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
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Call DEEEP API to generate a new user
    const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/newuser', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        initial_credits: 1000
      })
    })

    if (!deeepRes.ok) {
      const errorText = await deeepRes.text()
      console.error('DEEEP API error:', deeepRes.status, errorText)
      return NextResponse.json({ error: `DEEEP API error: ${errorText}` }, { status: 500 })
    }

    const deeepData = await deeepRes.json()
    console.log('DEEEP API response:', deeepData)
    
    // Extract api_key and customer_link from response
    const api_key = deeepData.api_key || deeepData.apiKey || deeepData.key
    const customer_link = deeepData.customer_link || deeepData.customerLink || deeepData.link
    
    if (!api_key) {
      console.error('No api_key found in DEEEP response:', deeepData)
      return NextResponse.json({ 
        error: 'DEEEP API did not return an API key. Response: ' + JSON.stringify(deeepData) 
      }, { status: 500 })
    }

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized or user not found' }, { status: 401 })
    }

    // Insert the API key into Supabase
    const { data, error } = await supabase
      .from('deeep_api_keys')
      .insert([
        {
          user_id: user.id,
          email,
          api_key,
          customer_link
        }
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Supabase insert error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, apiKey: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
