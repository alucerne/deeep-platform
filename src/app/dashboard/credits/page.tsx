'use client'

import BuyCreditsStandalonePanel from '@/components/dashboard/BuyCreditsStandalonePanel'
import CreditHistoryPanel from '@/components/dashboard/CreditHistoryPanel'
import PaymentsPanel from '@/components/dashboard/PaymentsPanel'

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Credits & Payments</h1>
      <BuyCreditsStandalonePanel />
      <CreditHistoryPanel />
      <PaymentsPanel />
    </div>
  )
} 