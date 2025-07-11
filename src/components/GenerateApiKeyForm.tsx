'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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

interface ApiKey {
  id: string
  email: string
  api_key: string
  customer_link: string | null
  created_at: string
}

interface CreditInfo {
  email: string
  api_key: string
  credits: number
  error?: string
}

export default function GenerateApiKeyForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiKeyResponse | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [creditAmounts, setCreditAmounts] = useState<{ [key: string]: string }>({})
  const [loadingCredits, setLoadingCredits] = useState<{ [key: string]: boolean }>({})
  const [creditResults, setCreditResults] = useState<{ [key: string]: { success: boolean; message: string } | null }>({})
  const [creditsList, setCreditsList] = useState<CreditInfo[]>([])
  const [loadingCreditsInfo, setLoadingCreditsInfo] = useState(true)
  const [refreshingCredits, setRefreshingCredits] = useState(false)

  // Create a single Supabase client instance
  const supabase = useMemo(() => createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  // Fetch credits function
  const fetchCredits = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Not authenticated')
        setLoadingCreditsInfo(false)
        return
      }

      const response = await fetch('/api/get-credits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCreditsList(data.credits || [])
      } else {
        console.error('Failed to fetch credits info')
      }
    } catch (error) {
      console.error('Error fetching credits info:', error)
    } finally {
      setLoadingCreditsInfo(false)
      setRefreshingCredits(false)
    }
  }, [])

  // Fetch existing API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('Not authenticated')
          setLoadingKeys(false)
          return
        }

        const response = await fetch('/api/get-api-keys', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setApiKeys(data.apiKeys || [])
        } else {
          console.error('Failed to fetch API keys')
        }
      } catch (error) {
        console.error('Error fetching API keys:', error)
      } finally {
        setLoadingKeys(false)
      }
    }

    fetchApiKeys()
  }, [supabase.auth])

  // Fetch credits on component mount
  useEffect(() => {
    fetchCredits()
  }, [])

  // Refresh API keys after successful generation
  const refreshApiKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const response = await fetch('/api/get-api-keys', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setApiKeys(data.apiKeys || [])
        }
      }
    } catch (error) {
      console.error('Error refreshing API keys:', error)
    }
  }

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
        await refreshApiKeys() // Refresh the list
        await fetchCredits() // Refresh credits info
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskApiKey = (apiKey: string) => {
    return apiKey.length > 6 ? `${apiKey.substring(0, 6)}•••` : apiKey
  }

  const getCreditsForApiKey = (apiKey: string) => {
    const creditInfo = creditsList.find(credit => credit.api_key === apiKey)
    return creditInfo?.credits || 0
  }

  // New function to handle adding 200 credits
  const handleAddCredits = async (apiKey: string) => {
    setRefreshingCredits(true)

    try {
      const response = await fetch('/api/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          credits: 200
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Immediately refresh credits after successful addition
        await fetchCredits()
      } else {
        console.error('Failed to add credits:', data.error)
      }
    } catch (error) {
      console.error('Error adding credits:', error)
    } finally {
      setRefreshingCredits(false)
    }
  }

  const handleAddCreditsWithAmount = async (apiKeyId: string, apiKey: string) => {
    const amount = creditAmounts[apiKeyId]
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setCreditResults(prev => ({
        ...prev,
        [apiKeyId]: { success: false, message: 'Please enter a valid credit amount' }
      }))
      return
    }

    setLoadingCredits(prev => ({ ...prev, [apiKeyId]: true }))
    setCreditResults(prev => ({ ...prev, [apiKeyId]: null }))

    try {
      const response = await fetch('/api/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          credits: Number(amount)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCreditResults(prev => ({
          ...prev,
          [apiKeyId]: { success: true, message: `Successfully added ${amount} credits!` }
        }))
        setCreditAmounts(prev => ({ ...prev, [apiKeyId]: '' })) // Clear input
        await fetchCredits() // Refresh credits info after adding credits
      } else {
        setCreditResults(prev => ({
          ...prev,
          [apiKeyId]: { success: false, message: data.error || 'Failed to add credits' }
        }))
      }
    } catch (error) {
      setCreditResults(prev => ({
        ...prev,
        [apiKeyId]: { success: false, message: 'Network error occurred' }
      }))
    } finally {
      setLoadingCredits(prev => ({ ...prev, [apiKeyId]: false }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate New API Key
        </h2>
        
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

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </button>
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
      </div>

      {/* Existing API Keys List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your API Keys
        </h2>
        
        {loadingKeys ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading API keys...</span>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p>No API keys generated yet.</p>
            <p className="text-sm">Generate your first API key above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">{apiKey.email}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(apiKey.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">API Key:</span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {maskApiKey(apiKey.api_key)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(apiKey.api_key)}
                              className="text-xs text-indigo-600 hover:text-indigo-500 underline"
                            >
                              Copy
                            </button>
                          </div>
                          
                          {apiKey.customer_link && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">Customer Link:</span>
                              <a 
                                href={apiKey.customer_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-600 hover:text-indigo-500 underline truncate max-w-xs"
                              >
                                {apiKey.customer_link}
                              </a>
                              <button
                                onClick={() => copyToClipboard(apiKey.customer_link!)}
                                className="text-xs text-indigo-600 hover:text-indigo-500 underline"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Credits:</span>
                            {loadingCreditsInfo || refreshingCredits ? (
                              <span className="text-sm text-gray-500">
                                {refreshingCredits ? 'Refreshing...' : 'Loading...'}
                              </span>
                            ) : (
                              <p className="text-sm text-green-700 font-medium">
                                {getCreditsForApiKey(apiKey.api_key)} 💳
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Add 200 Credits Button */}
                    <button
                      onClick={() => handleAddCredits(apiKey.api_key)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={refreshingCredits}
                    >
                      {refreshingCredits ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </div>
                      ) : (
                        'Add 200 Credits'
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Credits"
                        value={creditAmounts[apiKey.id] || ''}
                        onChange={(e) => setCreditAmounts(prev => ({
                          ...prev,
                          [apiKey.id]: e.target.value
                        }))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        disabled={loadingCredits[apiKey.id]}
                        min="1"
                      />
                      <button
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleAddCreditsWithAmount(apiKey.id, apiKey.api_key)}
                        disabled={loadingCredits[apiKey.id]}
                      >
                        {loadingCredits[apiKey.id] ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </div>
                        ) : (
                          'Add Credits'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Credit Result Message */}
                  {creditResults[apiKey.id] && (
                    <div className={`mt-3 p-2 rounded text-sm ${
                      creditResults[apiKey.id]?.success 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {creditResults[apiKey.id]?.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 