'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

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

export default function ApiKeysList() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [creditsList, setCreditsList] = useState<CreditInfo[]>([])
  const [loadingCreditsInfo, setLoadingCreditsInfo] = useState(true)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  // Fetch credits function
  const fetchCreditsInfo = useCallback(async () => {
    try {
      if (!supabase) {
        setLoadingCreditsInfo(false)
        return
      }
      
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
    }
  }, [supabase])

  // Fetch existing API keys on component mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        if (!supabase) {
          setLoadingKeys(false)
          return
        }
        
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
  }, [supabase])

  // Fetch credits on component mount
  useEffect(() => {
    fetchCreditsInfo()
  }, [fetchCreditsInfo])

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

  const handleAddCredits = () => {
    router.push('/dashboard/credits')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your API Keys</CardTitle>
      </CardHeader>
      <CardContent>
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
            <p className="text-sm">Generate your first API key to get started.</p>
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
                            {loadingCreditsInfo ? (
                              <span className="text-sm text-gray-500">Loading...</span>
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
                    <Button
                      onClick={handleAddCredits}
                      size="sm"
                    >
                      Add Credits
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 