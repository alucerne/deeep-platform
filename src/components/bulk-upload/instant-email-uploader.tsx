'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { parseCSVEmails, validateCSVFile, readFileAsText } from '@/lib/csv-email-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Key, Download, RefreshCw, Clock } from 'lucide-react';

interface InstantEmailApiKey {
  id: string;
  user_email: string;
  api_key: string;
  credits: number;
  created_at: string;
}

interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  isCheckingStatus: boolean;
  fileName: string | null;
  fileSize: number | null;
  parseResult: any | null;
  submitResult: any | null;
  batchStatus: any | null;
  error: string | null;
  success: string | null;
}

export default function InstantEmailUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isProcessing: false,
    isSubmitting: false,
    isCheckingStatus: false,
    fileName: null,
    fileSize: null,
    parseResult: null,
    submitResult: null,
    batchStatus: null,
    error: null,
    success: null
  });

  const [apiKeys, setApiKeys] = useState<InstantEmailApiKey[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [loadingApiKeys, setLoadingApiKeys] = useState(true);
  const [creditsList, setCreditsList] = useState<{ [key: string]: number }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  // Fetch InstantEmail API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!supabase) {
        setLoadingApiKeys(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          setLoadingApiKeys(false)
          return
        }

        // Fetch InstantEmail API keys from api_users table
        const { data: apiKeysData, error: apiKeysError } = await supabase
          .from('api_users')
          .select('id, user_email, api_key, credits, created_at')
          .order('created_at', { ascending: false })

        if (apiKeysError) {
          console.error('Error fetching InstantEmail API keys:', apiKeysError)
          setLoadingApiKeys(false)
          return
        }

        setApiKeys(apiKeysData || [])
        
        // Set the first API key as selected if available
        if (apiKeysData && apiKeysData.length > 0) {
          setSelectedApiKey(apiKeysData[0].api_key)
          
          // Create credits mapping
          const creditsMap: { [key: string]: number } = {}
          apiKeysData.forEach(key => {
            creditsMap[key.api_key] = key.credits
          })
          setCreditsList(creditsMap)
        }

        setLoadingApiKeys(false)
      } catch (error) {
        console.error('Error fetching InstantEmail API keys:', error)
        setLoadingApiKeys(false)
      }
    }

    fetchApiKeys()
  }, [supabase])

  const getCreditsForApiKey = (apiKey: string) => {
    return creditsList[apiKey] || 0
  }

  const getSelectedApiKeyInfo = () => {
    return apiKeys.find(key => key.api_key === selectedApiKey)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      success: null,
      parseResult: null,
      submitResult: null,
      batchStatus: null
    }));

    try {
      // Validate file
      const validation = validateCSVFile(file);
      if (!validation.valid) {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          error: validation.errors.join(', ')
        }));
        return;
      }

      // Read file content
      const content = await readFileAsText(file);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: true,
        fileName: file.name,
        fileSize: file.size
      }));

      // Parse CSV
      const parseResult = parseCSVEmails(content, {
        columnIndex: 0,
        hasHeader: true,
        delimiter: ',',
        maxEmails: 10000
      });

      setUploadState(prev => ({
        ...prev,
        isProcessing: false,
        parseResult,
        success: `Successfully processed ${parseResult.validEmails} valid emails`
      }));

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process file'
      }));
    }
  };

  const handleSubmitBatch = async () => {
    if (!uploadState.parseResult?.emails?.length) return;

    if (!selectedApiKey) {
      setUploadState(prev => ({
        ...prev,
        error: 'Please select an InstantEmail API key'
      }));
      return;
    }

    // Check if user has enough credits
    const requiredCredits = uploadState.parseResult.emails.length;
    const availableCredits = getCreditsForApiKey(selectedApiKey);
    
    if (availableCredits < requiredCredits) {
      setUploadState(prev => ({
        ...prev,
        error: `Insufficient credits. You have ${availableCredits} credits but need ${requiredCredits} credits for this batch.`
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      submitResult: null,
      batchStatus: null
    }));

    try {
      // Submit batch to API
      const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/submit-csv-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          api_key: selectedApiKey,
          emails: uploadState.parseResult.emails
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit batch');
      }

      setUploadState(prev => ({
        ...prev,
        isSubmitting: false,
        submitResult: result,
        success: `Batch submitted successfully! Request ID: ${result.request_id}. Estimated processing time: ${result.estimated_time_minutes} minutes.`
      }));

      // Start checking status after a delay
      setTimeout(() => {
        handleCheckStatus(result.request_id);
      }, 6000); // 6 seconds to allow for webhook processing

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit batch'
      }));
    }
  };

  const handleCheckStatus = async (requestId?: string) => {
    const requestIdToCheck = requestId || uploadState.submitResult?.request_id;
    
    if (!requestIdToCheck || !selectedApiKey) {
      setUploadState(prev => ({
        ...prev,
        error: 'No request ID available for status check'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isCheckingStatus: true,
      error: null
    }));

    try {
      // Check batch status
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No active session')
      }

      const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/get-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          request_id: requestIdToCheck
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check batch status');
      }

      setUploadState(prev => ({
        ...prev,
        isCheckingStatus: false,
        batchStatus: result
      }));

      // If still processing, check again in 10 seconds
      if (result.status === 'processing') {
        setTimeout(() => {
          handleCheckStatus(requestIdToCheck);
        }, 10000);
      }

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isCheckingStatus: false,
        error: error instanceof Error ? error.message : 'Failed to check batch status'
      }));
    }
  };

  const handleDownloadResults = async () => {
    if (!uploadState.batchStatus?.csv_download?.base64) {
      setUploadState(prev => ({
        ...prev,
        error: 'No results available for download'
      }));
      return;
    }

    try {
      // Decode base64 CSV content
      const csvContent = atob(uploadState.batchStatus.csv_download.base64);
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadState.batchStatus.csv_download.filename || 'email_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setUploadState(prev => ({
        ...prev,
        success: 'Results downloaded successfully!'
      }));

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        error: 'Failed to download results'
      }));
    }
  };

  const handleReset = () => {
    setUploadState({
      isUploading: false,
      isProcessing: false,
      isSubmitting: false,
      isCheckingStatus: false,
      fileName: null,
      fileSize: null,
      parseResult: null,
      submitResult: null,
      batchStatus: null,
      error: null,
      success: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const maskApiKey = (apiKey: string) => {
    if (!apiKey) return '';
    return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            InstantEmail CSV Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing email addresses for batch processing with the InstantEmail API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select InstantEmail API Key
            </label>
            {loadingApiKeys ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                <span>Loading API keys...</span>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-700">
                    No InstantEmail API keys found. Please generate an API key first.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.map((apiKey) => (
                      <SelectItem key={apiKey.id} value={apiKey.api_key}>
                        <div className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            <Key className="h-3 w-3" />
                            {maskApiKey(apiKey.api_key)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {apiKey.credits} credits
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedApiKey && (
                  <div className="text-sm text-gray-600">
                    Selected: {maskApiKey(selectedApiKey)} • {getCreditsForApiKey(selectedApiKey)} credits available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting || !selectedApiKey}
            />
            <div className="space-y-2">
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                {uploadState.fileName ? (
                  <span className="font-medium text-green-600">{uploadState.fileName}</span>
                ) : (
                  'Click to select a CSV file or drag and drop'
                )}
              </p>
              {uploadState.fileSize && (
                <p className="text-xs text-gray-500">
                  Size: {formatFileSize(uploadState.fileSize)}
                </p>
              )}
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting || !selectedApiKey}
                variant="outline"
              >
                Select File
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          {(uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting || uploadState.isCheckingStatus) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {uploadState.isUploading ? 'Uploading file...' : 
                   uploadState.isProcessing ? 'Processing emails...' : 
                   uploadState.isSubmitting ? 'Submitting batch...' :
                   'Checking batch status...'}
                </span>
                <span className="text-gray-500">
                  {uploadState.isUploading ? 'Reading file' : 
                   uploadState.isProcessing ? 'Parsing CSV' : 
                   uploadState.isSubmitting ? 'Sending to API' :
                   'Polling for results'}
                </span>
              </div>
              <Progress value={
                uploadState.isUploading ? 25 : 
                uploadState.isProcessing ? 50 : 
                uploadState.isSubmitting ? 75 :
                100
              } className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {uploadState.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{uploadState.error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uploadState.success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{uploadState.success}</AlertDescription>
            </Alert>
          )}

          {/* Parse Results */}
          {uploadState.parseResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parse Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadState.parseResult.totalRows}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadState.parseResult.validEmails}
                    </div>
                    <div className="text-sm text-gray-600">Valid Emails</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {uploadState.parseResult.duplicates}
                    </div>
                    <div className="text-sm text-gray-600">Duplicates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadState.parseResult.invalidEmails}
                    </div>
                    <div className="text-sm text-gray-600">Invalid</div>
                  </div>
                </div>

                {/* Credit Check */}
                {selectedApiKey && uploadState.parseResult.emails.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Credit Check:</span>
                      <div className="text-sm text-blue-600">
                        <span className={getCreditsForApiKey(selectedApiKey) >= uploadState.parseResult.emails.length ? 'text-green-600' : 'text-red-600'}>
                          {getCreditsForApiKey(selectedApiKey)} available / {uploadState.parseResult.emails.length} required
                        </span>
                      </div>
                    </div>
                    {getCreditsForApiKey(selectedApiKey) < uploadState.parseResult.emails.length && (
                      <p className="text-xs text-red-600 mt-1">
                        Insufficient credits. Please purchase more credits or reduce the batch size.
                      </p>
                    )}
                  </div>
                )}

                {/* Sample Emails */}
                {uploadState.parseResult.emails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Sample Emails ({uploadState.parseResult.emails.length} total):</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadState.parseResult.emails.slice(0, 10).map((email: string, index: number) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          {email}
                        </div>
                      ))}
                      {uploadState.parseResult.emails.length > 10 && (
                        <div className="text-sm text-gray-500 italic">
                          ... and {uploadState.parseResult.emails.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Results */}
                {uploadState.submitResult && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Batch Submission Results:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Request ID:</span>
                        <span className="text-sm text-gray-600 font-mono">{uploadState.submitResult.request_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Emails Submitted:</span>
                        <span className="text-sm text-gray-600">{uploadState.submitResult.emails_submitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Credits Deducted:</span>
                        <span className="text-sm text-gray-600">{uploadState.submitResult.credits_deducted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Remaining Credits:</span>
                        <span className="text-sm text-gray-600">{uploadState.submitResult.remaining_credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Estimated Time:</span>
                        <span className="text-sm text-gray-600">{uploadState.submitResult.estimated_time_minutes} minutes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Batch Status */}
                {uploadState.batchStatus && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Batch Status:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <div className="flex items-center gap-2">
                          {uploadState.batchStatus.status === 'complete' ? (
                            <Badge className="bg-green-100 text-green-800">Complete</Badge>
                          ) : uploadState.batchStatus.status === 'processing' ? (
                            <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Results Count:</span>
                        <span className="text-sm text-gray-600">{uploadState.batchStatus.results_count || 0}</span>
                      </div>
                      {uploadState.batchStatus.summary && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-700">Summary:</div>
                          <div className="text-xs text-gray-600">
                            {uploadState.batchStatus.summary.valid_emails || 0} valid, {uploadState.batchStatus.summary.invalid_emails || 0} invalid
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Download Results */}
                {uploadState.batchStatus?.status === 'complete' && uploadState.batchStatus?.csv_download && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Download Results:</h4>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Results ready for download
                          </span>
                        </div>
                        <Button
                          onClick={handleDownloadResults}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download CSV
                        </Button>
                      </div>
                      <div className="text-xs text-green-600 mt-2">
                        File: {uploadState.batchStatus.csv_download.filename} ({uploadState.batchStatus.csv_download.size_bytes} bytes)
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!uploadState.submitResult ? (
                    <Button
                      onClick={handleSubmitBatch}
                      disabled={!uploadState.parseResult.emails.length || uploadState.isSubmitting || !selectedApiKey || getCreditsForApiKey(selectedApiKey) < uploadState.parseResult.emails.length}
                      className="flex-1"
                    >
                      {uploadState.isSubmitting ? 'Submitting...' : 'Submit Batch'}
                    </Button>
                  ) : uploadState.batchStatus?.status === 'processing' ? (
                    <Button
                      onClick={() => handleCheckStatus()}
                      disabled={uploadState.isCheckingStatus}
                      className="flex-1"
                    >
                      {uploadState.isCheckingStatus ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </>
                      )}
                    </Button>
                  ) : uploadState.batchStatus?.status === 'complete' ? (
                    <Button
                      onClick={handleDownloadResults}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Results
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={uploadState.isSubmitting || uploadState.isCheckingStatus}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 