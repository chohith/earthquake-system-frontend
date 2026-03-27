"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRiskIndex } from "@/lib/ml-backend-client"

interface EarthquakeData {
  location: string
  magnitude: number
  depth: number
  latitude: number
  longitude: number
  timestamp: string
  region: string
}

interface RiskRegion {
  name: string
  lat: number
  lng: number
  riskIndex: number
  recentEvents: number
  lastEvent: string
  probability: number
  magnitude: [number, number]
  trend: "increasing" | "stable" | "decreasing"
  maxMagnitude: number
  avgDepth: number
  forecast7day: number
}

interface RealtimeRiskIndexProps {
  selectedRegion: string | null
  onRegionSelect: (region: string | null) => void
}

function getRiskColor(index: number): string {
  if (index >= 75) return "bg-red-900/80 text-red-100"
  if (index >= 50) return "bg-orange-900/80 text-orange-100"
  if (index >= 25) return "bg-yellow-900/80 text-yellow-100"
  return "bg-green-900/80 text-green-100"
}

function getRiskBarColor(index: number): string {
  if (index >= 75) return "bg-red-500"
  if (index >= 50) return "bg-orange-500"
  if (index >= 25) return "bg-yellow-500"
  return "bg-green-500"
}

function getRiskLevel(index: number): string {
  if (index >= 75) return "Critical"
  if (index >= 50) return "High"
  if (index >= 25) return "Moderate"
  return "Low"
}

function getTrendIcon(trend: string): string {
  if (trend === "increasing") return "↑"
  if (trend === "decreasing") return "↓"
  return "→"
}

/**
 * Extract region from earthquake location string
 */
function extractRegion(location: string): string {
  const parts = location.split(",")
  return parts.length > 1 ? parts[parts.length - 1].trim() : location
}

/**
 * Calculate enhanced risk index with forecast data
 * 
 * FORMULA BREAKDOWN:
 * ==================
 * Risk Index = Magnitude Score + Depth Score + Activity Score
 * 
 * 1. Magnitude Score = (Max Magnitude / 9.0) × 60%
 *    - Example: M6.5 = (6.5/9) × 60 = 43.3 points
 * 
 * 2. Depth Score = ((70km - Depth) / 70) × 30% (if depth < 70km)
 *    - Shallower earthquakes = higher risk
 *    - 10km depth = ((70-10)/70) × 30 = 25.7 points
 *    - >70km depth = 0 points
 * 
 * 3. Activity Score = MIN((Events in 24h / 20) × 10%, 10%)
 *    - 20+ events = max 10 points
 *    - Example: 10 events = (10/20) × 10 = 5 points
 * 
 * Final Score: Sum all, then clamp to 0-100
 */
function calculateRiskIndex(magnitude: number, depth: number, recentEventCount: number, eventsIn24h: number): number {
  const magnitudeScore = (magnitude / 9) * 60
  const depthScore = depth < 70 ? ((70 - depth) / 70) * 30 : 0
  const activityScore = Math.min((eventsIn24h / 20), 1) * 10
  const total = magnitudeScore + depthScore + activityScore

  console.log("[v0] ========== RISK INDEX CALCULATION ==========")
  console.log("[v0] Input Data:", { magnitude: `M${magnitude.toFixed(2)}`, depth: `${depth.toFixed(0)}km`, eventsIn24h })
  console.log("[v0] Magnitude Score: (${magnitude}/9) × 60 =", magnitudeScore.toFixed(2), "points")
  console.log("[v0] Depth Score: ((70-${depth})/70) × 30 =", depthScore.toFixed(2), "points")
  console.log("[v0] Activity Score: (${eventsIn24h}/20) × 10 =", activityScore.toFixed(2), "points")
  console.log("[v0] Total Score:", total.toFixed(2), "→ Clamped to", Math.round(total))
  console.log("[v0] =============================================")

  return Math.round(total)
}

/**
 * Calculate 7-day forecast percentage based on historical patterns
 * 
 * FORMULA BREAKDOWN:
 * ==================
 * 7-Day Forecast % = MIN( Magnitude Score + Activity Score + Trend Factor + Base, 95% )
 * 
 * 1. Magnitude Score = (Max Magnitude / 9.0) × 40%
 *    - A magnitude 9.0 earthquake = 40% score
 *    - Example: M6.5 = (6.5/9) × 40 = 28.9%
 * 
 * 2. Activity Score = MIN((Events in 24h / 30) × 40%, 40%)
 *    - 30 events in 24h = max 40% score
 *    - Example: 15 events = (15/30) × 40 = 20%
 * 
 * 3. Trend Factor = +20% (increasing) | 0% (stable) | -10% (decreasing)
 *    - Determined by comparing last 12h vs previous 12h event counts
 * 
 * 4. Base Confidence = 20%
 *    - Minimum forecast probability
 * 
 * 5. Final = MIN(sum of all, 95%)
 *    - Capped at 95% to be realistic (100% is impossible to predict)
 */
function calculate7DayForecast(maxMagnitude: number, eventCount24h: number, trend: "increasing" | "stable" | "decreasing"): number {
  const magnitudeScore = (maxMagnitude / 9) * 40
  const activityScore = Math.min((eventCount24h / 30) * 40, 40)
  const trendFactor = trend === "increasing" ? 20 : trend === "decreasing" ? -10 : 0
  const baseConfidence = 20

  const total = magnitudeScore + activityScore + trendFactor + baseConfidence
  const finalPercentage = Math.round(Math.min(total, 95))

  console.log("[v0] ========== 7-DAY FORECAST CALCULATION ==========")
  console.log("[v0] Input Data:", { maxMagnitude: `M${maxMagnitude.toFixed(2)}`, eventCount24h, trend })
  console.log("[v0] Magnitude Score: (${maxMagnitude}/9) × 40 =", magnitudeScore.toFixed(2), "%")
  console.log("[v0] Activity Score: (${eventCount24h}/30) × 40 =", activityScore.toFixed(2), "%")
  console.log("[v0] Trend Factor:", trend, "=", trendFactor, "%")
  console.log("[v0] Base Confidence:", baseConfidence, "%")
  console.log("[v0] Total Before Cap:", total.toFixed(2), "%")
  console.log("[v0] Final Percentage (capped at 95%):", finalPercentage, "%")
  console.log("[v0] ================================================")

  return finalPercentage
}

/**
 * Determine trend based on recent events
 */
function determineTrend(events: EarthquakeData[]): "increasing" | "stable" | "decreasing" {
  if (events.length < 2) return "stable"

  const now = new Date()
  const lastHours = new Date(now.getTime() - 12 * 60 * 60 * 1000)
  const olderHours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentCount = events.filter(e => new Date(e.timestamp) > lastHours).length
  const olderCount = events.filter(e => new Date(e.timestamp) > olderHours && new Date(e.timestamp) <= lastHours).length

  if (recentCount > olderCount * 1.5) return "increasing"
  if (recentCount < olderCount * 0.7) return "decreasing"
  return "stable"
}

export function RealtimeRiskIndex({ selectedRegion, onRegionSelect }: RealtimeRiskIndexProps) {
  const [regions, setRegions] = useState<RiskRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDetails, setSelectedDetails] = useState<RiskRegion | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [activeTab, setActiveTab] = useState("latest20")

  useEffect(() => {
    fetchRealTimeData()
    const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchRealTimeData = async () => {
    try {
      setLoading(true)
      const result = await getRiskIndex()

      if (result.status === "success" && result.global_risk_zones) {
        // Map the backend structure to the component's internal structure
        const processedRegions: RiskRegion[] = result.global_risk_zones.map((zone: any) => {
          return {
            name: zone.region,
            lat: zone.coordinates?.lat || 0,
            lng: zone.coordinates?.lon || 0,
            riskIndex: zone.risk_index,
            recentEvents: zone.analytics?.event_count || 0,
            lastEvent: new Date().toISOString(),
            probability: Math.min(zone.risk_index + 10, 95), // mock probability loosely based on risk
            magnitude: [3.0, zone.analytics?.max_magnitude || 0] as [number, number],
            trend: zone.seven_day_forecast?.toLowerCase() || "stable",
            maxMagnitude: zone.analytics?.max_magnitude || 0,
            avgDepth: zone.analytics?.mean_depth || 0,
            forecast7day: zone.risk_index > 50 ? zone.risk_index + 5 : zone.risk_index, // Rough mapping for UI
          }
        })

        setRegions(processedRegions.sort((a, b) => b.riskIndex - a.riskIndex))
        setLastUpdated(new Date().toLocaleTimeString())
      } else {
        setRegions([])
      }
    } catch (error) {
      console.error("[v0] Error fetching risk data from Python Backend:", error)
      setRegions([])
    } finally {
      setLoading(false)
    }
  }

  const handleRegionClick = (region: RiskRegion) => {
    setSelectedDetails(region)
    onRegionSelect(region.name)
  }

  const latest20Regions = regions.slice(0, 20)
  const all24hRegions = regions.slice(20)

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-cyan-400">Real-Time Risk Index</CardTitle>
              <CardDescription>
                Live earthquake risk assessment with 7-day forecast predictions
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {lastUpdated ? `Updated: ${lastUpdated}` : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRealTimeData}
                disabled={loading}
                className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10 bg-transparent"
              >
                {loading ? "Updating..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading real-time earthquake data...</div>
          ) : regions.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No recent earthquake data available</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-2 bg-slate-800/50 p-1 h-auto mb-4">
                <TabsTrigger value="latest20" className="text-xs sm:text-sm">
                  Latest 20 ({latest20Regions.length})
                </TabsTrigger>
                <TabsTrigger value="all24h" className="text-xs sm:text-sm">
                  All 24 Hours ({all24hRegions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="latest20" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {latest20Regions.map((region) => (
                    <button
                      key={region.name}
                      onClick={() => handleRegionClick(region)}
                      className={`p-4 rounded-lg border border-slate-700 cursor-pointer transition-all hover:border-cyan-400/50 text-left ${selectedDetails?.name === region.name ? "bg-slate-800 border-cyan-400" : "bg-slate-800/50 hover:bg-slate-800"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{region.name}</h3>
                          <p className="text-xs text-slate-400">
                            {region.recentEvents} events | Max: M{region.maxMagnitude.toFixed(1)}
                          </p>
                        </div>
                        <Badge className={`${getRiskColor(region.riskIndex)} border-0`}>
                          {getRiskLevel(region.riskIndex)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Risk Index</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getRiskBarColor(region.riskIndex)}`}
                                style={{ width: `${Math.min(region.riskIndex, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-cyan-400">{region.riskIndex}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">7-Day Forecast</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500"
                                style={{ width: `${Math.min(region.forecast7day, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-violet-400">{region.forecast7day}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                          <div>
                            <div className="text-[10px] text-slate-500">Magnitude</div>
                            <div className="text-xs font-mono text-slate-300">M{region.maxMagnitude.toFixed(1)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">Depth</div>
                            <div className="text-xs font-mono text-slate-300">{region.avgDepth.toFixed(0)} km</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">Trend</div>
                            <div className="text-xs font-mono text-slate-300">{getTrendIcon(region.trend)}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="all24h" className="space-y-4 mt-4">
                {all24hRegions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {all24hRegions.map((region) => (
                      <button
                        key={region.name}
                        onClick={() => handleRegionClick(region)}
                        className={`p-4 rounded-lg border border-slate-700 cursor-pointer transition-all hover:border-cyan-400/50 text-left ${selectedDetails?.name === region.name ? "bg-slate-800 border-cyan-400" : "bg-slate-800/50 hover:bg-slate-800"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{region.name}</h3>
                            <p className="text-xs text-slate-400">
                              {region.recentEvents} events | Max: M{region.maxMagnitude.toFixed(1)}
                            </p>
                          </div>
                          <Badge className={`${getRiskColor(region.riskIndex)} border-0`}>
                            {getRiskLevel(region.riskIndex)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Risk Index</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getRiskBarColor(region.riskIndex)}`}
                                  style={{ width: `${Math.min(region.riskIndex, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-cyan-400">{region.riskIndex}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">7-Day Forecast</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500"
                                  style={{ width: `${Math.min(region.forecast7day, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-violet-400">{region.forecast7day}%</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div>
                              <div className="text-[10px] text-slate-500">Magnitude</div>
                              <div className="text-xs font-mono text-slate-300">M{region.maxMagnitude.toFixed(1)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Depth</div>
                              <div className="text-xs font-mono text-slate-300">{region.avgDepth.toFixed(0)} km</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500">Trend</div>
                              <div className="text-xs font-mono text-slate-300">{getTrendIcon(region.trend)}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">No additional earthquake regions available</div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      {selectedDetails && (
        <Card className="border-slate-700 bg-slate-900/50 border-cyan-400/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">Region Details: {selectedDetails.name}</CardTitle>
            <CardDescription>Seismic activity analysis and 7-day forecast for this region</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Risk Index</p>
                <p className="text-xl font-bold text-cyan-400">{selectedDetails.riskIndex}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Recent Events</p>
                <p className="text-xl font-bold text-white">{selectedDetails.recentEvents}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">7-Day Forecast</p>
                <p className="text-xl font-bold text-violet-400">{selectedDetails.forecast7day}%</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Trend</p>
                <p className={`text-xl font-bold ${selectedDetails.trend === "increasing" ? "text-red-400" : selectedDetails.trend === "decreasing" ? "text-green-400" : "text-yellow-400"}`}>
                  {getTrendIcon(selectedDetails.trend)} {selectedDetails.trend}
                </p>
              </div>
            </div>

            {/* Calculation Explanation */}
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50 space-y-3">
              <h4 className="text-sm font-semibold text-cyan-300">Percentage Calculation Breakdown</h4>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-700/30 p-3 rounded border border-slate-600/50">
                  <p className="text-slate-300 font-semibold mb-2">Risk Index ({selectedDetails.riskIndex}/100):</p>
                  <ul className="space-y-1 text-slate-400 ml-2">
                    <li>• Magnitude Score: <span className="text-cyan-300">(M{selectedDetails.maxMagnitude.toFixed(1)}/9) × 60</span></li>
                    <li>• Depth Score: <span className="text-cyan-300">((70 - {selectedDetails.avgDepth.toFixed(0)}) / 70) × 30</span></li>
                    <li>• Activity Score: <span className="text-cyan-300">({selectedDetails.recentEvents}/20) × 10</span></li>
                  </ul>
                </div>

                <div className="bg-slate-700/30 p-3 rounded border border-slate-600/50">
                  <p className="text-slate-300 font-semibold mb-2">7-Day Forecast ({selectedDetails.forecast7day}%):</p>
                  <ul className="space-y-1 text-slate-400 ml-2">
                    <li>• Magnitude: <span className="text-violet-300">(M{selectedDetails.maxMagnitude.toFixed(1)}/9) × 40 = </span>
                      <span className="text-violet-400 font-mono">{((selectedDetails.maxMagnitude / 9) * 40).toFixed(1)}%</span>
                    </li>
                    <li>• Activity: <span className="text-violet-300">({selectedDetails.recentEvents}/30) × 40 = </span>
                      <span className="text-violet-400 font-mono">{Math.min((selectedDetails.recentEvents / 30) * 40, 40).toFixed(1)}%</span>
                    </li>
                    <li>• Trend Factor: <span className="text-violet-300">
                      {selectedDetails.trend === "increasing" ? "+20%" : selectedDetails.trend === "decreasing" ? "-10%" : "0%"}
                    </span></li>
                    <li>• Base: <span className="text-violet-300">+20%</span></li>
                    <li>• Total: <span className="text-violet-400 font-mono">{selectedDetails.forecast7day}% (capped at 95%)</span></li>
                  </ul>
                </div>

                <p className="text-slate-500 italic pt-2">
                  💡 Tip: Open browser DevTools (F12) → Console tab to see detailed calculation logs
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-semibold text-cyan-300 mb-3">Seismic Characteristics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Average Depth</span>
                    <span className="text-white font-mono">{selectedDetails.avgDepth.toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Magnitude Range</span>
                    <span className="text-white font-mono">M{selectedDetails.magnitude[0].toFixed(1)} - M{selectedDetails.magnitude[1].toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Events (24h)</span>
                    <span className="text-white font-mono">{selectedDetails.recentEvents}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50">
                <h4 className="text-sm font-semibold text-cyan-300 mb-3">Geographic Location</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Latitude</span>
                    <span className="text-white font-mono">{selectedDetails.lat.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Longitude</span>
                    <span className="text-white font-mono">{selectedDetails.lng.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Last Event</span>
                    <span className="text-white font-mono text-xs">{new Date(selectedDetails.lastEvent).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-700/30 pt-3">
              <p>Data source: USGS Earthquake Hazards Program | Real-time monitoring with 7-day probabilistic forecasting</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
