'use client';

import React, { useState, useRef } from 'react';
import { parseCSVEmails, validateCSVFile, readFileAsText } from '@/lib/csv-email-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface UploadState {
  isUploading: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  fileName: string | null;
  fileSize: number | null;
  parseResult: any | null;
  submitResult: any | null;
  error: string | null;
  success: string | null;
}

export default function InstantEmailUploader() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isProcessing: false,
    isSubmitting: false,
    fileName: null,
    fileSize: null,
    parseResult: null,
    submitResult: null,
    error: null,
    success: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      submitResult: null
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

    setUploadState(prev => ({
      ...prev,
      isSubmitting: true,
      error: null,
      submitResult: null
    }));

    try {
      // Get API key from localStorage or prompt user
      const apiKey = localStorage.getItem('instant_email_api_key');
      if (!apiKey) {
        const userApiKey = prompt('Please enter your InstantEmail API key:');
        if (!userApiKey) {
          setUploadState(prev => ({
            ...prev,
            isSubmitting: false,
            error: 'API key is required to submit batch'
          }));
          return;
        }
        localStorage.setItem('instant_email_api_key', userApiKey);
      }

      const currentApiKey = apiKey || localStorage.getItem('instant_email_api_key');

      // Submit batch to API
      const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/submit-csv-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: currentApiKey,
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

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit batch'
      }));
    }
  };

  const handleReset = () => {
    setUploadState({
      isUploading: false,
      isProcessing: false,
      isSubmitting: false,
      fileName: null,
      fileSize: null,
      parseResult: null,
      submitResult: null,
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
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting}
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
                disabled={uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting}
                variant="outline"
              >
                Select File
              </Button>
            </div>
          </div>

          {/* Progress Indicators */}
          {(uploadState.isUploading || uploadState.isProcessing || uploadState.isSubmitting) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {uploadState.isUploading ? 'Uploading file...' : 
                   uploadState.isProcessing ? 'Processing emails...' : 
                   'Submitting batch...'}
                </span>
                <span className="text-gray-500">
                  {uploadState.isUploading ? 'Reading file' : 
                   uploadState.isProcessing ? 'Parsing CSV' : 
                   'Sending to API'}
                </span>
              </div>
              <Progress value={
                uploadState.isUploading ? 33 : 
                uploadState.isProcessing ? 66 : 
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitBatch}
                    disabled={!uploadState.parseResult.emails.length || uploadState.isSubmitting}
                    className="flex-1"
                  >
                    {uploadState.isSubmitting ? 'Submitting...' : 'Submit Batch'}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={uploadState.isSubmitting}
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