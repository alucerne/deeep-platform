import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const INSTANT_EMAIL_STATUS_URL = "https://api.instantemail.org/status/"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    let requestId: string

    // Parse request based on method
    if (req.method === 'GET') {
      const url = new URL(req.url)
      requestId = url.searchParams.get('request_id') || ''
    } else {
      const body = await req.json()
      requestId = body.request_id || ''
    }

    // Validate request_id
    if (!requestId) {
      return new Response(JSON.stringify({ error: 'request_id is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Look up batch in instant_email_batches table
    const { data: batch, error: batchError } = await supabase
      .from('instant_email_batches')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle()

    if (batchError) {
      console.error('Error looking up batch:', batchError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (!batch) {
      return new Response(JSON.stringify({ error: 'Batch not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // If batch is already complete, return current status
    if (batch.status === 'complete' && batch.download_url) {
      return new Response(JSON.stringify({
        request_id: requestId,
        status: batch.status,
        download_url: batch.download_url,
        submitted_emails: batch.submitted_emails,
        created_at: batch.created_at,
        message: 'Batch already complete'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Poll instantemail.org for status
    console.log(`Polling status for request_id: ${requestId}`)
    
    const statusResponse = await fetch(`${INSTANT_EMAIL_STATUS_URL}${requestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!statusResponse.ok) {
      console.error('InstantEmail status API error:', await statusResponse.text())
      return new Response(JSON.stringify({ 
        error: 'Failed to get status from email service',
        request_id: requestId,
        current_status: batch.status
      }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const statusData = await statusResponse.json()
    console.log('Status response:', statusData)

    // Update batch status based on response
    let newStatus = batch.status
    let downloadUrl = batch.download_url

    if (statusData.status === 'complete' && statusData.download_url) {
      newStatus = 'complete'
      downloadUrl = statusData.download_url
    } else if (statusData.status === 'failed') {
      newStatus = 'failed'
    }

    // Update database if status changed
    if (newStatus !== batch.status || downloadUrl !== batch.download_url) {
      const { error: updateError } = await supabase
        .from('instant_email_batches')
        .update({ 
          status: newStatus,
          download_url: downloadUrl
        })
        .eq('request_id', requestId)

      if (updateError) {
        console.error('Error updating batch status:', updateError)
        // Continue anyway to return current status
      }
    }

    // Return updated batch info
    return new Response(JSON.stringify({
      request_id: requestId,
      status: newStatus,
      download_url: downloadUrl,
      submitted_emails: batch.submitted_emails,
      created_at: batch.created_at,
      message: newStatus === 'complete' ? 'Batch processing complete' : 
               newStatus === 'failed' ? 'Batch processing failed' : 
               'Batch still processing'
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