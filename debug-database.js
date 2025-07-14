const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function debugDatabase() {
  console.log('🔍 Debugging database connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🌐 Supabase URL:', supabaseUrl)
  console.log('🔑 Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Test basic connection
    console.log('\n📡 Testing database connection...')
    
    // Check if bulk_jobs table exists and has data
    const { data: jobs, error: jobsError } = await supabase
      .from('bulk_jobs')
      .select('*')
      .limit(5)

    if (jobsError) {
      console.error('❌ Error accessing bulk_jobs table:', jobsError)
      return
    }

    console.log('✅ Successfully connected to bulk_jobs table')
    console.log(`📊 Found ${jobs?.length || 0} jobs in table`)
    
    if (jobs && jobs.length > 0) {
      console.log('\n📋 Recent jobs:')
      jobs.forEach((job, index) => {
        console.log(`${index + 1}. ID: ${job.id}`)
        console.log(`   Batch ID: ${job.batch_id}`)
        console.log(`   User ID: ${job.user_id}`)
        console.log(`   Status: ${job.status}`)
        console.log(`   Submitted: ${job.submitted_at}`)
        console.log(`   Emails: ${job.num_valid_items}`)
        console.log('')
      })
    }

    // Check for the specific job we just created
    console.log('🔍 Looking for recent job with batch_id: 0tx96qf5af63h416fw44h0g2qx1c6nuz')
    const { data: specificJob, error: specificError } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('batch_id', '0tx96qf5af63h416fw44h0g2qx1c6nuz')
      .single()

    if (specificError) {
      console.log('❌ Specific job not found:', specificError.message)
    } else if (specificJob) {
      console.log('✅ Found the specific job:')
      console.log('   ID:', specificJob.id)
      console.log('   Status:', specificJob.status)
      console.log('   Submitted:', specificJob.submitted_at)
    }

    // Check table structure
    console.log('\n🏗️  Checking table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'bulk_jobs' })
      .catch(() => ({ data: null, error: 'RPC not available' }))

    if (tableError) {
      console.log('ℹ️  Could not get table info (this is normal)')
    } else {
      console.log('📋 Table structure:', tableInfo)
    }

  } catch (error) {
    console.error('❌ Database error:', error)
  }
}

debugDatabase() 