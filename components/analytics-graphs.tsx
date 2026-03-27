"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface AnalyticsData {
  daily: any[]
  weekly: any[]
  monthly: any[]
}

export function AnalyticsGraphs() {
  const [dailyData, setDailyData] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true)
        // Fetch real-time 24-hour data
        const response = await fetch("/api/earthquake-data/24hours", {
          cache: "no-store",
        })
        const result = await response.json()

        if (result.data && Array.isArray(result.data)) {
          // Process data into different time aggregations
          const processed = processEarthquakeData(result.data)
          setDailyData(processed.daily)
          setWeeklyData(processed.weekly)
          setMonthlyData(processed.monthly)
          setLastUpdated(new Date().toLocaleTimeString())
        }
      } catch (error) {
        console.error("[v0] Error fetching analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
    // Poll every 10 minutes for fresh data
    const interval = setInterval(fetchAnalyticsData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Process raw earthquake data into daily, weekly, and monthly aggregates with forecast data
   */
  function processEarthquakeData(events: any[]): AnalyticsData {
    const daily: { [key: string]: any } = {}
    const weekly: { [key: number]: any } = {}
    const monthly: { [key: string]: any } = {}

    events.forEach((event) => {
      const eventDate = new Date(event.timestamp)
      const dayKey = eventDate.toISOString().split("T")[0]
      const weekKey = Math.floor(eventDate.getTime() / (7 * 24 * 60 * 60 * 1000))
      const monthKey = eventDate.toISOString().substring(0, 7)

      // Daily aggregation
      if (!daily[dayKey]) {
        daily[dayKey] = {
          date: dayKey,
          count: 0,
          maxMagnitude: 0,
          avgMagnitude: 0,
          magnitudes: [],
          depths: [],
          forecastPct: 0,
        }
      }
      daily[dayKey].count++
      daily[dayKey].magnitudes.push(event.magnitude)
      daily[dayKey].depths.push(event.depth)
      daily[dayKey].maxMagnitude = Math.max(daily[dayKey].maxMagnitude, event.magnitude)

      // Weekly aggregation
      if (!weekly[weekKey]) {
        weekly[weekKey] = {
          week: `Week ${Math.floor(weekKey % 52)}`,
          count: 0,
          maxMagnitude: 0,
          avgMagnitude: 0,
          magnitudes: [],
          forecastPct: 0,
        }
      }
      weekly[weekKey].count++
      weekly[weekKey].magnitudes.push(event.magnitude)
      weekly[weekKey].maxMagnitude = Math.max(weekly[weekKey].maxMagnitude, event.magnitude)

      // Monthly aggregation
      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          month: monthKey,
          count: 0,
          maxMagnitude: 0,
          avgMagnitude: 0,
          magnitudes: [],
          forecastPct: 0,
        }
      }
      monthly[monthKey].count++
      monthly[monthKey].magnitudes.push(event.magnitude)
      monthly[monthKey].maxMagnitude = Math.max(monthly[monthKey].maxMagnitude, event.magnitude)
    })

    // Calculate averages and forecast percentages
    Object.values(daily).forEach((day: any) => {
      day.avgMagnitude = day.magnitudes.length > 0 ? day.magnitudes.reduce((a: number, b: number) => a + b) / day.magnitudes.length : 0
      day.avgDepth = day.depths.length > 0 ? day.depths.reduce((a: number, b: number) => a + b) / day.depths.length : 0
      // Calculate forecast: magnitude contribution + event activity
      const magFactor = (day.maxMagnitude / 9) * 40
      const activityFactor = Math.min((day.count / 30) * 40, 40)
      day.forecastPct = Math.min(Math.round(magFactor + activityFactor + 20), 100)
    })

    Object.values(weekly).forEach((week: any) => {
      week.avgMagnitude = week.magnitudes.length > 0 ? week.magnitudes.reduce((a: number, b: number) => a + b) / week.magnitudes.length : 0
      const magFactor = (week.maxMagnitude / 9) * 40
      const activityFactor = Math.min((week.count / 100) * 40, 40)
      week.forecastPct = Math.min(Math.round(magFactor + activityFactor + 20), 100)
    })

    Object.values(monthly).forEach((month: any) => {
      month.avgMagnitude = month.magnitudes.length > 0 ? month.magnitudes.reduce((a: number, b: number) => a + b) / month.magnitudes.length : 0
      const magFactor = (month.maxMagnitude / 9) * 40
      const activityFactor = Math.min((month.count / 300) * 40, 40)
      month.forecastPct = Math.min(Math.round(magFactor + activityFactor + 20), 100)
    })

    return {
      daily: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
      weekly: Object.values(weekly).sort((a: any, b: any) => a.week.localeCompare(b.week)),
      monthly: Object.values(monthly).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-balance">Historical Earthquake Analytics</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time earthquake data visualization from USGS Earthquake Hazards Program
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {lastUpdated ? `Updated: ${lastUpdated}` : ""}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading real-time earthquake analytics...</p>
          </div>
        </div>
      ) : dailyData.length === 0 ? (
        <Card className="p-6 bg-slate-800/50 border-slate-700/50">
          <p className="text-center text-slate-400">No recent earthquake data available</p>
        </Card>
      ) : (
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              Daily Activity
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              Weekly Trends
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              Monthly Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4 mt-4">
            <Card className="p-4 bg-slate-800/50 border-slate-700/50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Daily Earthquake Activity & Forecast</h3>
                <p className="text-sm text-slate-400">Event count, magnitude trends, and 7-day forecast percentage over time</p>
              </div>
              <div className="w-full h-80 overflow-x-auto">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} yAxisId="left" />
                    <YAxis stroke="#a78bfa" tick={{ fontSize: 12 }} yAxisId="right" orientation="right" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value.toFixed(2)
                        }
                        return value
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.1}
                      name="Event Count"
                      strokeWidth={2}
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMagnitude"
                      stroke="#fbbf24"
                      name="Avg Magnitude"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                    />
                    <Line
                      type="monotone"
                      dataKey="maxMagnitude"
                      stroke="#ef4444"
                      name="Max Magnitude"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastPct"
                      stroke="#a78bfa"
                      name="Forecast %"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <Card className="p-4 bg-slate-800/50 border-slate-700/50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Weekly Earthquake Trends & Forecast</h3>
                <p className="text-sm text-slate-400">Aggregated weekly activity, magnitude distribution, and forecast percentage</p>
              </div>
              <div className="w-full h-80 overflow-x-auto">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} yAxisId="left" />
                    <YAxis stroke="#a78bfa" tick={{ fontSize: 12 }} yAxisId="right" orientation="right" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value.toFixed(2)
                        }
                        return value
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#06b6d4" name="Weekly Events" radius={[4, 4, 0, 0]} yAxisId="left" />
                    <Bar dataKey="avgMagnitude" fill="#fbbf24" name="Avg Magnitude" radius={[4, 4, 0, 0]} yAxisId="right" />
                    <Line
                      type="monotone"
                      dataKey="maxMagnitude"
                      stroke="#ef4444"
                      name="Max Magnitude"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 3 }}
                      yAxisId="right"
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastPct"
                      stroke="#a78bfa"
                      name="Forecast %"
                      strokeWidth={2}
                      dot={{ fill: "#a78bfa", r: 3 }}
                      yAxisId="right"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4 mt-4">
            <Card className="p-4 bg-slate-800/50 border-slate-700/50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">Monthly Earthquake Overview & Forecast</h3>
                <p className="text-sm text-slate-400">Monthly event counts, magnitude distribution, and forecast percentage</p>
              </div>
              <div className="w-full h-80 overflow-x-auto">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value.toFixed(2)
                        }
                        return value
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      name="Total Events"
                      strokeWidth={2}
                      dot={{ fill: "#06b6d4", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgMagnitude"
                      stroke="#fbbf24"
                      name="Avg Magnitude"
                      strokeWidth={2}
                      dot={{ fill: "#fbbf24", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxMagnitude"
                      stroke="#ef4444"
                      name="Max Magnitude"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastPct"
                      stroke="#a78bfa"
                      name="Forecast %"
                      strokeWidth={2}
                      dot={{ fill: "#a78bfa", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
