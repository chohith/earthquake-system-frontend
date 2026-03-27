import { NextResponse } from "next/server"
import {
  calculateSTALTA,
  predictWithANN,
  detectWithCNN,
} from "@/lib/seismic-models"

export async function GET() {
  try {
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${ninetyDaysAgo.toISOString().split("T")[0]}&minmagnitude=2&limit=20000`,
      { cache: "no-store" }
    )

    if (!response.ok) throw new Error("USGS API failed")

    const data = await response.json()
    const features = data.features || []

    // Process daily data (90 days)
    const dailyMap: Record<string, { count: number; totalMag: number; magnitudes: number[] }> = {}
    for (let i = 89; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dailyMap[dateStr] = { count: 0, totalMag: 0, magnitudes: [] }
    }

    // Process weekly data
    const weeklyMap: Record<number, { count: number; totalMag: number; magnitudes: number[] }> = {}
    for (let i = 0; i < 13; i++) {
      weeklyMap[i] = { count: 0, totalMag: 0, magnitudes: [] }
    }

    features.forEach((feature: any) => {
      const eventDate = new Date(feature.properties.time)
      const mag = feature.properties.mag || 0

      // Daily processing
      if (eventDate >= ninetyDaysAgo) {
        const dateStr = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].count++
          dailyMap[dateStr].totalMag += mag
          dailyMap[dateStr].magnitudes.push(mag)
        }
      }

      // Weekly processing
      const daysOld = (now.getTime() - eventDate.getTime()) / (24 * 60 * 60 * 1000)
      const week = Math.floor(daysOld / 7)
      if (weeklyMap[week] !== undefined) {
        weeklyMap[week].count++
        weeklyMap[week].totalMag += mag
        weeklyMap[week].magnitudes.push(mag)
      }
    })

    // Format daily data with algorithm insights
    const dailyData = Object.entries(dailyMap).map(([date, d]) => {
      const staLta = d.magnitudes.length > 2 ? calculateSTALTA(d.magnitudes, Math.min(3, d.magnitudes.length), d.magnitudes.length) : 0
      const annPred = d.magnitudes.length > 0 ? predictWithANN(d.magnitudes) : 0
      const cnn = detectWithCNN(d.magnitudes)

      return {
        date,
        count: d.count,
        avgMagnitude: d.count > 0 ? parseFloat((d.totalMag / d.count).toFixed(1)) : 0,
        staLta: parseFloat(staLta.toFixed(2)),
        annPrediction: parseFloat(annPred.toFixed(2)),
        cnnConfidence: parseFloat(cnn.confidence.toFixed(2)),
      }
    })

    // Format weekly data
    const weeklyData = Object.entries(weeklyMap)
      .filter(([, d]) => d.count > 0)
      .map(([week, d]) => {
        const staLta = d.magnitudes.length > 2 ? calculateSTALTA(d.magnitudes, Math.min(5, d.magnitudes.length), d.magnitudes.length) : 0

        return {
          week: `W${13 - parseInt(week)}`,
          count: d.count,
          avgMagnitude: d.count > 0 ? parseFloat((d.totalMag / d.count).toFixed(1)) : 0,
          staLta: parseFloat(staLta.toFixed(2)),
        }
      })

    // Generate yearly trend from all available data grouped by magnitude thresholds
    const allMagnitudes = features.map((f: any) => f.properties.mag || 0)
    const yearlyData = []
    const currentYear = now.getFullYear()
    for (let year = currentYear - 9; year <= currentYear; year++) {
      const yearFeatures = features.filter((f: any) => new Date(f.properties.time).getFullYear() === year)
      const yearMags = yearFeatures.map((f: any) => f.properties.mag || 0)
      yearlyData.push({
        year: year.toString(),
        count: yearFeatures.length,
        magnitude7plus: yearMags.filter((m: number) => m >= 7).length,
        avgMagnitude: yearMags.length > 0 ? parseFloat((yearMags.reduce((a: number, b: number) => a + b, 0) / yearMags.length).toFixed(1)) : 0,
      })
    }

    return NextResponse.json({
      daily: dailyData,
      weekly: weeklyData.slice(-13),
      yearly: yearlyData,
      algorithmSummary: {
        totalEventsAnalyzed: features.length,
        globalStaLta: allMagnitudes.length > 2 ? parseFloat(calculateSTALTA(allMagnitudes, Math.min(10, allMagnitudes.length), allMagnitudes.length).toFixed(3)) : 0,
        globalAnnTrend: allMagnitudes.length > 0 ? parseFloat(predictWithANN(allMagnitudes).toFixed(3)) : 0,
        globalCnnPattern: detectWithCNN(allMagnitudes),
      },
    })
  } catch (error) {
    console.error("[v0] Historical data API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch historical data", daily: [], weekly: [], yearly: [], algorithmSummary: null },
      { status: 500 }
    )
  }
}
