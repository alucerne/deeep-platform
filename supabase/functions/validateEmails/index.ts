import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  console.log(`🔔 validateEmails function called: ${req.method} ${req.url}`)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS preflight request handled`)
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.error(`❌ Method not allowed: ${req.method}`)
    return new Response(JSON.stringify({ error: 'Method not allowed. Only POST requests are supported.' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    console.log(`📝 Content-Type: ${contentType}`)
    let emails: string[] = []

    if (contentType.includes('application/json')) {
      // Handle JSON input
      console.log(`📋 Processing JSON input`)
      let body
      try {
        body = await req.json()
        console.log(`📄 JSON body received:`, body)
      } catch (err) {
        console.error(`❌ JSON parsing error: ${err.message}`)
        return new Response(JSON.stringify({ error: 'Invalid JSON format in request body' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      if (!body.emails) {
        console.error(`❌ Invalid JSON structure: missing emails field`)
        return new Response(JSON.stringify({ error: 'Invalid JSON format. Expected { "emails": ["email1", "email2"] } or { "emails": "email1,email2" }' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }

      // Handle both array and string formats
      if (Array.isArray(body.emails)) {
        // Array format: { "emails": ["email1", "email2"] }
        emails = body.emails.filter((email: any) => {
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
        console.log(`✅ Processed ${emails.length} valid emails from JSON array`)
      } else if (typeof body.emails === 'string') {
        // String format: { "emails": "email1,email2" }
        const emailString = body.emails.trim()
        if (emailString === '') {
          console.error(`❌ Empty emails string`)
          return new Response(JSON.stringify({ error: 'Emails string cannot be empty' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          })
        }
        
        emails = emailString.split(',').map(email => email.trim()).filter(email => {
          if (email === '') {
            console.warn(`⚠️ Skipping empty email`)
            return false
          }
          return true
        })
        console.log(`✅ Processed ${emails.length} valid emails from JSON string`)
      } else {
        console.error(`❌ Invalid emails format: ${typeof body.emails}`)
        return new Response(JSON.stringify({ error: 'Invalid emails format. Expected array or string' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
    } else if (contentType.includes('multipart/form-data')) {
      // Handle CSV file upload
      console.log(`📋 Processing CSV file upload`)
      let formData
      try {
        formData = await req.formData()
        console.log(`📄 FormData received with ${formData.entries().length} entries`)
      } catch (err) {
        console.error(`❌ FormData parsing error: ${err.message}`)
        return new Response(JSON.stringify({ error: 'Failed to parse form data' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      const file = formData.get('file') as File
      
      if (!file) {
        console.error(`❌ No file provided in form data`)
        return new Response(JSON.stringify({ error: 'No file provided. Expected file field named "file"' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }

      console.log(`📁 File received: ${file.name} (${file.size} bytes, ${file.type})`)

      // Read and parse CSV file
      let fileText
      try {
        fileText = await file.text()
        console.log(`📖 File content read (${fileText.length} characters)`)
      } catch (err) {
        console.error(`❌ File reading error: ${err.message}`)
        return new Response(JSON.stringify({ error: 'Failed to read uploaded file' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      const lines = fileText.split('\n').map(line => line.trim()).filter(line => line !== '')
      console.log(`📊 Found ${lines.length} non-empty lines in CSV`)
      
      // Extract emails from CSV (assuming one email per line)
      emails = lines.filter(line => {
        const hasEmail = line.includes('@')
        if (!hasEmail) {
          console.warn(`⚠️ Skipping line without @ symbol: ${line}`)
        }
        return hasEmail
      })
      
      console.log(`✅ Processed ${emails.length} valid emails from CSV`)
      
    } else {
      console.error(`❌ Unsupported content type: ${contentType}`)
      return new Response(JSON.stringify({ error: 'Unsupported content type. Use application/json or multipart/form-data' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Validate we have emails to process
    if (emails.length === 0) {
      console.error(`❌ No valid emails found to process`)
      return new Response(JSON.stringify({ error: 'No valid emails found to validate' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Convert emails array to comma-separated string
    const emailsString = emails.join(',')
    console.log(`🔗 Emails string created (${emailsString.length} characters)`)

    // Use the provided test API key for all requests
    const apiKey = 'p9ebe0g5akukrjgwf0gjy2hgt9mu64zzq'
    const apiUrl = `https://al-api.proxy4smtp.com/audlabapi/${apiKey}/email-validate-batch`
    
    console.log(`🔍 Submitting batch for ${emails.length} emails to: ${apiUrl}`)
    
    // Submit the batch with timeout
    let batchResponse
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_url: '', items: emailsString }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log(`📡 Batch submission response status: ${resp.status}`)
      
      const text = await resp.text()
      console.log(`📄 Raw response: ${text.substring(0, 200)}...`)
      
      try {
        batchResponse = JSON.parse(text)
        console.log(`✅ JSON parsed successfully`)
      } catch (e) {
        console.error(`❌ JSON parsing failed: ${e.message}`)
        batchResponse = { error: 'Invalid JSON from provider', raw: text.substring(0, 500) }
      }
      
      if (!resp.ok) {
        console.error(`❌ Provider API error: ${resp.status} - ${resp.statusText}`)
        return new Response(JSON.stringify({ 
          error: 'Email validation service error',
          status: resp.status >= 500 ? 502 : 400, // Bad Gateway for 5xx, Bad Request for 4xx
          details: batchResponse
        }), {
          status: resp.status >= 500 ? 502 : 400, // Bad Gateway for 5xx, Bad Request for 4xx
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`❌ Batch submission timeout after 30 seconds`)
        return new Response(JSON.stringify({ error: 'Email validation service timeout' }), {
          status: 408,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      console.error(`❌ Batch submission network error: ${err.message}`)
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to email validation service',
        details: err.message 
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    console.log(`✅ Batch submitted successfully:`, batchResponse)
    
    // Check if we got a batch_id
    if (!batchResponse.batch_id) {
      console.error(`❌ No batch_id received from provider:`, batchResponse)
      return new Response(JSON.stringify({ 
        error: 'Invalid response from email validation service',
        details: batchResponse 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Poll for completion
    const batchId = batchResponse.batch_id
    const pollUrl = `https://al-api.proxy4smtp.com/audlabapi/${apiKey}/batch-status/${batchId}`
    let downloadLink = null
    let attempts = 0
    const maxAttempts = 10

    console.log(`🔄 Starting polling for completion: ${batchId}`)

    while (attempts < maxAttempts) {
      attempts++
      console.log(`📡 Poll attempt ${attempts}/${maxAttempts} for batch ${batchId}`)
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout per poll
        
        const pollResp = await fetch(pollUrl, { signal: controller.signal })
        clearTimeout(timeoutId)
        
        if (!pollResp.ok) {
          console.error(`❌ Poll request failed: ${pollResp.status} - ${pollResp.statusText}`)
          if (attempts === maxAttempts) {
            return new Response(JSON.stringify({ 
              error: 'Failed to check batch status',
              batch_id: batchId,
              attempts: attempts
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            })
          }
          continue
        }
        
        const pollText = await pollResp.text()
        console.log(`📄 Poll response: ${pollText.substring(0, 200)}...`)
        
        let pollData
        try {
          pollData = JSON.parse(pollText)
        } catch (e) {
          console.error(`❌ Invalid JSON from poll response: ${e.message}`)
          if (attempts === maxAttempts) {
            return new Response(JSON.stringify({ 
              error: 'Invalid response from email validation service',
              batch_id: batchId,
              attempts: attempts
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            })
          }
          continue
        }
        
        console.log(`📊 Poll data:`, pollData)
        
        // Check if job is complete
        if (pollData.status === 'completed' || pollData.download_link) {
          downloadLink = pollData.download_link
          console.log(`✅ Job completed! Download link: ${downloadLink}`)
          break
        }
        
        if (pollData.status === 'failed') {
          console.error(`❌ Batch processing failed:`, pollData)
          return new Response(JSON.stringify({ 
            error: 'Email validation batch processing failed',
            details: pollData,
            batch_id: batchId
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          })
        }
        
        console.log(`⏳ Job still processing, waiting 3 seconds...`)
        // Wait 3 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 3000))
        
      } catch (err) {
        if (err.name === 'AbortError') {
          console.error(`❌ Poll timeout on attempt ${attempts}`)
        } else {
          console.error(`❌ Poll error on attempt ${attempts}: ${err.message}`)
        }
        
        if (attempts === maxAttempts) {
          return new Response(JSON.stringify({ 
            error: 'Failed to check batch status',
            details: err.message,
            batch_id: batchId,
            attempts: attempts
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          })
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    if (!downloadLink) {
      console.error(`❌ Batch processing timeout after ${maxAttempts * 3} seconds`)
      return new Response(JSON.stringify({ 
        error: 'Email validation batch processing timeout',
        batch_id: batchId,
        attempts: attempts,
        max_wait_time: `${maxAttempts * 3} seconds`
      }), {
        status: 408,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Download the CSV file
    console.log(`📥 Downloading CSV from: ${downloadLink}`)
    
    let csvContent
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const csvResp = await fetch(downloadLink, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      if (!csvResp.ok) {
        console.error(`❌ CSV download failed: ${csvResp.status} - ${csvResp.statusText}`)
        return new Response(JSON.stringify({ 
          error: 'Failed to download validation results',
          status: csvResp.status,
          batch_id: batchId
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      csvContent = await csvResp.text()
      console.log(`✅ CSV downloaded successfully (${csvContent.length} characters)`)
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`❌ CSV download timeout`)
        return new Response(JSON.stringify({ 
          error: 'Timeout downloading validation results',
          batch_id: batchId
        }), {
          status: 408,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      console.error(`❌ CSV download error: ${err.message}`)
      return new Response(JSON.stringify({ 
        error: 'Failed to download validation results',
        details: err.message,
        batch_id: batchId
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Upload to Supabase Storage
    console.log(`📤 Uploading CSV to Supabase Storage`)
    
    try {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://hapmnlakorkoklzfovne.supabase.co'
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIxMTgxMywiZXhwIjoyMDY3Nzg3ODEzfQ.Zu6g-Fu2tJdQwrezn07gdjJfJesEswewJscWaSvG_0w'
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error(`❌ Missing Supabase environment variables`)
        return new Response(JSON.stringify({ 
          error: 'Storage service configuration error',
          batch_id: batchId
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log(`🔗 Supabase client initialized`)
      
      // Create the filename
      const filename = `batch-${batchId}.csv`
      console.log(`📁 Uploading as: ${filename}`)
      
      // Upload the file to the validated-emails bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('validated-emails')
        .upload(filename, csvContent, {
          contentType: 'text/csv',
          upsert: true
        })
      
      if (uploadError) {
        console.error(`❌ Storage upload error:`, uploadError)
        return new Response(JSON.stringify({ 
          error: 'Failed to save validation results',
          details: uploadError.message,
          batch_id: batchId
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        })
      }
      
      console.log(`✅ File uploaded successfully:`, uploadData)
      
      // Make the file public
      console.log(`🔓 Setting file to public access`)
      const { data: publicData, error: publicError } = await supabase.storage
        .from('validated-emails')
        .update(filename, {
          public: true
        })
      
      if (publicError) {
        console.error(`❌ Public access error:`, publicError)
        // Continue anyway, the file is uploaded but may not be publicly accessible
      } else {
        console.log(`✅ File set to public access`)
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('validated-emails')
        .getPublicUrl(filename)
      
      const downloadUrl = urlData.publicUrl
      console.log(`✅ Public download URL generated: ${downloadUrl}`)
      
      // Return the download URL
      console.log(`🎉 Function completed successfully`)
      return new Response(JSON.stringify({ 
        download_url: downloadUrl,
        batch_id: batchId,
        filename: filename,
        file_size: csvContent.length,
        emails_processed: emails.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
      
    } catch (err) {
      console.error(`❌ Storage operation error: ${err.message}`)
      return new Response(JSON.stringify({ 
        error: 'Failed to save validation results',
        details: err.message,
        batch_id: batchId
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
  } catch (error) {
    console.error(`❌ Unexpected function error: ${error.message}`)
    console.error(`❌ Error stack: ${error.stack}`)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}) 