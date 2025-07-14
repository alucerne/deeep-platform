import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    console.log('🔔 Webhook callback received')
    
    const body = await req.json()
    console.log('📦 Request body:', body)
    
    const { batch_id, download_link } = body
    const { user_id } = await params

    console.log('🔍 Parsed data:', { batch_id, download_link, user_id })

    if (!batch_id || !download_link) {
      console.error('❌ Missing required fields:', { batch_id, download_link })
      return NextResponse.json(
        { error: 'Missing required fields: batch_id and download_link' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Looking for bulk job with batch_id:', batch_id, 'and user_id:', user_id)

    // First, check if the job exists
    const { data: existingJob, error: checkError } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('batch_id', batch_id)
      .eq('user_id', user_id)
      .single()

    if (checkError) {
      console.error('❌ Error checking existing job:', checkError)
      return NextResponse.json(
        { error: 'Failed to check bulk job' },
        { status: 500 }
      )
    }

    if (!existingJob) {
      console.error('❌ Bulk job not found:', { batch_id, user_id })
      return NextResponse.json(
        { error: 'Bulk job not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found existing job:', { 
      id: existingJob.id, 
      status: existingJob.status, 
      num_valid_items: existingJob.num_valid_items 
    })

    // Update the bulk_jobs record
    const { data, error } = await supabase
      .from('bulk_jobs')
      .update({
        status: 'complete',
        download_link: download_link
      })
      .eq('batch_id', batch_id)
      .eq('user_id', user_id)
      .select()

    if (error) {
      console.error('❌ Error updating bulk job:', error)
      return NextResponse.json(
        { error: 'Failed to update bulk job' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ No rows updated')
      return NextResponse.json(
        { error: 'Bulk job not found' },
        { status: 404 }
      )
    }

    console.log('✅ Successfully updated bulk job:', { 
      batch_id, 
      user_id, 
      download_link,
      updated_rows: data.length 
    })

    return NextResponse.json({ 
      success: true,
      message: 'Bulk job updated successfully',
      data: data[0]
    })

  } catch (error) {
    console.error('❌ Error in callback handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 