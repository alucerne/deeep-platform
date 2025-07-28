'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from "@/components/ui/button"

interface InstantEmailApiKeyResponse {
  success: boolean
  api_key?: string
  credits?: number
  error?: string
}

interface GenerateInstantEmailKeyProps {
  onApiKeyGenerated: () => void
}

export default function GenerateInstantEmailKey({ onApiKeyGenerated }: GenerateInstantEmailKeyProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InstantEmailApiKeyResponse | null>(null)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setResult({ success: false, error: 'Email is required' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Get current session
      if (!supabase) {
        setResult({ success: false, error: 'Supabase client not initialized' })
        return
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setResult({ success: false, error: 'Not authenticated. Please log in.' })
        return
      }

      // Call InstantEmail generate-key Edge Function with proper authorization
      const response = await fetch('https://hapmnlakorkoklzfovne.functions.supabase.co/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          user_email: email.trim() 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ 
          success: true, 
          api_key: data.api_key,
          credits: data.credits || 0
        })
        setEmail('') // Clear form on success
        onApiKeyGenerated() // Notify parent component
      } else {
        setResult({ success: false, error: data.error || 'Failed to generate InstantEmail API key' })
      }
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="instantemail-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="instantemail-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            disabled={loading}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </div>
          ) : (
            'Generate InstantEmail API Key'
          )}
        </Button>
      </form>

      {/* Success Message */}
      {result?.success && result.api_key && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-green-800">InstantEmail API Key Generated Successfully!</h3>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-sm font-medium text-green-700">API Key:</span>
              <div className="mt-1 p-2 bg-green-100 rounded border font-mono text-sm text-green-800 break-all">
                {result.api_key}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-green-700">Initial Credits:</span>
              <div className="mt-1 text-sm text-green-700">
                {result.credits} credits
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                <strong>Next Steps:</strong> Use this API key in the InstantEmail tab of the Email Validation page to upload CSV files for validation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {result?.success === false && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{result.error}</p>
        </div>
      )}
    </div>
  )
} 