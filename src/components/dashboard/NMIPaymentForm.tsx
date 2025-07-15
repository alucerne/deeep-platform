'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

interface ApiKey {
  id: string
  email: string
  api_key: string
  customer_link: string
  created_at: string
}

interface PaymentFormData {
  card_number: string
  card_expiry: string
  card_cvv: string
  card_holder_name: string
  billing_address: {
    first_name: string
    last_name: string
    address1: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export default function NMIPaymentForm() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [selectedCredits, setSelectedCredits] = useState(50000)
  const [selectedApiKey, setSelectedApiKey] = useState<string>('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const [formData, setFormData] = useState<PaymentFormData>({
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_holder_name: '',
    billing_address: {
      first_name: '',
      last_name: '',
      address1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    }
  })

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch API keys on component mount
  useState(() => {
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
      } catch (error) {
        console.error('Error fetching API keys:', error)
      } finally {
        setLoadingKeys(false)
      }
    }

    fetchApiKeys()
  })

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PaymentFormData],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handlePurchaseCredits = async () => {
    if (!selectedApiKey) {
      setPaymentError('Please select an API key')
      return
    }

    if (selectedCredits < 50000) {
      setPaymentError('Minimum credit amount is 50,000')
      return
    }

    setShowPaymentForm(true)
    setPaymentError(null)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessingPayment(true)
    setPaymentError(null)

    try {
      const response = await fetch('/api/payments/nmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: selectedCredits,
          api_key: selectedApiKey,
          ...formData
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPaymentSuccess(true)
        setShowPaymentForm(false)
        // Reset form
        setFormData({
          card_number: '',
          card_expiry: '',
          card_cvv: '',
          card_holder_name: '',
          billing_address: {
            first_name: '',
            last_name: '',
            address1: '',
            city: '',
            state: '',
            zip: '',
            country: 'US'
          }
        })
      } else {
        setPaymentError(data.error || 'Payment failed')
      }
    } catch (error) {
      setPaymentError('Network error occurred')
    } finally {
      setProcessingPayment(false)
    }
  }

  const price = (selectedCredits * 0.0005).toFixed(2)

  if (paymentSuccess) {
    return (
      <div className="bg-white p-6 rounded-xl shadow border">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            {selectedCredits.toLocaleString()} credits have been added to your account.
          </p>
          <Button 
            onClick={() => {
              setPaymentSuccess(false)
              setSelectedApiKey('')
              setSelectedCredits(50000)
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Make Another Purchase
          </Button>
        </div>
      </div>
    )
  }

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
      ) : !showPaymentForm ? (
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
              disabled={!selectedApiKey || selectedCredits < 50000}
              className="w-full mt-6"
            >
              Continue to Payment
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium">Secure Payment</p>
                <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitPayment} className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
            <p className="text-sm text-gray-600">
              {selectedCredits.toLocaleString()} credits for ${price}
            </p>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{paymentError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <Input
                id="card_number"
                type="text"
                value={formData.card_number}
                onChange={(e) => handleInputChange('card_number', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="card_expiry" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <Input
                  id="card_expiry"
                  type="text"
                  value={formData.card_expiry}
                  onChange={(e) => handleInputChange('card_expiry', formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label htmlFor="card_cvv" className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <Input
                  id="card_cvv"
                  type="text"
                  value={formData.card_cvv}
                  onChange={(e) => handleInputChange('card_cvv', e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <label htmlFor="card_holder_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <Input
                  id="card_holder_name"
                  type="text"
                  value={formData.card_holder_name}
                  onChange={(e) => handleInputChange('card_holder_name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Billing Address</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.billing_address.first_name}
                    onChange={(e) => handleInputChange('billing_address.first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.billing_address.last_name}
                    onChange={(e) => handleInputChange('billing_address.last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <Input
                  id="address1"
                  type="text"
                  value={formData.billing_address.address1}
                  onChange={(e) => handleInputChange('billing_address.address1', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.billing_address.city}
                    onChange={(e) => handleInputChange('billing_address.city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.billing_address.state}
                    onChange={(e) => handleInputChange('billing_address.state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <Input
                    id="zip"
                    type="text"
                    value={formData.billing_address.zip}
                    onChange={(e) => handleInputChange('billing_address.zip', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentForm(false)}
              disabled={processingPayment}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={processingPayment}
              className="flex-1"
            >
              {processingPayment ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Payment...
                </div>
              ) : (
                `Pay $${price}`
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
} 