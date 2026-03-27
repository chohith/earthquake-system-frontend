"use client"

import { useState } from "react"
import { GlobalVisualizationZone } from "@/components/zones/global-visualization-zone"
import { FooterSection } from "@/components/zones/footer-section"
import { RecentActivitySection } from "@/components/recent-activity-section"
import { HeroNavigation } from "@/components/hero-navigation"

interface SelectedLocation {
  place: string
  mag: number
  lat: number
  lng: number
  time: string
  depth: number
}

interface DashboardLayoutProps {
  selectedLocation: SelectedLocation | null
  onLocationSelect: (location: SelectedLocation | null) => void
}

const severityLevels = [
  { label: "Minor", range: "M < 4.0", color: "bg-green-500", textColor: "text-green-400", borderColor: "border-green-500/40" },
  { label: "Light", range: "M 4.0-4.9", color: "bg-yellow-500", textColor: "text-yellow-400", borderColor: "border-yellow-500/40" },
  { label: "Moderate", range: "M 5.0-5.9", color: "bg-orange-500", textColor: "text-orange-400", borderColor: "border-orange-500/40" },
  { label: "Strong+", range: "M ≥ 6.0", color: "bg-red-500", textColor: "text-red-400", borderColor: "border-red-500/40" },
]

export function DashboardLayout({ selectedLocation, onLocationSelect }: DashboardLayoutProps) {
  const [timeRange, setTimeRange] = useState("week")
  const [magnitudeRange, setMagnitudeRange] = useState<[number, number]>([0, 10])
  const [searchRegion, setSearchRegion] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Navigation */}
      <HeroNavigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* Global Visualization (Center - Primary) */}
        <div className="min-h-[600px] lg:min-h-[800px]">
          <GlobalVisualizationZone
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
            timeRange={timeRange}
            magnitudeRange={magnitudeRange}
            searchRegion={searchRegion}
          />
        </div>

        {/* Severity Color Legend - Centered */}
        <div className="flex justify-center w-full">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-6 max-w-3xl w-full">
            <h3 className="text-white font-semibold text-sm mb-4">Magnitude Severity Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {severityLevels.map((level) => (
                <div key={level.label} className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full ${level.color}`} />
                    <span className="text-slate-300 text-sm font-medium">{level.range}</span>
                  </div>
                  <span className="text-slate-400 text-xs">{level.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Section - Directly Below Legend */}
        <RecentActivitySection
          selectedLocation={selectedLocation}
          onSelectEvent={onLocationSelect}
          searchRegion={searchRegion}
        />
      </div>

      {/* Footer Section */}
      <FooterSection />
    </div>
  )
}
