'use client'

import GenerateApiKey from '@/components/dashboard/GenerateApiKey'

export default function GeneratePage() {
  const handleApiKeyGenerated = () => {
    // Handle API key generation success
    console.log('API key generated successfully')
  }

  return (
    <div className="space-y-8 px-4">
      <h1 className="text-2xl font-bold">Generate API Key</h1>
      <div className="max-w-4xl mx-auto">
        <GenerateApiKey onApiKeyGenerated={handleApiKeyGenerated} />
      </div>
    </div>
  )
} 