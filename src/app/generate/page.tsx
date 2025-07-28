'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GenerateApiKey from '@/components/dashboard/GenerateApiKey'
import GenerateInstantEmailKey from '@/components/dashboard/GenerateInstantEmailKey'
import { Mail, Zap } from "lucide-react"

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState("deeep")

  const handleApiKeyGenerated = () => {
    // Handle API key generation success
    console.log('API key generated successfully')
  }

  return (
    <div className="space-y-8 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Generate API Key</h1>
        <p className="text-muted-foreground">
          Choose your preferred email validation service and generate the appropriate API key.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Service Selection Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deeep" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              DEEEP API Key
            </TabsTrigger>
            <TabsTrigger value="instantemail" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              InstantEmail API Key
            </TabsTrigger>
          </TabsList>

          {/* DEEEP API Key Tab */}
          <TabsContent value="deeep" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Generate DEEEP API Key
                </CardTitle>
                <CardDescription>
                  Create a new DEEEP API key for email validation. This will create an account with DEEEP and provide you with an API key and customer link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerateApiKey onApiKeyGenerated={handleApiKeyGenerated} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* InstantEmail API Key Tab */}
          <TabsContent value="instantemail" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Generate InstantEmail API Key
                </CardTitle>
                <CardDescription>
                  Create a new InstantEmail API key for fast email validation. This will create an account with InstantEmail and provide you with an API key.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerateInstantEmailKey onApiKeyGenerated={handleApiKeyGenerated} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 