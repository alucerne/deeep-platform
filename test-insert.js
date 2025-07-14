const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testInsert() {
  console.log('🧪 Testing manual job insertion...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  try {
    // Test data
    const testJob = {
      user_id: 'c8e30d6a-611f-48ee-a0f9-5942f39a3d08', // Your user ID from the logs
      batch_id: 'test-batch-' + Date.now(),
      submitted_at: new Date().toISOString(),
      num_valid_items: 87,
      remaining_credits: 600652,
      status: 'processing',
      download_link: null
    }

    console.log('📝 Attempting to insert test job:', testJob.batch_id)

    const { data, error } = await supabase
      .from('bulk_jobs')
      .insert([testJob])
      .select()

    if (error) {
      console.error('❌ Insert failed:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    } else {
      console.log('✅ Insert successful!')
      console.log('Inserted job:', data)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testInsert() 