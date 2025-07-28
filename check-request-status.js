const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabaseUrl = 'https://hapmnlakorkoklzfovne.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRequestStatus(requestId) {
  try {
    console.log(`Checking status for request: ${requestId}`)
    
    // Query the instant_email_batches table directly
    const { data: batch, error } = await supabase
      .from('instant_email_batches')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error) {
      console.error('Error fetching batch:', error)
      return
    }

    if (!batch) {
      console.log('No batch found with that request_id')
      return
    }

    console.log('\n=== Batch Status ===')
    console.log('Request ID:', batch.request_id)
    console.log('User Email:', batch.user_email)
    console.log('Status:', batch.status)
    console.log('Submitted Emails Count:', batch.submitted_emails?.length || 0)
    console.log('Submitted At:', batch.submitted_at)
    console.log('Created At:', batch.created_at)
    console.log('Updated At:', batch.updated_at)
    
    if (batch.summary) {
      console.log('\n=== Summary ===')
      console.log(JSON.stringify(batch.summary, null, 2))
    }

    // If batch is complete, also check for results
    if (batch.status === 'complete') {
      console.log('\n=== Checking Results ===')
      const { data: results, error: resultsError } = await supabase
        .from('instant_email_results')
        .select('*')
        .eq('request_id', requestId)
        .limit(5)

      if (resultsError) {
        console.error('Error fetching results:', resultsError)
      } else {
        console.log(`Found ${results?.length || 0} result records`)
        if (results && results.length > 0) {
          console.log('Sample results:')
          results.forEach((result, index) => {
            console.log(`${index + 1}. Email: ${result.email}, Last Seen: ${result.last_seen}`)
          })
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Check the specific request
checkRequestStatus('req_1753681421305_ijdvnrm55') 