"use client"

import { GlobalNavigation } from "@/components/global-navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { AnalyticsGraphs } from "@/components/analytics-graphs"
import { RealtimeRiskIndex } from "@/components/realtime-risk-index"
import { RealtimeForecastExplorer } from "@/components/realtime-forecast-explorer"
import { Translate } from "@/components/translate"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("risk")
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobalNavigation />

      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2"><Translate>Analytics & Insights</Translate></h1>
            <p className="text-slate-400 text-sm sm:text-base">
              <Translate>Real-time monitoring powered by custom Deep Learning</Translate>
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-2 bg-slate-800/50 p-1 h-auto mb-6">
              <TabsTrigger value="risk" className="text-xs sm:text-sm">
                <Translate>Real-Time Risk Index</Translate>
              </TabsTrigger>
              <TabsTrigger value="forecast" className="text-xs sm:text-sm">
                <Translate>Live Regional Prediction</Translate>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="risk" className="space-y-6">
              <RealtimeRiskIndex selectedRegion={selectedRegion} onRegionSelect={setSelectedRegion} />
            </TabsContent>

            <TabsContent value="forecast" className="space-y-6">
              <RealtimeForecastExplorer selectedRegion={selectedRegion} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
