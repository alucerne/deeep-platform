'use client'

import { useState, useRef, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react'

interface BatchResponse {
  message: string
  batch_id: string
  num_valid_items: number
  remaining_credits: number
}

export default function CsvUploader() {
  // Removed unused 'file' state
  const [emails, setEmails] = useState<string[]>([])
  const [previewEmails, setPreviewEmails] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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

    setLoading(true)
    setError(null)
    setSuccess(null)
    
    console.log('🚀 Starting batch submission...')
    console.log('📧 Emails to process:', emails.length)

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('Not authenticated. Please log in.')
        return
      }

      console.log('✅ User authenticated:', session.user.id)

      // Get user's API keys
      const apiKeysResponse = await fetch('/api/get-api-keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!apiKeysResponse.ok) {
        setError('Failed to fetch API keys')
        return
      }

      const apiKeysData = await apiKeysResponse.json()
      if (!apiKeysData.apiKeys || apiKeysData.apiKeys.length === 0) {
        setError('No API keys found. Please generate an API key first.')
        return
      }

      // Use the first API key
      const apiKey = apiKeysData.apiKeys[0].api_key
      const user_id = session.user.id

      console.log('🔑 Using API key:', apiKey.substring(0, 8) + '...')
      console.log('👤 User ID:', user_id)

      // Submit to batch API
      const callbackUrl = `${window.location.origin}/api/callback/${user_id}`
      console.log('🔗 Callback URL:', callbackUrl)
      
      const batchResponse = await fetch(`https://al-api.proxy4smtp.com/audlabapi/${apiKey}/email-validate-batch`, {
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
          remaining_credits: batchData.remaining_credits
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

      setSuccess(`Batch job submitted successfully! Batch ID: ${batchData.batch_id}`)
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

  return (
    <div className="space-y-4">
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
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={!emails.length || loading}
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
              Submit Batch
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