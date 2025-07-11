'use client'

import GenerateApiKeyForm from '@/components/GenerateApiKeyForm'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back 👋</h1>
      <GenerateApiKeyForm />
    </div>
  )
} 