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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    })
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed. Only GET requests are supported.", {
      status: 405,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  // Parse the URL to get the batch_id parameter
  const url = new URL(req.url)
  const batchId = url.searchParams.get("id")

  if (!batchId) {
    return new Response("Missing batch_id parameter. Use: /batch-result?id=<batch_id>", {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  // Look up the batch in the database
  const { data, error } = await supabase
    .from("email_batches")
    .select("download_link, status")
    .eq("batch_id", batchId)
    .maybeSingle()

  if (error) {
    return new Response("Database error occurred", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  if (!data) {
    return new Response("Batch not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }

  // Check if the batch is complete and has a download link
  if (data.status === "complete" && data.download_link) {
    return new Response(data.download_link, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  } else {
    return new Response("Still processing", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      }
    })
  }
}) 