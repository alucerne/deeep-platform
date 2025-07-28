import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    // Parse request body
    const body = await req.json()
    const { user_email } = body

    // Validate email is provided
    if (!user_email) {
      return new Response(JSON.stringify({ error: 'user_email is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('api_users')
      .select('api_key, credits')
      .eq('user_email', user_email)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // If user already exists, return existing key
    if (existingUser) {
      return new Response(JSON.stringify({ 
        error: 'User already exists',
        api_key: existingUser.api_key,
        credits: existingUser.credits
      }), {
        status: 409,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Generate new API key with UUID
    const uuid = crypto.randomUUID()
    const api_key = `user_${uuid}`

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('api_users')
      .insert({
        user_email,
        api_key,
        credits: 0
      })
      .select('api_key, credits')
      .single()

    if (insertError) {
      console.error('Error inserting new user:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      api_key: newUser.api_key,
      credits: newUser.credits
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error in generate-key function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}) 