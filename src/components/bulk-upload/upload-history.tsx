'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Download, Loader2, Clock, CheckCircle, Trash2, Mail, Zap } from 'lucide-react'
import ValidationBreakdownChart, { ValidationBreakdownDatum } from "@/components/charts/validation-breakdown-chart"
import Papa from 'papaparse'

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

interface InstantEmailBatch {
  id: string
  request_id: string
  user_email: string
  submitted_emails: string[]
  submitted_at: string
  status: 'processing' | 'complete' | 'failed'
  download_url: string | null
  summary: any | null
}

interface ProcessingJob extends BulkJob {
  estimatedTimeRemaining?: number
  progressPercentage?: number
  timeElapsed?: number
  service: 'deeep'
}

interface ProcessingInstantEmailJob extends InstantEmailBatch {
  estimatedTimeRemaining?: number
  progressPercentage?: number
  timeElapsed?: number
  service: 'instantemail'
}

type AllJobs = ProcessingJob | ProcessingInstantEmailJob

export default function UploadHistory() {
  const [jobs, setJobs] = useState<AllJobs[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<AllJobs | null>(null)
  const [chartData, setChartData] = useState<ValidationBreakdownDatum[] | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

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
  const calculateProgress = useCallback((job: BulkJob | InstantEmailBatch, service: 'deeep' | 'instantemail'): AllJobs => {
    if (job.status === 'complete') {
      return { ...job, progressPercentage: 100, estimatedTimeRemaining: 0, service }
    }

    const submittedTime = new Date(job.submitted_at).getTime()
    const now = Date.now()
    const timeElapsed = Math.floor((now - submittedTime) / 1000) // seconds

    // Estimate processing time based on email count
    const emailCount = service === 'deeep' ? job.num_valid_items : job.submitted_emails.length
    const estimatedTotalTime = Math.max(30, emailCount * 3) // minimum 30 seconds
    const progressPercentage = Math.min(95, (timeElapsed / estimatedTotalTime) * 100)
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - timeElapsed)

    return {
      ...job,
      progressPercentage: Math.floor(progressPercentage),
      estimatedTimeRemaining,
      timeElapsed,
      service
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

      // Fetch DEEEP bulk jobs for the current user
      const { data: deeepJobs, error: deeepError } = await supabase
        .from('bulk_jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('submitted_at', { ascending: false })

      if (deeepError) {
        console.error('Error fetching DEEEP jobs:', deeepError)
      }

      // Fetch InstantEmail batches for the current user
      const { data: instantEmailJobs, error: instantEmailError } = await supabase
        .from('instant_email_batches')
        .select('*')
        .eq('user_email', session.user.email)
        .order('submitted_at', { ascending: false })

      if (instantEmailError) {
        console.error('Error fetching InstantEmail jobs:', instantEmailError)
      }

      // Combine and process both types of jobs
      const allJobs: AllJobs[] = []

      // Process DEEEP jobs
      if (deeepJobs) {
        deeepJobs.forEach(job => {
          allJobs.push(calculateProgress(job, 'deeep'))
        })
      }

      // Process InstantEmail jobs
      if (instantEmailJobs) {
        instantEmailJobs.forEach(job => {
          allJobs.push(calculateProgress(job, 'instantemail'))
        })
      }

      // Sort by submission date (newest first)
      allJobs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())

      setJobs(allJobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase, calculateProgress])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Set up polling for processing jobs
  useEffect(() => {
    const processingJobs = jobs.filter(job => job.status === 'processing')
    
    if (processingJobs.length === 0) return

    const interval = setInterval(() => {
      setJobs(prevJobs => 
        prevJobs.map(job => {
          if (job.status === 'processing') {
            return calculateProgress(job, job.service)
          }
          return job
        })
      )
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [jobs, calculateProgress])

  const handleRefresh = () => {
    fetchJobs(true)
  }

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

  const getStatusBadge = (status: string, service: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    
    switch (status) {
      case 'complete':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Complete</Badge>
      case 'processing':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Processing</Badge>
      case 'failed':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Failed</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</Badge>
    }
  }

  const getProgressMessage = (job: AllJobs) => {
    if (job.status === 'complete') return 'Processing complete'
    
    if (job.service === 'deeep') {
      const deeepJob = job as ProcessingJob
      if (deeepJob.estimatedTimeRemaining && deeepJob.estimatedTimeRemaining > 0) {
        return `Estimated time remaining: ${formatTime(deeepJob.estimatedTimeRemaining)}`
      }
    } else {
      const instantEmailJob = job as ProcessingInstantEmailJob
      if (instantEmailJob.estimatedTimeRemaining && instantEmailJob.estimatedTimeRemaining > 0) {
        return `Estimated time remaining: ${formatTime(instantEmailJob.estimatedTimeRemaining)}`
      }
    }
    
    return 'Processing...'
  }

  const handleDownload = async (job: AllJobs) => {
    if (job.service === 'deeep') {
      const deeepJob = job as ProcessingJob
      if (deeepJob.download_link) {
        window.open(deeepJob.download_link, '_blank')
      }
    } else {
      const instantEmailJob = job as ProcessingInstantEmailJob
      if (instantEmailJob.status === 'complete') {
        try {
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            throw new Error('No active session')
          }

          // Call get-results to get the CSV data
          const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/get-results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              request_id: instantEmailJob.request_id
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.csv_download?.base64) {
              // Decode and download
              const csvContent = atob(result.csv_download.base64)
              const blob = new Blob([csvContent], { type: 'text/csv' })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `instantemail_results_${instantEmailJob.request_id}.csv`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
            }
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to download results')
          }
        } catch (error) {
          console.error('Error downloading InstantEmail results:', error)
          alert('Failed to download results. Please try again.')
        }
      }
    }
  }

  const handleDelete = async (jobId: string) => {
    setDeletingJobId(jobId)
    try {
      // Note: This would need to be implemented based on your requirements
      // For now, just remove from local state
      setJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (error) {
      console.error('Error deleting job:', error)
    } finally {
      setDeletingJobId(null)
    }
  }

  const getServiceIcon = (service: string) => {
    return service === 'deeep' ? <Mail className="w-4 h-4" /> : <Zap className="w-4 h-4" />
  }

  const getServiceName = (service: string) => {
    return service === 'deeep' ? 'DEEEP' : 'InstantEmail'
  }

  const getEmailCount = (job: AllJobs) => {
    if (job.service === 'deeep') {
      const deeepJob = job as ProcessingJob
      return deeepJob.num_valid_items
    } else {
      const instantEmailJob = job as ProcessingInstantEmailJob
      return instantEmailJob.submitted_emails?.length || 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading upload history...</span>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No uploads found. Start by uploading a CSV file for validation.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Upload History</h3>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={`${job.service}-${job.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getServiceIcon(job.service)}
                    <span className="font-medium">{getServiceName(job.service)}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(job.submitted_at)}</TableCell>
                <TableCell>{getEmailCount(job)}</TableCell>
                <TableCell>{getStatusBadge(job.status, job.service)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={job.progressPercentage || 0} className="w-full" />
                    <p className="text-xs text-gray-500">{getProgressMessage(job)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {job.status === 'complete' && (
                      <Button
                        onClick={() => handleDownload(job)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(job.id)}
                      size="sm"
                      variant="outline"
                      disabled={deletingJobId === job.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingJobId === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 