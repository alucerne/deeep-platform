import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

// Get API key from environment variable instead of hardcoding
const DEEEP_API_KEY = Deno.env.get("DEEEP_API_KEY") || "p9ebe0g5akukrjgwf0gjy2hgt9mu64zzq"
const DEEEP_API_URL = `https://al-api.proxy4smtp.com/audlabapi/${DEEEP_API_KEY}/email-validate-batch`
const CALLBACK_URL = "https://hapmnlakorkoklzfovne.functions.supabase.co/callback-handler"

serve(async (req) => {
  console.log(`🔔 submit-batch function called: ${req.method} ${req.url}`)
  
  // Handle CORS
  if (req.method === "OPTIONS") {
    console.log(`✅ CORS preflight request handled`)
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    })
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    console.error(`❌ Method not allowed: ${req.method}`)
    return new Response(JSON.stringify({ error: "Method not allowed. Only POST requests are supported." }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    console.log(`📝 Content-Type: ${contentType}`)
    
    if (!contentType.includes('application/json')) {
      console.error(`❌ Unsupported content type: ${contentType}`)
      return new Response(JSON.stringify({ error: "Unsupported content type. Use application/json" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      })
    }

    // Parse JSON body
    let body
    try {
      body = await req.json()
      console.log(`📄 JSON body received:`, body)
    } catch (err) {
      console.error(`❌ JSON parsing error: ${err.message}`)
      return new Response(JSON.stringify({ error: "Invalid JSON format in request body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      })
    }

    // Validate emails array
    if (!body.emails || !Array.isArray(body.emails) || body.emails.length === 0) {
      console.error(`❌ Invalid JSON structure: missing or empty emails array`)
      return new Response(JSON.stringify({ error: "Invalid JSON format. Expected { \"emails\": [\"email1\", \"email2\"] }" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      })
    }

    const emails = body.emails.filter((email: any) => {
      if (typeof email !== 'string') {
        console.warn(`⚠️ Skipping non-string email: ${email}`)
        return false
      }
      if (email.trim() === '') {
        console.warn(`⚠️ Skipping empty email`)
        return false
      }
      return true
    })

    if (emails.length === 0) {
      console.error(`❌ No valid emails found to process`)
      return new Response(JSON.stringify({ error: "No valid emails found to validate" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      })
    }

    console.log(`✅ Processing ${emails.length} valid emails`)

    // Convert emails array to comma-separated string
    const emailsString = emails.join(',')
    console.log(`📧 Emails string: ${emailsString}`)
    
    // Send to DEEEP API with timeout
    console.log(`🚀 Sending request to DEEEP API: ${DEEEP_API_URL}`)
    console.log(`📞 Callback URL: ${CALLBACK_URL}`)
    console.log(`🔑 Using API key: ${DEEEP_API_KEY.substring(0, 8)}...`)
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    let deeepData: any
    
    try {
      const deeepRes = await fetch(DEEEP_API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${Deno.env.get("DEEEP_BEARER_TOKEN") || ""}`
        },
        body: JSON.stringify({
          items: emailsString,
          callback_url: CALLBACK_URL
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log(`📡 DEEEP API response status: ${deeepRes.status}`)

      if (!deeepRes.ok) {
        const errorText = await deeepRes.text()
        console.error(`❌ DEEEP API error: ${deeepRes.status} - ${errorText}`)
        return new Response(JSON.stringify({ 
          error: "DEEEP API error", 
          status: deeepRes.status,
          details: errorText 
        }), {
          status: 502,
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*" 
          }
        })
      }

      deeepData = await deeepRes.json()
      console.log(`📄 DEEEP API response:`, deeepData)
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error(`❌ DEEEP API request timed out after 30 seconds`)
        return new Response(JSON.stringify({ 
          error: "DEEEP API request timed out",
          details: "The request took longer than 30 seconds to complete"
        }), {
          status: 504,
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*" 
          }
        })
      }
      console.error(`❌ DEEEP API fetch error:`, fetchError)
      return new Response(JSON.stringify({ 
        error: "DEEEP API connection error",
        details: fetchError.message 
      }), {
        status: 502,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    const batch_id = deeepData.batch_id
    if (!batch_id) {
      console.error(`❌ No batch_id in DEEEP API response`)
      return new Response(JSON.stringify({ 
        error: "No batch_id received from DEEEP API",
        response: deeepData
      }), {
        status: 502,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    console.log(`✅ Received batch_id: ${batch_id}`)

    // Store in email_batches table
    console.log(`💾 Storing batch_id in database`)
    const { error: dbError } = await supabase
      .from("email_batches")
      .insert([{ 
        batch_id, 
        status: "processing" 
      }])

    if (dbError) {
      console.error(`❌ Database insert error:`, dbError)
      return new Response(JSON.stringify({ 
        error: "Database insert failed", 
        details: dbError.message 
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*" 
        }
      })
    }

    console.log(`✅ Successfully stored batch_id in database`)

    return new Response(JSON.stringify({ 
      success: true,
      batch_id,
      message: "Batch submitted successfully"
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    })

  } catch (error) {
    console.error(`❌ Unexpected error:`, error)
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    })
  }
}) 