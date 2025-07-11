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

export default function ScoreCard() {
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

  const totalCreditsUsed = creditsList.reduce((sum, credit) => sum + credit.credits, 0)
  const activeApis = apiKeys.length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-gray-600">Loading stats...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{totalCreditsUsed.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Credits Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{activeApis}</div>
            <div className="text-sm text-gray-600">Active APIs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 