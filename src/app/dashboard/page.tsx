'use client'

import { useState } from 'react'
import GenerateApiKey from '@/components/dashboard/GenerateApiKey'
import ScoreCard from '@/components/dashboard/ScoreCard'
import ApiKeysList from '@/components/dashboard/ApiKeysList'
import ChartAreaInteractive from '@/components/dashboard/ChartAreaInteractive'

export default function DashboardHome() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleApiKeyGenerated = () => {
    // Trigger refresh of other components
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back 👋</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <GenerateApiKey onApiKeyGenerated={handleApiKeyGenerated} />
          <ScoreCard key={refreshTrigger} />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <ApiKeysList key={refreshTrigger} />
          <ChartAreaInteractive key={refreshTrigger} />
        </div>
      </div>
    </div>
  )
} 