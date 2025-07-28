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
        'Access-Control-Allow-Headers': 'Content-Type',
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
    const { user_email, credits } = body

    // Validate required fields
    if (!user_email) {
      return new Response(JSON.stringify({ error: 'user_email is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (credits === undefined || credits === null) {
      return new Response(JSON.stringify({ error: 'credits is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Validate credits is a number
    const creditsNumber = Number(credits)
    if (isNaN(creditsNumber)) {
      return new Response(JSON.stringify({ error: 'credits must be a valid number' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('api_users')
      .select('credits')
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

    // If user doesn't exist, return error
    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Calculate new credits balance
    const currentCredits = existingUser.credits || 0
    const newCredits = currentCredits + creditsNumber

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('api_users')
      .update({ credits: newCredits })
      .eq('user_email', user_email)
      .select('credits')
      .single()

    if (updateError) {
      console.error('Error updating user credits:', updateError)
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
      user_email,
      previous_credits: currentCredits,
      credits_added: creditsNumber,
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