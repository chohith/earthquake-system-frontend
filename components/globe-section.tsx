"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchDualSourceEarthquakes } from "@/lib/dual-earthquake-fetch"
import GlobeSceneInner from "@/components/globe-scene-inner" // Declare the variable before using it

// Dynamically import the globe.gl component to avoid SSR issues
const GlobeGLComponent = dynamic(
  () => import("@/components/globe-gl-component").then((mod) => mod.GlobeGLComponent),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950 text-slate-400">
        Loading 3D globe...
      </div>
    ),
  },
)

function getMagnitudeColor(mag: number): string {
  if (mag >= 6) return "#ef4444"
  if (mag >= 5) return "#f97316"
  if (mag >= 4) return "#eab308"
  return "#22c55e"
}

// Main Globe Section Component
export function GlobeSection() {
  const [earthquakes, setEarthquakes] = useState<any[]>([])
  const [selectedQuake, setSelectedQuake] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("week")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadData = async () => {
      setLoading(true)
      const data = await fetchDualSourceEarthquakes(timeRange)
      const formatted = data.map((item: any) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        mag: item.mag,
        place: item.place,
        time: item.time,
        depth: item.depth,
      }))
      setEarthquakes(formatted)
      setLoading(false)
    }

    loadData()

    // Set up auto-refresh every 5 minutes for live updates
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange, mounted])

  if (!mounted) return null

  return (
    <Card className="w-full overflow-hidden border-slate-700 bg-slate-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-cyan-400">Interactive Earthquake Globe</CardTitle>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            disabled={loading}
            className="px-3 py-1 rounded bg-slate-700 border border-cyan-500/30 text-white text-sm disabled:opacity-50"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Drag to rotate - Scroll to zoom - Click markers for details - Live data from USGS & partner sources
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full h-[600px] bg-gradient-to-b from-slate-900 via-slate-950 to-black relative">
          <GlobeGLComponent earthquakes={earthquakes} onSelectQuake={setSelectedQuake} />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-slate-400">Fetching live earthquake data from dual sources...</div>
            </div>
          )}

          {selectedQuake && (
            <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-cyan-500/50 rounded-lg p-4 max-w-sm backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getMagnitudeColor(selectedQuake.mag) }}
                    />
                    <Badge className="text-base">M{selectedQuake.mag.toFixed(1)}</Badge>
                  </div>
                  <p className="font-medium text-white">{selectedQuake.place}</p>
                  <p className="text-xs text-slate-400 mt-1">{selectedQuake.time}</p>
                  <p className="text-xs text-slate-400">Depth: {selectedQuake.depth.toFixed(1)} km</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuake(null)}>
                  x
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
