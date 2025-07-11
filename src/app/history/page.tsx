'use client'

import CreditHistoryPanel from '@/components/dashboard/CreditHistoryPanel'
import PaymentsPanel from '@/components/dashboard/PaymentsPanel'

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Credit & Payment History</h1>
      <CreditHistoryPanel />
      <PaymentsPanel />
    </div>
  )
} 