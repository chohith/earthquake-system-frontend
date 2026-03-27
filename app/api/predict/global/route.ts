import { type NextRequest, NextResponse } from "next/server"

interface RequestBody {
  days?: number
  min_magnitude?: number
}

// Mock regional seismic data
const REGIONAL_DATA = [
  {
    region: "Japan Trench",
    recentActivity: [4.2, 4.5, 3.8, 5.1, 4.3, 4.7, 4.9],
    historicalBaseline: 4.5,
    depth: 35,
    latitude: 38.1,
    longitude: 142.5,
  },
  {
    region: "San Andreas",
    recentActivity: [3.2, 3.5, 2.8, 3.6, 3.1, 3.4, 3.3],
    historicalBaseline: 3.4,
    depth: 15,
    latitude: 36.8,
    longitude: -120.8,
  },
  {
    region: "Himalayas",
    recentActivity: [4.1, 3.9, 4.3, 4.0, 4.2, 3.8, 4.1],
    historicalBaseline: 4.0,
    depth: 25,
    latitude: 28.2,
    longitude: 84.7,
  },
  {
    region: "Philippine Trench",
    recentActivity: [4.8, 5.2, 4.5, 5.1, 4.9, 5.3, 5.0],
    historicalBaseline: 4.9,
    depth: 45,
    latitude: 11.1,
    longitude: 126.6,
  },
  {
    region: "Cascadia",
    recentActivity: [2.8, 3.1, 2.5, 3.0, 2.9, 2.7, 2.8],
    historicalBaseline: 2.85,
    depth: 20,
    latitude: 45.2,
    longitude: -124.0,
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const daysParam = searchParams.get("days") || "7"
    const minMagnitude = Number.parseFloat(searchParams.get("min_magnitude") || "0")

    const days = Math.min(Number.parseInt(daysParam), 30)

    // Generate probabilistic forecasts
    const forecasts = REGIONAL_DATA.map((region) => {
      // Simplified probability calculation
      const recentAvg = region.recentActivity.reduce((a, b) => a + b, 0) / region.recentActivity.length
      const anomaly = Math.max(...region.recentActivity) - region.historicalBaseline
      const probability = Math.min(0.3 + anomaly * 0.1, 0.95)

      const riskLevel =
        probability > 0.7 ? "High" : probability > 0.5 ? "Elevated" : probability > 0.3 ? "Moderate" : "Low"

      return {
        region: region.region,
        probability: Number.parseFloat(probability.toFixed(2)),
        risk_level: riskLevel,
        confidence: Number.parseFloat((0.6 + region.recentActivity.length * 0.05).toFixed(2)),
        latitude: region.latitude,
        longitude: region.longitude,
        recent_magnitude: Number.parseFloat(recentAvg.toFixed(1)),
      }
    })
      .filter((f) => f.recent_magnitude >= minMagnitude)
      .sort((a, b) => b.probability - a.probability)

    return NextResponse.json(
      {
        success: true,
        forecast_window_days: days,
        forecast_generated_at: new Date().toISOString(),
        regions: forecasts,
        disclaimer: "These are probabilistic estimates. Earthquakes cannot be predicted with exact timing or location.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Prediction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate predictions",
      },
      { status: 500 },
    )
  }
}
