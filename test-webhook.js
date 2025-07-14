const fetch = require('node-fetch')

async function testWebhook() {
  // Replace these with actual values from your local test
  const userId = 'YOUR_USER_ID_HERE' // Get this from the debug script
  const batchId = 'YOUR_BATCH_ID_HERE' // Get this from the debug script
  
  const webhookUrl = `http://localhost:3000/api/callback/${userId}`
  const payload = {
    batch_id: batchId,
    download_link: 'https://example.com/test-results.csv'
  }

  console.log('🧪 Testing webhook locally...')
  console.log('URL:', webhookUrl)
  console.log('Payload:', payload)
  console.log('')

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.text()
    
    console.log('📡 Response Status:', response.status)
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()))
    console.log('📡 Response Body:', result)
    
    if (response.ok) {
      console.log('✅ Webhook test successful!')
    } else {
      console.log('❌ Webhook test failed!')
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message)
  }
}

// Instructions for use
console.log('🔧 WEBHOOK TEST SCRIPT')
console.log('')
console.log('To use this script:')
console.log('1. First run: node debug-bulk-job.js')
console.log('2. Copy the user_id and batch_id from the output')
console.log('3. Update the variables in this script')
console.log('4. Run: node test-webhook.js')
console.log('')
console.log('Make sure your local dev server is running (npm run dev)')
console.log('')

// Uncomment the line below and update the IDs to test
// testWebhook() 