const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function debugBulkJob() {
  // Use service role key to bypass RLS policies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('🔍 Checking bulk_jobs table with service role...')
    
    // Get all recent bulk jobs
    const { data: jobs, error } = await supabase
      .from('bulk_jobs')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No bulk jobs found in database')
      return
    }

    console.log(`📊 Found ${jobs.length} bulk jobs:`)
    console.log('')

    jobs.forEach((job, index) => {
      const submittedTime = new Date(job.submitted_at)
      const now = new Date()
      const timeElapsed = Math.floor((now - submittedTime) / 1000 / 60) // minutes
      
      console.log(`${index + 1}. Job Details:`)
      console.log(`   ID: ${job.id}`)
      console.log(`   Batch ID: ${job.batch_id}`)
      console.log(`   User ID: ${job.user_id}`)
      console.log(`   Status: ${job.status}`)
      console.log(`   Emails: ${job.num_valid_items}`)
      console.log(`   Submitted: ${job.submitted_at}`)
      console.log(`   Time elapsed: ${timeElapsed} minutes`)
      console.log(`   Download link: ${job.download_link || 'None'}`)
      console.log('')
    })

    // Find the stuck job (processing for more than 5 minutes)
    const stuckJobs = jobs.filter(job => {
      if (job.status !== 'processing') return false
      const submittedTime = new Date(job.submitted_at)
      const now = new Date()
      const timeElapsed = Math.floor((now - submittedTime) / 1000 / 60)
      return timeElapsed > 5
    })

    if (stuckJobs.length > 0) {
      console.log('⚠️  STUCK JOBS (processing for >5 minutes):')
      stuckJobs.forEach((job, index) => {
        const submittedTime = new Date(job.submitted_at)
        const now = new Date()
        const timeElapsed = Math.floor((now - submittedTime) / 1000 / 60)
        
        console.log(`${index + 1}. Batch ID: ${job.batch_id}`)
        console.log(`   User ID: ${job.user_id}`)
        console.log(`   Time stuck: ${timeElapsed} minutes`)
        console.log(`   Webhook URL: https://app.deepverify.com/api/callback/${job.user_id}`)
        console.log(`   Test command:`)
        console.log(`   curl -X POST https://app.deepverify.com/api/callback/${job.user_id} \\`)
        console.log(`     -H "Content-Type: application/json" \\`)
        console.log(`     -d '{"batch_id":"${job.batch_id}","download_link":"https://example.com/results.csv"}'`)
        console.log('')
      })
    } else {
      console.log('✅ No stuck jobs found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugBulkJob() 