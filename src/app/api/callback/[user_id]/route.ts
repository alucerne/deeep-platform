import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { batch_id, download_link } = await req.json()
    const { user_id } = await params

    if (!batch_id || !download_link) {
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
      console.error('Error updating bulk job:', error)
      return NextResponse.json(
        { error: 'Failed to update bulk job' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Bulk job not found' },
        { status: 404 }
      )
    }

    console.log(`Updated bulk job ${batch_id} for user ${user_id}`)

    return NextResponse.json({ 
      success: true,
      message: 'Bulk job updated successfully'
    })

  } catch (error) {
    console.error('Error in callback handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 