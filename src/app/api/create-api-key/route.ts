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

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized or user not found' }, { status: 401 })
    }

    // First, check if we already have an API key for this user in Supabase
    const { data: existingKey, error: existingKeyError } = await supabase
      .from('deeep_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .single()

    if (existingKey && !existingKeyError) {
      console.log('✅ Found existing API key for user:', existingKey.api_key.substring(0, 8) + '...')
      return NextResponse.json({ 
        success: true, 
        apiKey: existingKey,
        message: 'Using existing API key'
      }, { status: 200 })
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

    const deeepData = await deeepRes.json()
    console.log('DEEEP API response:', deeepData)
    
    let api_key: string | undefined
    let customer_link: string | undefined

    if (deeepRes.ok) {
      // Extract api_key and customer_link from response
      api_key = deeepData.api_key || deeepData.apiKey || deeepData.key
      customer_link = deeepData.customer_link || deeepData.customerLink || deeepData.link
    } else if (deeepData.Message === 'User exists') {
      // User already exists, but we can't retrieve their API key without a customer_link
      console.log('User exists but cannot retrieve API key without customer_link')
      
      return NextResponse.json({ 
        error: 'User already exists in DEEEP system but API key cannot be retrieved automatically. Please contact support to get your API key or try creating a new account with a different email.',
        details: 'The DEEEP API requires a customer_link to retrieve existing user information, which is not available for users created through this interface.'
      }, { status: 400 })
    }
    
    if (!api_key) {
      console.error('No api_key found in DEEEP response:', deeepData)
      return NextResponse.json({ 
        error: 'DEEEP API did not return an API key. Response: ' + JSON.stringify(deeepData) 
      }, { status: 500 })
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
      // If insert fails due to duplicate, try to get the existing record
      if (error.code === '23505') { // Unique constraint violation
        const { data: existingData, error: selectError } = await supabase
          .from('deeep_api_keys')
          .select('*')
          .eq('user_id', user.id)
          .eq('email', email)
          .single()

        if (existingData && !selectError) {
          return NextResponse.json({ 
            success: true, 
            apiKey: existingData,
            message: 'API key already exists'
          }, { status: 200 })
        }
      }
      
      return NextResponse.json({ error: `Supabase insert error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, apiKey: data }, { status: 200 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
