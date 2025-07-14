import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function DELETE(req: NextRequest) {
  try {
    const { job_id } = await req.json()

    if (!job_id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Delete the bulk job
    const { error } = await supabase
      .from('bulk_jobs')
      .delete()
      .eq('id', job_id)

    if (error) {
      console.error('Error deleting bulk job:', error)
      return NextResponse.json(
        { error: 'Failed to delete bulk job' },
        { status: 500 }
      )
    }

    console.log('✅ Bulk job deleted successfully:', { job_id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete bulk job handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 