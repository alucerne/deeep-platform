import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const ADMIN_SECRET = Deno.env.get("SUPABASE_ADMIN_SECRET")

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
    // Check admin authentication
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

    const providedSecret = authHeader.replace('Bearer ', '')
    
    // Verify admin secret
    if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: 'Admin access denied' }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Parse request body
    const body = await req.json()
    const { user_email, credits } = body

    // Validate input
    if (!user_email || typeof user_email !== 'string') {
      return new Response(JSON.stringify({ error: 'user_email is required and must be a string' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (typeof credits !== 'number' || credits < 0) {
      return new Response(JSON.stringify({ error: 'credits must be a non-negative number' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Look up user
    const { data: user, error: userError } = await supabase
      .from('api_users')
      .select('id, user_email, credits')
      .eq('user_email', user_email)
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
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Calculate new credit balance
    const newCredits = user.credits + credits

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('api_users')
      .update({ credits: newCredits })
      .eq('id', user.id)
      .select('user_email, credits')
      .single()

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update credits' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Return success response
    return new Response(JSON.stringify({
      user_email: updatedUser.user_email,
      previous_credits: user.credits,
      credits_added: credits,
      new_balance: updatedUser.credits,
      message: 'Credits updated successfully'
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