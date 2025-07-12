'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface ApiKey {
  id: string
  email: string
  api_key: string
  customer_link: string | null
  created_at: string
}

export default function BuyCreditsStandalonePanel() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [selectedCredits, setSelectedCredits] = useState(50000)
  const [selectedApiKey, setSelectedApiKey] = useState<string>('')
  const [purchasingCredits, setPurchasingCredits] = useState(false)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!supabase) {
        setLoadingKeys(false)
        return
      }
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
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
        }
      } finally {
        setLoadingKeys(false)
      }
    }
    fetchApiKeys()
  }, [supabase])

  const handlePurchaseCredits = async () => {
    if (!selectedApiKey) {
      alert('Please select an API key')
      return
    }
    if (selectedCredits < 50000) {
      alert('Minimum credit amount is 50,000')
      return
    }
    setPurchasingCredits(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: selectedCredits,
          api_key: selectedApiKey
        })
      })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch {
      alert('Network error occurred')
    } finally {
      setPurchasingCredits(false)
    }
  }

  const price = (selectedCredits * 0.0005).toFixed(2)

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Buy Credits</h2>
      
      {loadingKeys ? (
        <div className="text-gray-500">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p>Generate an API key first to purchase credits.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label htmlFor="apiKeySelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select API Key
            </label>
            <select
              id="apiKeySelect"
              value={selectedApiKey}
              onChange={(e) => setSelectedApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose an API key...</option>
              {apiKeys.map((apiKey) => (
                <option key={apiKey.id} value={apiKey.api_key}>
                  {apiKey.email} ({apiKey.api_key.substring(0, 6)}•••)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-4">Slide to choose how many credits you want to purchase</p>
              
              <Slider
                min={50000}
                max={10000000}
                step={50000}
                value={[selectedCredits]}
                onValueChange={(v) => setSelectedCredits(v[0])}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-gray-600">Credits:</p>
                <p className="text-xl font-semibold">{selectedCredits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price:</p>
                <p className="text-xl font-semibold">${price}</p>
              </div>
            </div>

            <Button 
              onClick={handlePurchaseCredits}
              disabled={!selectedApiKey || selectedCredits < 50000 || purchasingCredits}
              className="w-full mt-6"
            >
              {purchasingCredits ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Checkout Session...
                </div>
              ) : (
                'Purchase with Stripe'
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Credit Purchase</p>
                <p className="mt-1">Purchase credits in bulk for your selected API key. Credits will be added automatically after successful payment.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 