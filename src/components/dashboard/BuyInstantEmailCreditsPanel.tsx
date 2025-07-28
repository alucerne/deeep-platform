'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface InstantEmailUser {
  id: string
  user_email: string
  api_key: string
  credits: number
  created_at: string
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  description: string
  popular?: boolean
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 1000,
    price: 9.99,
    description: 'Perfect for small projects and testing'
  },
  {
    id: 'professional',
    name: 'Professional',
    credits: 10000,
    price: 79.99,
    description: 'Great for growing businesses',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 100000,
    price: 699.99,
    description: 'For large-scale email validation needs'
  }
]

export default function BuyInstantEmailCreditsPanel() {
  const [selectedPackage, setSelectedPackage] = useState<string>('professional')
  const [customCredits, setCustomCredits] = useState<string>('')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found')
      return null
    }
    
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }, [])

  const handlePurchase = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Get current session
      if (!supabase) {
        setMessage({ type: 'error', text: 'Supabase client not initialized' })
        return
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setMessage({ type: 'error', text: 'Not authenticated. Please log in.' })
        return
      }

      // For now, we'll just show a message that admin needs to add credits
      // In a real implementation, this would integrate with a payment processor
      setMessage({ 
        type: 'success', 
        text: 'Credit purchase request submitted! Our team will process your payment and add credits to your account within 24 hours. You will receive an email confirmation once completed.' 
      })

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedPackageData = creditPackages.find(pkg => pkg.id === selectedPackage)
  const customCreditsNum = parseInt(customCredits) || 0
  const customAmountNum = parseFloat(customAmount) || 0

  return (
    <div className="space-y-6">
      {/* Credit Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {creditPackages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`cursor-pointer transition-all ${
              selectedPackage === pkg.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-gray-300'
            } ${pkg.popular ? 'relative' : ''}`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary">
                ${pkg.price}
              </div>
              <div className="text-sm text-muted-foreground">
                {pkg.credits.toLocaleString()} credits
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ${(pkg.price / pkg.credits * 1000).toFixed(2)} per 1,000 credits
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Package */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Package</CardTitle>
          <CardDescription>
            Need a different amount? Contact us for custom pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Credits
              </label>
              <Input
                type="number"
                placeholder="Enter number of credits"
                value={customCredits}
                onChange={(e) => setCustomCredits(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          {customCreditsNum > 0 && customAmountNum > 0 && (
            <div className="text-sm text-muted-foreground">
              Rate: ${(customAmountNum / customCreditsNum * 1000).toFixed(2)} per 1,000 credits
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Button */}
      <div className="text-center">
        <Button
          onClick={handlePurchase}
          disabled={loading}
          size="lg"
          className="px-8"
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            `Purchase ${selectedPackageData ? selectedPackageData.credits.toLocaleString() : customCreditsNum.toLocaleString()} Credits`
          )}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">InstantEmail Credits</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Competitive pricing</li>
                <li>• Fast processing</li>
                <li>• Webhook support</li>
                <li>• Admin-managed credits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Payment Options</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Credit card</li>
                <li>• Bank transfer</li>
                <li>• Invoice billing</li>
                <li>• 24-hour processing</li>
              </ul>
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> InstantEmail credits are processed manually by our team. 
              You will receive an email confirmation once your credits have been added to your account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 