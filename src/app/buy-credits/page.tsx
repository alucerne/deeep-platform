'use client'

import BuyCreditsStandalonePanel from '@/components/dashboard/BuyCreditsStandalonePanel'

export default function BuyCreditsPage() {
  return (
    <div className="space-y-8 px-4">
      <h1 className="text-2xl font-bold">Buy Credits</h1>
      <div className="max-w-4xl mx-auto">
        <BuyCreditsStandalonePanel />
      </div>
    </div>
  )
} 