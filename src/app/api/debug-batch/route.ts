import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batch_id')

    if (!batchId) {
      return NextResponse.json({ error: 'batch_id parameter is required' }, { status: 400 })
    }

    console.log('🔍 Debug: Checking for batch:', batchId)

    // Create Supabase client with service role key for admin access
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check bulk_jobs table
    const { data: bulkJobs, error: bulkJobsError } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('batch_id', batchId)

    console.log('📊 Debug results:', {
      batchId,
      bulkJobs: bulkJobs?.length || 0,
      bulkJobsError: bulkJobsError?.message
    })

    return NextResponse.json({
      success: true,
      batchId,
      bulkJobs: bulkJobs || [],
      bulkJobsError: bulkJobsError?.message
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 