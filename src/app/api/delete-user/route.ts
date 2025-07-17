import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create Supabase client with service role key for admin operations
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log(`🗑️ Deleting user account for: ${email}`)

    // 1. Find the user in Supabase auth
    const { data, error: authError } = await supabase.auth.admin.listUsers()
    const users = (data?.users ?? []) as Array<{ id: string; email: string }>
    
    if (authError) {
      console.error('Error listing users:', authError)
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.log(`User not found in Supabase auth: ${email}`)
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 })
    }

    console.log(`Found user in Supabase: ${user.id}`)

    // 2. Delete related data from deeep_api_keys table
    const { error: apiKeysError } = await supabase
      .from('deeep_api_keys')
      .delete()
      .eq('user_id', user.id)

    if (apiKeysError) {
      console.error('Error deleting API keys:', apiKeysError)
    } else {
      console.log('Deleted API keys for user')
    }

    // 3. Delete related data from user_profiles table
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id)

    if (profilesError) {
      console.error('Error deleting user profile:', profilesError)
    } else {
      console.log('Deleted user profile')
    }

    // 4. Delete related data from bulk_jobs table
    const { error: bulkJobsError } = await supabase
      .from('bulk_jobs')
      .delete()
      .eq('user_id', user.id)

    if (bulkJobsError) {
      console.error('Error deleting bulk jobs:', bulkJobsError)
    } else {
      console.log('Deleted bulk jobs for user')
    }

    // 5. Delete the user from Supabase auth
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError)
      return NextResponse.json({ error: 'Failed to delete user from auth' }, { status: 500 })
    }

    console.log('✅ Successfully deleted user from Supabase')

    // 6. Try to delete from DEEEP API (this might not be possible without their API key)
    // We'll attempt to call their delete endpoint if it exists
    try {
      const deeepRes = await fetch('https://al-api.proxy4smtp.com/audlabserviceusers/deleteuser', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.DEEEP_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (deeepRes.ok) {
        console.log('✅ Successfully deleted user from DEEEP API')
      } else {
        console.log('⚠️ DEEEP API delete endpoint not available or failed:', deeepRes.status)
      }
    } catch (deeepError) {
      console.log('⚠️ Could not delete from DEEEP API (endpoint may not exist):', deeepError)
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} has been deleted from Supabase. Note: DEEEP API deletion may require manual intervention.`
    }, { status: 200 })

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('Delete user error:', errorMessage)
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 })
  }
} 