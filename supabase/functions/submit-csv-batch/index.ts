import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

// For demo purposes, we'll simulate the InstantEmail API
// In production, this would be a real API endpoint
const SIMULATE_INSTANT_EMAIL_API = true

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
    const { api_key, emails } = body

    // Validate required fields
    if (!api_key) {
      return new Response(JSON.stringify({ error: 'api_key is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'emails array is required and must not be empty' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter(email => !emailRegex.test(email.trim()))
    if (invalidEmails.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format detected',
        invalid_emails: invalidEmails.slice(0, 5) // Show first 5 invalid emails
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Look up user by API key
    const { data: user, error: userError } = await supabase
      .from('api_users')
      .select('id, user_email, credits')
      .eq('api_key', api_key)
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
    const webhookUrl = `${supabaseUrl.replace('.supabase.co', '.functions.supabase.co')}/email-webhook`

    // Generate a unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('Processing InstantEmail batch:', {
      emails_count: emails.length,
      user_id: user.id,
      request_id: requestId,
      webhook_url: webhookUrl
    })

    // Simulate InstantEmail API response
    let instantEmailData
    if (SIMULATE_INSTANT_EMAIL_API) {
      // Simulate successful API response
      instantEmailData = {
        request_id: requestId,
        status: 'processing',
        estimated_time_minutes: Math.max(1, Math.floor(emails.length / 100)), // 1 minute per 100 emails
        message: 'Batch accepted for processing'
      }
      
      console.log('Simulated InstantEmail API response:', instantEmailData)
    } else {
      // This would be the real API call (commented out for demo)
      /*
      const instantEmailPayload = {
        emails: emails,
        webhook_url: webhookUrl,
        user_id: user.id
      }

      const instantEmailResponse = await fetch('https://api.instantemail.org/', {
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

      instantEmailData = await instantEmailResponse.json()
      */
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

    // Simulate webhook call after a short delay (for demo purposes)
    if (SIMULATE_INSTANT_EMAIL_API) {
      setTimeout(async () => {
        try {
          // Simulate webhook call to mark batch as complete
          const webhookPayload = {
            request_id: requestId,
            download_url: `https://example.com/results/${requestId}.csv`,
            summary: {
              total_emails: emails.length,
              valid_emails: Math.floor(emails.length * 0.85), // Simulate 85% valid
              invalid_emails: Math.floor(emails.length * 0.15), // Simulate 15% invalid
              processing_time_seconds: Math.floor(emails.length * 0.1) // 0.1 seconds per email
            }
          }

          console.log('Simulating webhook call:', webhookPayload)

          // Call our own webhook function
          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
          })

          if (webhookResponse.ok) {
            console.log('Webhook simulation successful')
          } else {
            console.error('Webhook simulation failed:', await webhookResponse.text())
          }
        } catch (error) {
          console.error('Error in webhook simulation:', error)
        }
      }, 5000) // 5 second delay for demo
    }

    // Return success response
    return new Response(JSON.stringify({
      request_id: requestId,
      batch_id: batchData.id,
      emails_submitted: emails.length,
      credits_deducted: emails.length,
      remaining_credits: newCredits,
      estimated_time_minutes: instantEmailData.estimated_time_minutes || 2,
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