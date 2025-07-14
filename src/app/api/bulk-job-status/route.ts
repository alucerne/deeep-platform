import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batch_id')
    const userId = searchParams.get('user_id')

    if (!batchId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: batch_id and user_id' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking status for batch:', batchId, 'user:', userId)

    // Create Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get the bulk job
    const { data, error } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('batch_id', batchId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching bulk job:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bulk job' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Bulk job not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found bulk job:', {
      id: data.id,
      batch_id: data.batch_id,
      status: data.status,
      submitted_at: data.submitted_at,
      num_valid_items: data.num_valid_items,
      download_link: data.download_link
    })

    return NextResponse.json({
      success: true,
      job: data
    })

  } catch (error) {
    console.error('❌ Error in status check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 