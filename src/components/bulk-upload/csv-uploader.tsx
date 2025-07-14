'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface BatchResponse {
  message: string
  batch_id: string
  num_valid_items: number
  remaining_credits: number
}

interface ApiKey {
  id: string
  email: string
  api_key: string
  customer_link: string
  created_at: string
}

interface CreditInfo {
  email: string
  api_key: string
  credits: number
  error?: string
}

export default function CsvUploader() {
  const [emails, setEmails] = useState<string[]>([])
  const [previewEmails, setPreviewEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedApiKey, setSelectedApiKey] = useState<string>('')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [creditsList, setCreditsList] = useState<CreditInfo[]>([])
  const [loadingApiKeys, setLoadingApiKeys] = useState(true)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  // Create a service role client for database operations
  const supabaseService = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('Supabase service role key not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, serviceRoleKey)
  }, [])

  // Fetch API keys and credits on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoadingApiKeys(false)
        setLoadingCredits(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          setLoadingApiKeys(false)
          setLoadingCredits(false)
          return
        }

        // Fetch API keys
        const apiKeysResponse = await fetch('/api/get-api-keys', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (apiKeysResponse.ok) {
          const apiKeysData = await apiKeysResponse.json()
          setApiKeys(apiKeysData.apiKeys || [])
          
          // Set the first API key as selected if available
          if (apiKeysData.apiKeys && apiKeysData.apiKeys.length > 0) {
            setSelectedApiKey(apiKeysData.apiKeys[0].api_key)
          }
        }

        // Fetch credits
        const creditsResponse = await fetch('/api/get-credits', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          setCreditsList(creditsData.credits || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingApiKeys(false)
        setLoadingCredits(false)
      }
    }

    fetchData()
  }, [supabase])

  const getCreditsForApiKey = (apiKey: string) => {
    const creditInfo = creditsList.find(credit => credit.api_key === apiKey)
    return creditInfo?.credits || 0
  }

  const getSelectedApiKeyInfo = () => {
    return apiKeys.find(key => key.api_key === selectedApiKey)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setError(null)
    setSuccess(null)

    // Parse CSV file
    Papa.parse(selectedFile, {
      complete: (results) => {
        const parsedEmails: string[] = []
        // Type guard for array of string arrays
        if (Array.isArray(results.data) && results.data.every(row => Array.isArray(row))) {
          (results.data as string[][]).forEach((row) => {
            if (row && row[0] && typeof row[0] === 'string') {
              const email = row[0].trim()
              if (email && email.includes('@')) {
                parsedEmails.push(email)
              }
            }
          })
        }

        if (parsedEmails.length === 0) {
          setError('No valid email addresses found in the CSV file')
          return
        }

        setEmails(parsedEmails)
        setPreviewEmails(parsedEmails.slice(0, 10))
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`)
      }
    })
  }

  const handleSubmit = async () => {
    if (!emails.length || !supabase) {
      setError('No emails to process or Supabase not initialized')
      return
    }

    if (!selectedApiKey) {
      setError('Please select an API key')
      return
    }

    // Check if user has enough credits
    const availableCredits = getCreditsForApiKey(selectedApiKey)
    const requiredCredits = emails.length

    if (availableCredits < requiredCredits) {
      setError(`Insufficient credits. You have ${availableCredits} credits but need ${requiredCredits} credits for ${emails.length} emails.`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    console.log('🚀 Starting batch submission...')
    console.log('📧 Emails to process:', emails.length)
    console.log('💳 Credits required:', requiredCredits)
    console.log('💳 Available credits:', availableCredits)

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Not authenticated. Please log in.')
        return
      }

      console.log('✅ User authenticated:', session.user.id)

      const user_id = session.user.id

      console.log('🔑 Using API key:', selectedApiKey.substring(0, 8) + '...')
      console.log('👤 User ID:', user_id)

      // Submit to batch API
      const callbackUrl = `${window.location.origin}/api/callback/${user_id}`
      console.log('🔗 Callback URL:', callbackUrl)
      
      const batchResponse = await fetch(`https://al-api.proxy4smtp.com/audlabapi/${selectedApiKey}/email-validate-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          callback_url: callbackUrl,
          items: emails.join(',')
        })
      })

      console.log('📡 Batch API response status:', batchResponse.status)

      if (!batchResponse.ok) {
        const errorText = await batchResponse.text()
        console.error('❌ Batch API error:', errorText)
        setError(`Batch API error: ${errorText}`)
        return
      }

      const batchData: BatchResponse = await batchResponse.json()
      console.log('✅ Batch API response:', batchData)
      
      // Deduct credits from the API key
      console.log('💳 Deducting credits...')
      const deductResponse = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: selectedApiKey,
          credits: requiredCredits
        })
      })

      if (!deductResponse.ok) {
        const errorText = await deductResponse.text()
        console.error('❌ Credit deduction error:', errorText)
        setError('Failed to deduct credits. Please try again.')
        return
      }

      console.log('✅ Credits deducted successfully')
      
      // Store in Supabase via API endpoint
      const jobResponse = await fetch('/api/create-bulk-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id,
          batch_id: batchData.batch_id,
          num_valid_items: batchData.num_valid_items,
          remaining_credits: batchData.remaining_credits,
          api_key: selectedApiKey
        })
      })

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text()
        console.error('❌ Job creation error:', errorText)
        setError('Failed to save job to database')
        return
      }

      const jobData = await jobResponse.json()
      console.log('💾 Job saved to database successfully:', jobData)

      setSuccess(`Batch job submitted successfully! Batch ID: ${batchData.batch_id}. ${requiredCredits} credits deducted.`)
      setEmails([])
      setPreviewEmails([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('❌ Error submitting batch:', err)
      setError('Failed to submit batch job. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setEmails([])
    setPreviewEmails([])
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const maskApiKey = (apiKey: string) => {
    return apiKey.length > 6 ? `${apiKey.substring(0, 6)}•••` : apiKey
  }

  if (loadingApiKeys || loadingCredits) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading API keys and credits...</span>
      </div>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">No API Keys Found</h3>
        <p className="text-muted-foreground mb-4">
          You need to generate an API key before you can use bulk upload.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  const selectedApiKeyInfo = getSelectedApiKeyInfo()
  const availableCredits = getCreditsForApiKey(selectedApiKey)
  const requiredCredits = emails.length
  const hasEnoughCredits = availableCredits >= requiredCredits

  return (
    <div className="space-y-4">
      {/* API Key Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select API Key</label>
        <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
          <SelectTrigger>
            <SelectValue placeholder="Select an API key" />
          </SelectTrigger>
          <SelectContent>
            {apiKeys.map((apiKey) => (
              <SelectItem key={apiKey.id} value={apiKey.api_key}>
                <div className="flex items-center justify-between w-full">
                  <span>{apiKey.email}</span>
                  <span className="text-muted-foreground ml-2">
                    {maskApiKey(apiKey.api_key)} • {getCreditsForApiKey(apiKey.api_key)} credits
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedApiKeyInfo && (
          <p className="text-sm text-muted-foreground">
            Using: {selectedApiKeyInfo.email} ({maskApiKey(selectedApiKeyInfo.api_key)}) • {availableCredits} credits available
          </p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="cursor-pointer"
        />
        <p className="text-sm text-muted-foreground">
          Select a CSV file with email addresses in the first column
        </p>
      </div>

      {/* Credit Warning */}
      {emails.length > 0 && !hasEnoughCredits && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Insufficient credits. You have {availableCredits} credits but need {requiredCredits} credits for {emails.length} emails.
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">{success}</span>
        </div>
      )}

      {/* Email Preview */}
      {previewEmails.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Preview ({emails.length} emails total)</h4>
          <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
            <div className="text-sm space-y-1">
              {previewEmails.map((email, index) => (
                <div key={index} className="text-muted-foreground">{email}</div>
              ))}
              {emails.length > 10 && (
                <div className="text-muted-foreground italic">
                  ... and {emails.length - 10} more emails
                </div>
              )}
            </div>
          </div>
          {emails.length > 0 && (
            <div className="text-sm text-muted-foreground">
              💳 This will cost {requiredCredits} credits ({availableCredits} available)
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!emails.length || loading || !selectedApiKey || !hasEnoughCredits}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Submit Batch ({requiredCredits} credits)
            </>
          )}
        </Button>
        
        {emails.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
} 