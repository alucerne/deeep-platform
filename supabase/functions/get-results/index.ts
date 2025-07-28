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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      .select('id, user_email')
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

    // Parse request_id from query params or body
    let requestId: string

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

    // Look up batch and confirm it belongs to the user
    const { data: batch, error: batchError } = await supabase
      .from('instant_email_batches')
      .select('*')
      .eq('request_id', requestId)
      .eq('api_user_id', user.id)
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
      return new Response(JSON.stringify({ error: 'Batch not found or access denied' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Prepare response based on batch status
    const response: any = {
      request_id: batch.request_id,
      status: batch.status,
      submitted_emails: batch.submitted_emails,
      emails_count: batch.submitted_emails?.length || 0,
      created_at: batch.created_at,
      message: ''
    }

    // Add download_url if batch is complete
    if (batch.status === 'complete' && batch.download_url) {
      response.download_url = batch.download_url
      response.message = 'Batch processing complete'
    } else if (batch.status === 'failed') {
      response.message = 'Batch processing failed'
    } else {
      response.message = 'Batch still processing'
    }

    // Return the response
    return new Response(JSON.stringify(response), {
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