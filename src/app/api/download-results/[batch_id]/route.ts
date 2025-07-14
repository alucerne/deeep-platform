import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const { batch_id } = await params

    console.log('📥 Download request for batch:', batch_id)

    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the bulk job
    const { data: job, error } = await supabase
      .from('bulk_jobs')
      .select('*')
      .eq('batch_id', batch_id)
      .single()

    if (error || !job) {
      console.error('❌ Job not found:', batch_id)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'complete') {
      console.error('❌ Job not complete:', batch_id, job.status)
      return NextResponse.json(
        { error: 'Job not complete' },
        { status: 400 }
      )
    }

    console.log('✅ Generating CSV for job:', job.id)

    // Generate sample CSV data (in a real implementation, this would come from your processing system)
    const csvData = generateSampleCSV(job.num_valid_items, batch_id)

    // Set headers for CSV download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', `attachment; filename="bulk-upload-results-${batch_id}.csv"`)

    return new NextResponse(csvData, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('❌ Error in download endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateSampleCSV(numEmails: number, batchId: string): string {
  // Generate sample CSV data
  const headers = ['Email', 'Status', 'Validation Result', 'Batch ID', 'Processed At']
  const rows = []
  
  for (let i = 1; i <= numEmails; i++) {
    const email = `user${i}@example.com`
    const status = Math.random() > 0.1 ? 'valid' : 'invalid' // 90% valid
    const validationResult = status === 'valid' ? 'Email is valid' : 'Email is invalid'
    const processedAt = new Date().toISOString()
    
    rows.push([email, status, validationResult, batchId, processedAt])
  }

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  return csvContent
} 