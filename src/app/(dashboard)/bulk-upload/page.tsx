'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CSVUploader from '@/components/bulk-upload/csv-uploader'
import UploadHistory from '@/components/bulk-upload/upload-history'
import InstantEmailUploader from '@/components/bulk-upload/instant-email-uploader'
import EmailActivityStats from '@/components/analytics/EmailActivityStats'
import { useEmailStats } from '@/hooks/useEmailStats'
import { Spinner, BarChart3, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@supabase/supabase-js'

export default function BulkUploadPage() {
  const [selectedRequestId, setSelectedRequestId] = useState<string>('req_xyz')
  const [availableRequestIds, setAvailableRequestIds] = useState<string[]>([])
  const [loadingRequestIds, setLoadingRequestIds] = useState(false)
  
  const { stats, loading, error, refetch } = useEmailStats(selectedRequestId)

  // Fetch available request IDs from user's InstantEmail batches
  const fetchAvailableRequestIds = async () => {
    setLoadingRequestIds(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.email) return

      const { data: batches } = await supabase
        .from('instant_email_batches')
        .select('request_id')
        .eq('user_email', session.user.email)
        .eq('status', 'complete')
        .order('submitted_at', { ascending: false })

      if (batches) {
        const requestIds = batches.map(batch => batch.request_id)
        setAvailableRequestIds(requestIds)
        
        // Set the first available request ID as default if none selected
        if (requestIds.length > 0 && !requestIds.includes(selectedRequestId)) {
          setSelectedRequestId(requestIds[0])
        }
      }
    } catch (error) {
      console.error('Error fetching request IDs:', error)
    } finally {
      setLoadingRequestIds(false)
    }
  }

  // Load request IDs on component mount
  useEffect(() => {
    fetchAvailableRequestIds()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Validation</h1>
        <p className="text-muted-foreground">
          Upload CSV files to validate email addresses using DEEEP or InstantEmail services.
        </p>
      </div>

      <Tabs defaultValue="deeep" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deeep">DEEEP Validation</TabsTrigger>
          <TabsTrigger value="instantemail">InstantEmail Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="deeep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with email addresses for DEEEP validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instantemail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload</CardTitle>
              <CardDescription>
                Upload a CSV file with email addresses for InstantEmail validation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstantEmailUploader />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Activity Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Email Activity Statistics
          </CardTitle>
          <CardDescription>
            View detailed analytics for your email validation batches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Request ID</label>
              <div className="flex gap-2">
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a request ID..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingRequestIds ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <Spinner className="w-4 h-4 animate-spin" />
                          Loading...
                        </div>
                      </SelectItem>
                    ) : availableRequestIds.length > 0 ? (
                      availableRequestIds.map((requestId) => (
                        <SelectItem key={requestId} value={requestId}>
                          {requestId}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No completed batches found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={fetchAvailableRequestIds} 
                  variant="outline" 
                  size="sm"
                  disabled={loadingRequestIds}
                >
                  {loadingRequestIds ? (
                    <Spinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading statistics...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Error loading statistics</p>
                <p className="text-sm">{error}</p>
                <Button 
                  onClick={refetch} 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : stats ? (
            <EmailActivityStats stats={stats} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No statistics available for this request ID</p>
              <p className="text-sm">Complete a batch to see analytics</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            View all your email validation batches and download results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadHistory />
        </CardContent>
      </Card>
    </div>
  )
} 