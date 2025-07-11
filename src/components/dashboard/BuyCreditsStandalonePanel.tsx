'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

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
  const [creditBundleAmount, setCreditBundleAmount] = useState(1000)
  const [selectedApiKey, setSelectedApiKey] = useState<string>('')
  const [purchasingCredits, setPurchasingCredits] = useState(false)

  const supabase = useMemo(() => createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const fetchApiKeys = async () => {
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
    if (creditBundleAmount < 1000) {
      alert('Minimum credit amount is 1000')
      return
    }
    setPurchasingCredits(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: creditBundleAmount,
          api_key: selectedApiKey
        })
      })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      alert('Network error occurred')
    } finally {
      setPurchasingCredits(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Buy Credit Bundles</h2>
      {loadingKeys ? (
        <div className="text-gray-500">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p>Generate an API key first to purchase credit bundles.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
          <div>
            <label htmlFor="creditAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Credit Amount
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                id="creditAmount"
                value={creditBundleAmount}
                onChange={(e) => setCreditBundleAmount(Number(e.target.value))}
                min="1000"
                step="1000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1000"
              />
              <span className="text-sm text-gray-500">credits</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum: 1,000 credits | Increments: 1,000 credits
            </p>
          </div>
          <button
            onClick={handlePurchaseCredits}
            disabled={!selectedApiKey || creditBundleAmount < 1000 || purchasingCredits}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              `Purchase ${creditBundleAmount.toLocaleString()} Credits`
            )}
          </button>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Credit Bundle Purchase</p>
                <p className="mt-1">Purchase credits in bulk for your selected API key. Credits will be added automatically after successful payment.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 