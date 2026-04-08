"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchDualSourceEarthquakes } from "@/lib/dual-earthquake-fetch"
import { GlobeSceneInner } from "@/components/globe-scene-inner" // Declare the variable before using it

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
export function GlobeSection({ searchRegion = "" }: { searchRegion?: string }) {
  const [earthquakes, setEarthquakes] = useState<any[]>([])
  const [selectedQuake, setSelectedQuake] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("week")
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showIndiaLayer, setShowIndiaLayer] = useState(true)
  const { t } = useTranslation()

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
  }, [timeRange, mounted, searchRegion])

  if (!mounted) return null

  return (
    <Card className="w-full overflow-hidden border-slate-700 bg-slate-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl text-cyan-400">{t("globe.title")}</CardTitle>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            disabled={loading}
            className="px-3 py-1 rounded bg-slate-700 border border-cyan-500/30 text-white text-sm disabled:opacity-50"
          >
            <option value="hour">{t("globe.lastHour")}</option>
            <option value="day">{t("globe.lastDay")}</option>
            <option value="week">{t("globe.lastWeek")}</option>
            <option value="month">{t("globe.lastMonth")}</option>
          </select>
          <Button 
            variant="outline" 
            size="sm" 
            className={`ml-4 ${showIndiaLayer ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-800 text-slate-400'}`}
            onClick={() => setShowIndiaLayer(!showIndiaLayer)}
          >
            India Seismic Layer [{showIndiaLayer ? 'ON' : 'OFF'}]
          </Button>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {t("globe.desc")}
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full h-[600px] bg-gradient-to-b from-slate-900 via-slate-950 to-black relative">
          <GlobeGLComponent earthquakes={earthquakes} showIndiaLayer={showIndiaLayer} onSelectQuake={setSelectedQuake} searchRegion={searchRegion} />

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
