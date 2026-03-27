"use client"

import { GlobalNavigation } from "@/components/global-navigation"
import { RealtimeForecastExplorer } from "@/components/realtime-forecast-explorer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function ForecastPage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobalNavigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Real-Time Earthquake Forecasting
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Advanced predictive models with real-time earthquake data, historical analysis, and probabilistic risk calculations
            </p>
          </div>

          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle>AI-Powered Seismic Forecast System</CardTitle>
              <CardDescription>
                Select a region to view detailed forecasts based on real-time earthquake activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealtimeForecastExplorer selectedRegion={selectedRegion} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
