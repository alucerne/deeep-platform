'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, Loader2, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'

interface BulkJob {
  id: string
  user_id: string
  batch_id: string
  submitted_at: string
  num_valid_items: number
  remaining_credits: number
  status: 'processing' | 'complete'
  download_link: string | null
  api_key: string | null
}

interface ProcessingJob extends BulkJob {
  estimatedTimeRemaining?: number
  progressPercentage?: number
  timeElapsed?: number
}

export default function UploadHistory() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  // Calculate processing progress and estimated time
  const calculateProgress = useCallback((job: BulkJob): ProcessingJob => {
    if (job.status === 'complete') {
      return { ...job, progressPercentage: 100, estimatedTimeRemaining: 0 }
    }

    const submittedTime = new Date(job.submitted_at).getTime()
    const now = Date.now()
    const timeElapsed = Math.floor((now - submittedTime) / 1000) // seconds

    // Estimate processing time based on email count
    // Assume ~3-5 seconds per email on average
    const estimatedTotalTime = Math.max(30, job.num_valid_items * 3) // minimum 30 seconds
    const progressPercentage = Math.min(95, (timeElapsed / estimatedTotalTime) * 100)
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - timeElapsed)

    return {
      ...job,
      progressPercentage: Math.floor(progressPercentage),
      estimatedTimeRemaining,
      timeElapsed
    }
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
        // Calculate progress for each job
        const jobsWithProgress = (data || []).map(calculateProgress)
        setJobs(jobsWithProgress)
      }
    } catch (error) {
      console.error('Error fetching bulk jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, calculateProgress])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

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

  // Update progress every 30 seconds for processing jobs
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.status === 'processing' ? calculateProgress(job) : job
        )
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [calculateProgress])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (status: string) => {
    if (status === 'complete') {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
    }
  }

  const getProgressMessage = (job: ProcessingJob) => {
    if (job.status === 'complete') return null

    const emailCount = job.num_valid_items
    if (emailCount <= 50) {
      return "Processing small batch..."
    } else if (emailCount <= 200) {
      return "Processing medium batch..."
    } else {
      return "Processing large batch..."
    }
  }

  const handleDownload = (batchId: string) => {
    // Use our download endpoint instead of external URL
    const downloadUrl = `${window.location.origin}/api/download-results/${batchId}`
    window.open(downloadUrl, '_blank')
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this bulk upload? This action cannot be undone.')) {
      return
    }

    setDeletingJobId(jobId)

    try {
      const response = await fetch('/api/delete-bulk-job', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job_id: jobId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete bulk job')
      }

      // Remove the job from the local state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId))
    } catch (error) {
      console.error('Error deleting bulk job:', error)
      alert('Failed to delete bulk job. Please try again.')
    } finally {
      setDeletingJobId(null)
    }
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
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Actions</TableHead>
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
                <span className="text-sm text-muted-foreground font-mono">
                  {job.api_key || 'N/A'}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(job.status)}
              </TableCell>
              <TableCell>
                {job.status === 'processing' ? (
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getProgressMessage(job)}</span>
                      <span>{job.progressPercentage}%</span>
                    </div>
                    <Progress value={job.progressPercentage} className="h-2" />
                    {job.estimatedTimeRemaining && job.estimatedTimeRemaining > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>~{formatTime(job.estimatedTimeRemaining)} remaining</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Complete</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {job.status === 'complete' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(job.batch_id)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingJobId === job.id}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingJobId === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deletingJobId === job.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 