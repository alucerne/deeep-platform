import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-deeep-api-key",
      }
    })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Only POST requests are supported." }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  // Log the request for debugging
  console.log("🔔 Callback received:", {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    url: req.url
  })

  // Check for x-deeep-api-key header (optional for now)
  const apiKey = req.headers.get("x-deeep-api-key")
  console.log("🔑 API Key in header:", apiKey ? "Present" : "Missing")

  // For now, allow callbacks without API key validation to debug the issue
  // TODO: Re-enable API key validation once we confirm the flow works

  let body
  try {
    body = await req.json()
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON format in request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  const { batch_id, download_link } = body || {}

  if (!batch_id || !download_link) {
    return new Response(JSON.stringify({ error: "Missing batch_id or download_link in request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  // Update the email_batches table
  const { error, data } = await supabase
    .from("email_batches")
    .update({ download_link, status: "complete" })
    .eq("batch_id", batch_id)
    .select()

  if (error) {
    return new Response(JSON.stringify({ error: "Database update failed", details: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  if (!data || data.length === 0) {
    return new Response(JSON.stringify({ error: "No matching batch_id found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  return new Response(JSON.stringify({ success: true, batch_id, download_link }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }
  })
}) 