'use client'

import ApiKeysList from '@/components/dashboard/ApiKeysList'

export default function KeysPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API Keys</h1>
      <ApiKeysList />
    </div>
  )
} 