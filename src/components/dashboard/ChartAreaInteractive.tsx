'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function ChartAreaInteractive() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [creditsList, setCreditsList] = useState<CreditInfo[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          setLoading(false)
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
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const getCreditsForApiKey = (apiKey: string) => {
    const creditInfo = creditsList.find(credit => credit.api_key === apiKey)
    return creditInfo?.credits || 0
  }

  const maxCredits = Math.max(...apiKeys.map(key => getCreditsForApiKey(key.api_key)), 1)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage by API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading chart...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (apiKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Usage by API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No API keys found.</p>
            <p className="text-sm">Generate an API key to see usage data.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Usage by API</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiKeys.map((apiKey) => {
            const credits = getCreditsForApiKey(apiKey.api_key)
            const percentage = (credits / maxCredits) * 100
            
            return (
              <div key={apiKey.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate">{apiKey.email}</span>
                  <span className="text-gray-600">{credits.toLocaleString()} credits</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 