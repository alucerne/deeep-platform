import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

interface WebhookPayload {
  request_id: string
  download_url: string
  summary?: {
    total_emails?: number
    valid_emails?: number
    invalid_emails?: number
    processing_time?: number
  }
}

interface CSVRow {
  email: string
  last_seen?: string
}

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
    // Parse webhook payload
    const body = await req.json()
    const { request_id, download_url, summary } = body as WebhookPayload

    console.log('Webhook received:', { request_id, download_url, summary })

    // Validate required fields
    if (!request_id) {
      return new Response(JSON.stringify({ error: 'request_id is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (!download_url) {
      return new Response(JSON.stringify({ error: 'download_url is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Look up the batch by request_id
    const { data: batch, error: batchError } = await supabase
      .from('instant_email_batches')
      .select('*')
      .eq('request_id', request_id)
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

    // Fetch CSV from download_url
    console.log('Fetching CSV from:', download_url)
    const csvResponse = await fetch(download_url)
    
    if (!csvResponse.ok) {
      console.error('Failed to fetch CSV:', csvResponse.status, csvResponse.statusText)
      return new Response(JSON.stringify({ error: 'Failed to fetch CSV file' }), {
        status: 502,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    const csvContent = await csvResponse.text()
    console.log('CSV content length:', csvContent.length)

    // Parse CSV content
    const rows = parseCSV(csvContent)
    console.log('Parsed rows:', rows.length)

    // Insert email results into database
    if (rows.length > 0) {
      const emailResults = rows.map(row => ({
        request_id: request_id,
        email: row.email,
        last_seen: row.last_seen ? new Date(row.last_seen) : null
      }))

      const { error: insertError } = await supabase
        .from('instant_email_results')
        .insert(emailResults)

      if (insertError) {
        console.error('Error inserting email results:', insertError)
        return new Response(JSON.stringify({ error: 'Failed to save email results' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      console.log('Inserted', emailResults.length, 'email results')
    }

    // Update batch status to complete
    const updateData: any = {
      status: 'complete',
      download_url: download_url
    }

    // Add summary if provided
    if (summary) {
      updateData.summary = summary
    }

    const { error: updateError } = await supabase
      .from('instant_email_batches')
      .update(updateData)
      .eq('request_id', request_id)

    if (updateError) {
      console.error('Error updating batch:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update batch status' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    console.log('Batch updated to complete status')

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      request_id: request_id,
      rows_processed: rows.length,
      message: 'Webhook processed successfully'
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

/**
 * Parse CSV content into rows
 */
function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
  const rows: CSVRow[] = []

  // Skip header if present
  const dataLines = lines.length > 0 && lines[0].toLowerCase().includes('email') ? lines.slice(1) : lines

  for (const line of dataLines) {
    if (!line.trim()) continue

    // Parse CSV line (handles quoted values)
    const columns = parseCSVLine(line)
    
    if (columns.length >= 1) {
      const email = columns[0].trim()
      const lastSeen = columns.length >= 2 ? columns[1].trim() : undefined

      if (email && isValidEmail(email)) {
        rows.push({
          email: email,
          last_seen: lastSeen && lastSeen !== '' ? lastSeen : undefined
        })
      }
    }
  }

  return rows
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const columns: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // End of column
      columns.push(current)
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }

  // Add the last column
  columns.push(current)

  return columns
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
} 