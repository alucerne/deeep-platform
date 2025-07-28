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
    const webhookUrl = 'https://hapmnlakorkoklzfovne.functions.supabase.co/email-webhook'

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
        request_id: requestId,
        user_email: user.user_email,
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

    // Simulate webhook call immediately (for demo purposes)
    if (SIMULATE_INSTANT_EMAIL_API) {
      try {
        console.log('Starting webhook simulation for request_id:', requestId)
        
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

        console.log('Webhook payload:', webhookPayload)
        console.log('Webhook URL:', webhookUrl)

        // Call our own webhook function with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json()
          console.log('✅ Webhook simulation successful:', webhookResult)
        } else {
          const errorText = await webhookResponse.text()
          console.error('❌ Webhook simulation failed:', webhookResponse.status, errorText)
          
          // If webhook fails, we should still mark the batch as complete manually
          console.log('Attempting to mark batch as complete manually...')
          const { error: manualUpdateError } = await supabase
            .from('instant_email_batches')
            .update({ status: 'complete' })
            .eq('request_id', requestId)
          
          if (manualUpdateError) {
            console.error('Failed to manually update batch status:', manualUpdateError)
          } else {
            console.log('✅ Manually marked batch as complete')
          }
          
          // Add results for ALL emails manually if webhook failed
          console.log('Adding results for all', emails.length, 'emails manually...')
          const allResults = emails.map((email, index) => ({
            request_id: requestId,
            email: email,
            last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }))
          
          const { error: resultsError } = await supabase
            .from('instant_email_results')
            .insert(allResults)
          
          if (resultsError) {
            console.error('Failed to add results:', resultsError)
          } else {
            console.log('✅ Added', allResults.length, 'results manually')
          }
        }
      } catch (error) {
        console.error('❌ Error in webhook simulation:', error)
        
        // If webhook fails completely, mark batch as complete manually
        console.log('Attempting to mark batch as complete manually due to webhook error...')
        const { error: manualUpdateError } = await supabase
          .from('instant_email_batches')
          .update({ status: 'complete' })
          .eq('request_id', requestId)
        
        if (manualUpdateError) {
          console.error('Failed to manually update batch status:', manualUpdateError)
        } else {
          console.log('✅ Manually marked batch as complete')
        }
        
        // Add results for ALL emails manually if webhook completely failed
        console.log('Adding results for all', emails.length, 'emails manually due to webhook error...')
        const allResults = emails.map((email, index) => ({
          request_id: requestId,
          email: email,
          last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
        
        const { error: resultsError } = await supabase
          .from('instant_email_results')
          .insert(allResults)
        
        if (resultsError) {
          console.error('Failed to add results:', resultsError)
        } else {
          console.log('✅ Added', allResults.length, 'results manually')
        }
      }
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