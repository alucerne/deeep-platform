import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function POST(req: NextRequest) {
  try {
    const { user_id, batch_id, num_valid_items, remaining_credits, api_key } = await req.json()

    if (!user_id || !batch_id || !num_valid_items || !remaining_credits || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🔔 Creating bulk job:', { user_id, batch_id, num_valid_items, api_key: api_key.substring(0, 8) + '...' })

    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert the bulk job
    const { data, error } = await supabase
      .from('bulk_jobs')
      .insert([
        {
          user_id,
          batch_id,
          submitted_at: new Date().toISOString(),
          num_valid_items,
          remaining_credits,
          status: 'processing',
          download_link: null,
          api_key: api_key.substring(0, 8) + '...' // Store masked API key for reference
        }
      ])
      .select()

    if (error) {
      console.error('❌ Error creating bulk job:', error)
      return NextResponse.json(
        { error: 'Failed to create bulk job' },
        { status: 500 }
      )
    }

    console.log('✅ Bulk job created successfully:', data[0])

    return NextResponse.json({
      success: true,
      job: data[0]
    })

  } catch (error) {
    console.error('❌ Error in create-bulk-job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 