"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchDualSource24Hours } from "@/lib/dual-earthquake-fetch"

interface Earthquake {
  place: string
  mag: number
  lat: number
  lng: number
  time: string
  depth: number
}

interface RecentActivitySectionProps {
  selectedLocation?: Earthquake | null
  onSelectEvent?: (location: Earthquake) => void
  searchRegion?: string
}

export function RecentActivitySection({ selectedLocation, onSelectEvent, searchRegion = "" }: RecentActivitySectionProps) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    let isMounted = true

    const fetchEarthquakes = async () => {
      try {
        const data = await fetchDualSource24Hours()
        
        if (!isMounted) return

        const earthquakesData: Earthquake[] = data.map((item: any) => ({
          place: item.place || "Unknown Location",
          mag: item.mag || 0,
          lat: item.lat,
          lng: item.lng,
          time: item.time || new Date().toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
          depth: item.depth || 0,
        }))
        
        setEarthquakes(earthquakesData)
        setLastUpdated(new Date().toLocaleString())
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching earthquakes:", error)
        if (isMounted) setIsLoading(false)
      }
    }

    fetchEarthquakes()
    // Auto-refresh every 5 minutes for live updates
    const interval = setInterval(fetchEarthquakes, 5 * 60 * 1000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Severity-based colors: Minor=green, Moderate=yellow, Strong=orange, Major=red
  const getMagnitudeColor = (mag: number) => {
    if (mag >= 7) return "bg-red-500/20 text-red-300 border-red-500/30"
    if (mag >= 6) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
    if (mag >= 4) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    return "bg-green-500/20 text-green-300 border-green-500/30"
  }

  const getSeverityLabel = (mag: number) => {
    if (mag >= 7) return "Major"
    if (mag >= 6) return "Strong"
    if (mag >= 4) return "Moderate"
    return "Minor"
  }

  const filteredEarthquakes = earthquakes.filter((eq) => {
    if (!searchRegion || searchRegion.trim() === "") return true
    return eq.place.toLowerCase().includes(searchRegion.toLowerCase())
  })

  const firstTwenty = filteredEarthquakes.slice(0, 20)
  const remaining = filteredEarthquakes.slice(20)

  const formatCoordinate = (value: number): string => {
    return Math.abs(value).toFixed(2)
  }

  const renderEarthquakeTable = (data: Earthquake[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Location</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Magnitude</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Severity</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Date & Time</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Depth (km)</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Coordinates</th>
          </tr>
        </thead>
        <tbody>
          {data.map((quake, idx) => (
            <tr
              key={`${quake.place}-${quake.time}-${idx}`}
              onClick={() => onSelectEvent?.(quake)}
              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer"
            >
              <td className="py-3 px-4 text-slate-200 font-medium break-words max-w-[200px]">{quake.place}</td>
              <td className="py-3 px-4 text-center">
                <Badge className={`${getMagnitudeColor(quake.mag)} border whitespace-nowrap`}>M{quake.mag.toFixed(1)}</Badge>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`text-xs font-semibold ${
                  quake.mag >= 7 ? "text-red-400" : quake.mag >= 6 ? "text-orange-400" : quake.mag >= 4 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {getSeverityLabel(quake.mag)}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{quake.time}</td>
              <td className="py-3 px-4 text-slate-300 text-center whitespace-nowrap">{quake.depth.toFixed(1)}</td>
              <td className="py-3 px-4 text-slate-300 text-center whitespace-nowrap text-xs font-mono">
                {formatCoordinate(quake.lat)}N, {formatCoordinate(quake.lng)}E
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Card className="bg-slate-800/50 border-cyan-500/20 p-6 w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Recent Activity - Last 24 Hours</h2>
        <p className="text-sm text-slate-400">Total earthquakes recorded: {filteredEarthquakes.length}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 mx-auto mb-2" />
            <p className="text-slate-400">Fetching earthquake data from USGS...</p>
          </div>
        </div>
      ) : filteredEarthquakes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">{searchRegion ? `No earthquakes found for "${searchRegion}"` : "No earthquake data available"}</p>
        </div>
      ) : (
        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-700/30 border border-cyan-500/20">
            <TabsTrigger value="latest" className="text-sm">
              Latest 20 ({firstTwenty.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm" disabled={remaining.length === 0}>
              All 24 Hours ({remaining.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="mt-4">
            {firstTwenty.length > 0 ? (
              <>
                {renderEarthquakeTable(firstTwenty)}
                <div className="mt-4 text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                  <p>Showing {firstTwenty.length} earthquakes. Click on any row to select and view details.</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">No earthquakes in this view</div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {remaining.length > 0 ? (
              <>
                {renderEarthquakeTable(remaining)}
                <div className="mt-4 text-xs text-slate-500 pt-2 border-t border-slate-700/30">
                  <p>Showing {remaining.length} additional earthquakes from the last 24 hours.</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">No additional earthquakes available</div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-6 text-xs text-slate-500 border-t border-slate-700/30 pt-4">
        <p>Data sources: USGS Earthquake Hazards Program & RISEQ (Regional Seismic Network of India).{lastUpdated ? ` Last updated: ${lastUpdated}` : ""}</p>
      </div>
    </Card>
  )
}
