'use client'

import { useState } from 'react'
import ScoreCard from '@/components/dashboard/ScoreCard'
import ApiKeysList from '@/components/dashboard/ApiKeysList'
import ChartAreaInteractive from '@/components/dashboard/ChartAreaInteractive'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back 👋</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ScoreCard />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <ApiKeysList />
          <ChartAreaInteractive />
        </div>
      </div>
    </div>
  )
} 