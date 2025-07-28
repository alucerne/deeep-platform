'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CsvUploader from "@/components/bulk-upload/csv-uploader"
import InstantEmailUploader from "@/components/bulk-upload/instant-email-uploader"
import UploadHistory from "@/components/bulk-upload/upload-history"
import EmailActivityStats from "@/components/analytics/EmailActivityStats"
import { useEmailStats } from "@/hooks/useEmailStats"
import Spinner from "@/components/ui/spinner"
import { Mail, Zap, BarChart3, AlertCircle, RefreshCw } from "lucide-react"

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState("deeep")
  const [selectedRequestId, setSelectedRequestId] = useState("req_1753668661539_rsw24qic6")
  const { stats, loading, error, refetch } = useEmailStats(selectedRequestId)

  return (
    <div className="space-y-6 p-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Bulk Email Validation</h1>
        <p className="text-muted-foreground">
          Choose your preferred email validation service and upload CSV files for batch processing.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Service Selection Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deeep" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              DEEEP Validation
            </TabsTrigger>
            <TabsTrigger value="instantemail" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              InstantEmail
            </TabsTrigger>
          </TabsList>

          {/* DEEEP Validation Tab */}
          <TabsContent value="deeep" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  DEEEP Email Validation
                </CardTitle>
                <CardDescription>
                  Upload CSV files for DEEEP email validation. Requires DEEEP API key and credits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CsvUploader />
              </CardContent>
            </Card>
          </TabsContent>

          {/* InstantEmail Tab */}
          <TabsContent value="instantemail" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  InstantEmail Validation
                </CardTitle>
                <CardDescription>
                  Upload CSV files for InstantEmail validation. Requires InstantEmail API key and credits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InstantEmailUploader />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Activity Statistics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Email Activity Statistics
            </CardTitle>
            <CardDescription>
              View detailed analytics and activity patterns for your email validation batches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Request ID Selector */}
            <div className="mb-6">
              <div className="flex items-end gap-3 max-w-md">
                <div className="flex-1">
                  <label htmlFor="requestId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Request ID
                  </label>
                  <input
                    type="text"
                    id="requestId"
                    value={selectedRequestId}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    placeholder="Enter request_id..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <Button
                  onClick={refetch}
                  disabled={loading}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Display */}
            {loading && (
              <div className="text-center py-12">
                <Spinner size="lg" className="mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Loading email activity statistics...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    Error Loading Stats
                  </h3>
                </div>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {error}
                </p>
                <Button
                  onClick={refetch}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            )}

            {stats && !loading && !error && (
              <div>
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">
                      Showing stats for: {stats.request_id}
                    </span>
                  </div>
                </div>
                <EmailActivityStats stats={stats} />
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Use a valid request ID from your upload history to view detailed activity statistics. 
                The stats show email activity patterns across different time periods.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
            <CardDescription>
              View your previous bulk uploads and download results from both services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 