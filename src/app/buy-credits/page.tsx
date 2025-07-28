'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BuyCreditsStandalonePanel from '@/components/dashboard/BuyCreditsStandalonePanel'
import BuyInstantEmailCreditsPanel from '@/components/dashboard/BuyInstantEmailCreditsPanel'
import { Mail, Zap } from "lucide-react"

export default function BuyCreditsPage() {
  const [activeTab, setActiveTab] = useState("deeep")

  return (
    <div className="space-y-8 px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p className="text-muted-foreground">
          Choose your preferred email validation service and purchase credits at competitive rates.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Service Selection Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deeep" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              DEEEP Credits
            </TabsTrigger>
            <TabsTrigger value="instantemail" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              InstantEmail Credits
            </TabsTrigger>
          </TabsList>

          {/* DEEEP Credits Tab */}
          <TabsContent value="deeep" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Purchase DEEEP Credits
                </CardTitle>
                <CardDescription>
                  Buy credits for DEEEP email validation. Credits are used for comprehensive email validation with detailed results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BuyCreditsStandalonePanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* InstantEmail Credits Tab */}
          <TabsContent value="instantemail" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Purchase InstantEmail Credits
                </CardTitle>
                <CardDescription>
                  Buy credits for InstantEmail validation. Credits are used for fast email validation with competitive pricing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BuyInstantEmailCreditsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 