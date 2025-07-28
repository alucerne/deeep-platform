import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

// For demo purposes, we'll simulate CSV data
const SIMULATE_CSV_DATA = true

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

    let csvContent: string
    let emailResults: CSVRow[] = []

    if (SIMULATE_CSV_DATA) {
      // Generate simulated CSV data for demo
      console.log('Generating simulated CSV data for demo')
      
      const emails = batch.submitted_emails || []
      const validEmails = Math.floor(emails.length * 0.85) // 85% valid
      const invalidEmails = emails.length - validEmails
      
      // Generate simulated results
      emailResults = emails.map((email: string, index: number) => {
        const isValid = index < validEmails
        return {
          email: email,
          last_seen: isValid ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null
        }
      })

      // Generate CSV content
      csvContent = 'email,last_seen\n'
      emailResults.forEach(result => {
        const email = result.email.replace(/"/g, '""') // Escape quotes
        const lastSeen = result.last_seen ? result.last_seen.replace(/"/g, '""') : ''
        csvContent += `"${email}","${lastSeen}"\n`
      })

      console.log('Generated simulated CSV with', emailResults.length, 'rows')
    } else {
      // This would be the real implementation
      if (!download_url) {
        return new Response(JSON.stringify({ error: 'download_url is required' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      // Fetch CSV from download_url
      const csvResponse = await fetch(download_url)
      if (!csvResponse.ok) {
        console.error('Failed to fetch CSV from:', download_url)
        return new Response(JSON.stringify({ error: 'Failed to fetch CSV file' }), {
          status: 502,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      csvContent = await csvResponse.text()
      emailResults = parseCSV(csvContent)
    }

    // Insert email results into database
    if (emailResults.length > 0) {
      const resultsToInsert = emailResults.map(row => ({
        request_id: request_id,
        email: row.email,
        last_seen: row.last_seen ? new Date(row.last_seen) : null
      }))

      const { error: insertError } = await supabase
        .from('instant_email_results')
        .insert(resultsToInsert)

      if (insertError) {
        console.error('Error inserting email results:', insertError)
        return new Response(JSON.stringify({ error: 'Failed to store results' }), {
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
      download_url: download_url || `https://example.com/results/${request_id}.csv`
    }
    
    if (summary) {
      updateData.summary = summary
    } else if (SIMULATE_CSV_DATA) {
      // Generate simulated summary
      const validCount = emailResults.filter(r => r.last_seen).length
      const invalidCount = emailResults.length - validCount
      updateData.summary = {
        total_emails: emailResults.length,
        valid_emails: validCount,
        invalid_emails: invalidCount,
        processing_time_seconds: Math.floor(emailResults.length * 0.1)
      }
    }

    const { error: updateError } = await supabase
      .from('instant_email_batches')
      .update(updateData)
      .eq('request_id', request_id)

    if (updateError) {
      console.error('Error updating batch status:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update batch status' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    console.log('Batch marked as complete:', request_id)

    return new Response(JSON.stringify({
      success: true,
      request_id: request_id,
      results_count: emailResults.length,
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

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i]
    const values = parseCSVLine(line)
    
    if (values.length >= 1) {
      const email = values[0].trim()
      const lastSeen = values[1] ? values[1].trim() : undefined
      
      if (isValidEmail(email)) {
        rows.push({
          email: email,
          last_seen: lastSeen || undefined
        })
      }
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 