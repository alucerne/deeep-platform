const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://hapmnlakorkoklzfovne.supabase.co'
const supabaseKey = '155b9344e57398c80e40f2a3f4aa621ae8a35f60812f0511f73265a954e6aedd'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addCredits() {
  try {
    console.log('Adding 1,000 credits to adam@audiencelab.io...')
    
    // First, check if the user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('api_users')
      .select('*')
      .eq('user_email', 'adam@audiencelab.io')
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return
    }

    console.log('Current user data:', existingUser)

    // Update the user's credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('api_users')
      .update({ credits: existingUser.credits + 1000 })
      .eq('user_email', 'adam@audiencelab.io')
      .select()
      .single()

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return
    }

    console.log('✅ Successfully added 1,000 credits!')
    console.log('Updated user data:', updatedUser)
    console.log(`New credit balance: ${updatedUser.credits}`)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

addCredits() 