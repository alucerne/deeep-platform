import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const INSTANT_EMAIL_API_URL = "https://api.instantemail.org/"

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
    // Get API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authorization header with Bearer token required' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const apiKey = authHeader.replace('Bearer ', '')

    // Look up user by API key
    const { data: user, error: userError } = await supabase
      .from('api_users')
      .select('id, user_email, credits')
      .eq('api_key', apiKey)
      .maybeSingle()

    if (userError) {
      console.error('Error looking up user:', userError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Parse request body
    const body = await req.json()
    const { emails } = body

    // Validate emails array
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'emails array is required and must not be empty' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Check if user has enough credits
    if (user.credits < emails.length) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits',
        required: emails.length,
        available: user.credits
      }), {
        status: 402,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Generate webhook URL for this batch
    const webhookUrl = `${supabaseUrl.replace('.supabase.co', '.functions.supabase.co')}/webhook-handler`

    // Send request to instantemail.org
    const instantEmailPayload = {
      emails: emails,
      webhook_url: webhookUrl,
      user_id: user.id
    }

    console.log('Sending to instantemail.org:', instantEmailPayload)

    const instantEmailResponse = await fetch(INSTANT_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(instantEmailPayload)
    })

    if (!instantEmailResponse.ok) {
      console.error('InstantEmail API error:', await instantEmailResponse.text())
      return new Response(JSON.stringify({ error: 'Failed to submit to email service' }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const instantEmailData = await instantEmailResponse.json()
    const requestId = instantEmailData.request_id

    if (!requestId) {
      return new Response(JSON.stringify({ error: 'No request_id returned from email service' }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Store batch metadata in instant_email_batches table
    const { data: batchData, error: batchError } = await supabase
      .from('instant_email_batches')
      .insert({
        api_user_id: user.id,
        request_id: requestId,
        submitted_emails: emails,
        status: 'processing'
      })
      .select('id, request_id, status')
      .single()

    if (batchError) {
      console.error('Error storing batch:', batchError)
      return new Response(JSON.stringify({ error: 'Failed to store batch metadata' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Deduct credits from user
    const newCredits = user.credits - emails.length
    const { error: updateError } = await supabase
      .from('api_users')
      .update({ credits: newCredits })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      // Note: We don't fail here since the batch was already submitted
    }

    // Return success response
    return new Response(JSON.stringify({
      request_id: requestId,
      batch_id: batchData.id,
      emails_submitted: emails.length,
      credits_deducted: emails.length,
      remaining_credits: newCredits,
      status: 'processing',
      message: 'Batch submitted successfully'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}) 