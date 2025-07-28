'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from 'next/navigation'
import { Mail, Zap, Copy, ExternalLink, CreditCard, RefreshCw } from 'lucide-react'

interface DeeepApiKey {
  id: string
  email: string
  api_key: string
  customer_link: string | null
  created_at: string
}

interface InstantEmailApiKey {
  id: string
  user_email: string
  api_key: string
  credits: number
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
  const [deeepApiKeys, setDeeepApiKeys] = useState<DeeepApiKey[]>([])
  const [instantEmailApiKeys, setInstantEmailApiKeys] = useState<InstantEmailApiKey[]>([])
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

  // Fetch credits function for DEEEP API keys
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

        // Fetch DEEEP API keys
        const deeepResponse = await fetch('/api/get-api-keys', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (deeepResponse.ok) {
          const deeepData = await deeepResponse.json()
          setDeeepApiKeys(deeepData.apiKeys || [])
        } else {
          console.error('Failed to fetch DEEEP API keys')
        }

        // Fetch InstantEmail API keys
        const { data: instantEmailKeys, error: instantEmailError } = await supabase
          .from('api_users')
          .select('*')
          .eq('user_email', session.user.email)
          .order('created_at', { ascending: false })

        if (instantEmailError) {
          console.error('Failed to fetch InstantEmail API keys:', instantEmailError)
        } else {
          setInstantEmailApiKeys(instantEmailKeys || [])
        }

      } catch (error) {
        console.error('Error fetching API keys:', error)
      } finally {
        setLoadingKeys(false)
      }
    }

    fetchApiKeys()
  }, [supabase])

  // Refresh API keys function
  const refreshApiKeys = useCallback(async () => {
    setLoadingKeys(true)
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

      // Fetch DEEEP API keys
      const deeepResponse = await fetch('/api/get-api-keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (deeepResponse.ok) {
        const deeepData = await deeepResponse.json()
        setDeeepApiKeys(deeepData.apiKeys || [])
      } else {
        console.error('Failed to fetch DEEEP API keys')
      }

      // Fetch InstantEmail API keys
      const { data: instantEmailKeys, error: instantEmailError } = await supabase
        .from('api_users')
        .select('*')
        .eq('user_email', session.user.email)
        .order('created_at', { ascending: false })

      if (instantEmailError) {
        console.error('Failed to fetch InstantEmail API keys:', instantEmailError)
      } else {
        setInstantEmailApiKeys(instantEmailKeys || [])
      }

    } catch (error) {
      console.error('Error refreshing API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }, [supabase])

  // Fetch credits on component mount
  useEffect(() => {
    fetchCreditsInfo()
  }, [fetchCreditsInfo])

  // Refresh API keys when page becomes visible (user returns from generate page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshApiKeys()
      }
    }

    const handleFocus = () => {
      refreshApiKeys()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshApiKeys])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskApiKey = (apiKey: string) => {
    return apiKey.length > 8 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : apiKey
  }

  const getCreditsForDeeepApiKey = (apiKey: string) => {
    const creditInfo = creditsList.find(credit => credit.api_key === apiKey)
    return creditInfo ? creditInfo.credits : 'N/A'
  }

  const handleAddCredits = () => {
    router.push('/dashboard/credits')
  }

  const handleGenerateDeeepKey = () => {
    router.push('/generate')
  }

  const handleGenerateInstantEmailKey = () => {
    router.push('/generate')
  }

  const totalApiKeys = deeepApiKeys.length + instantEmailApiKeys.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your API Keys</CardTitle>
        <Button onClick={refreshApiKeys} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
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
        ) : totalApiKeys === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p>No API keys generated yet.</p>
            <p className="text-sm">Generate your first API key to get started.</p>
            <div className="mt-4 space-x-2">
              <Button onClick={handleGenerateDeeepKey} size="sm">
                Generate DEEEP Key
              </Button>
              <Button onClick={handleGenerateInstantEmailKey} size="sm" variant="outline">
                Generate InstantEmail Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* DEEEP API Keys Section */}
            {deeepApiKeys.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">DEEEP Validation API Keys</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {deeepApiKeys.length} key{deeepApiKeys.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {deeepApiKeys.map((apiKey) => (
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
                                    className="text-xs text-indigo-600 hover:text-indigo-500 underline flex items-center gap-1"
                                  >
                                    <Copy className="h-3 w-3" />
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
                                      className="text-sm text-indigo-600 hover:text-indigo-500 underline truncate max-w-xs flex items-center gap-1"
                                    >
                                      {apiKey.customer_link}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(apiKey.customer_link!)}
                                      className="text-xs text-indigo-600 hover:text-indigo-500 underline flex items-center gap-1"
                                    >
                                      <Copy className="h-3 w-3" />
                                      Copy
                                    </button>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-700">Credits:</span>
                                  {loadingCreditsInfo ? (
                                    <span className="text-sm text-gray-500">Loading...</span>
                                  ) : (
                                    <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                                      <CreditCard className="h-3 w-3" />
                                      {getCreditsForDeeepApiKey(apiKey.api_key)} 💳
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
              </div>
            )}

            {/* InstantEmail API Keys Section */}
            {instantEmailApiKeys.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">InstantEmail API Keys</h3>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {instantEmailApiKeys.length} key{instantEmailApiKeys.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {instantEmailApiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-900">{apiKey.user_email}</span>
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
                                    className="text-xs text-indigo-600 hover:text-indigo-500 underline flex items-center gap-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                    Copy
                                  </button>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-700">Credits:</span>
                                  <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {apiKey.credits} 💳
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            onClick={() => router.push('/buy-credits')}
                            size="sm"
                            variant="outline"
                          >
                            Buy Credits
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate New Keys Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Need more API keys?</h4>
                  <p className="text-xs text-gray-500">Generate additional keys for different services</p>
                </div>
                <div className="space-x-2">
                  <Button onClick={handleGenerateDeeepKey} size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    DEEEP Key
                  </Button>
                  <Button onClick={handleGenerateInstantEmailKey} size="sm" variant="outline">
                    <Zap className="h-4 w-4 mr-1" />
                    InstantEmail Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 