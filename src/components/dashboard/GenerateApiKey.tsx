'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ApiKeyResponse {
  success: boolean
  apiKey?: {
    id: string
    email: string
    api_key: string
    customer_link: string | null
    created_at: string
  }
  error?: string
}

interface GenerateApiKeyProps {
  onApiKeyGenerated: () => void
}

export default function GenerateApiKey({ onApiKeyGenerated }: GenerateApiKeyProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiKeyResponse | null>(null)

  const supabase = useMemo(() => createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setResult({ success: false, error: 'Not authenticated. Please log in.' })
        return
      }

      // Call API with bearer token
      const response = await fetch('/api/create-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, apiKey: data.apiKey })
        setEmail('') // Clear form on success
        onApiKeyGenerated() // Notify parent component
      } else {
        setResult({ success: false, error: data.error || 'Failed to generate API key' })
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
    <Card>
      <CardHeader>
        <CardTitle>Generate New API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
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
              'Generate API Key'
            )}
          </Button>
        </form>

        {/* Success Message */}
        {result?.success && result.apiKey && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-green-800">API Key Generated Successfully!</h3>
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <span className="text-sm font-medium text-green-700">API Key:</span>
                <div className="mt-1 p-2 bg-green-100 rounded border font-mono text-sm text-green-800 break-all">
                  {result.apiKey.api_key}
                </div>
              </div>
              {result.apiKey.customer_link && (
                <div>
                  <span className="text-sm font-medium text-green-700">Customer Link:</span>
                  <div className="mt-1">
                    <a 
                      href={result.apiKey.customer_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-500 underline"
                    >
                      {result.apiKey.customer_link}
                    </a>
                  </div>
                </div>
              )}
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
      </CardContent>
    </Card>
  )
} 