'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Download, Loader2, Clock } from 'lucide-react'

interface BulkJob {
  id: string
  user_id: string
  batch_id: string
  submitted_at: string
  num_valid_items: number
  remaining_credits: number
  status: 'processing' | 'complete'
  download_link: string | null
}

export default function UploadHistory() {
  const [jobs, setJobs] = useState<BulkJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setRefreshing(true)
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Fetch bulk jobs for the current user
      const { data, error } = await supabase
        .from('bulk_jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching bulk jobs:', error)
      } else {
        setJobs(data || [])
      }
    } catch (error) {
      console.error('Error fetching bulk jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchJobs()
  }, [supabase])

  // Auto-refresh every 10 seconds for jobs that are still processing
  useEffect(() => {
    if (!supabase) return

    const interval = setInterval(() => {
      const hasProcessingJobs = jobs.some(job => job.status === 'processing')
      if (hasProcessingJobs) {
        fetchJobs(true)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [jobs, fetchJobs, supabase])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'complete') {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
    }
  }

  const handleDownload = (downloadLink: string) => {
    window.open(downloadLink, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading upload history...</span>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No bulk uploads found</p>
        <p className="text-sm">Your bulk upload history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload History</h3>
        {refreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Refreshing...
          </div>
        )}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead># Emails</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Download Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                {formatDate(job.submitted_at)}
              </TableCell>
              <TableCell>
                {job.num_valid_items.toLocaleString()}
              </TableCell>
              <TableCell>
                {getStatusBadge(job.status)}
              </TableCell>
              <TableCell>
                {job.status === 'complete' && job.download_link ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(job.download_link!)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 