import { generateEarthquakePrediction } from "@/lib/advanced-prediction-models"
import { fetchEarthquakeData, aggregateByRegion } from "@/lib/richterx-data-integration"
import { type NextRequest, NextResponse } from "next/server"

interface PredictionRequest {
  region: string
  radiusKm: number
  minMagnitude: number
  timeHorizon: "7days" | "30days" | "1year"
  model: string
}

// Sample region definitions (lat, lng bounds)
const REGIONS: Record<string, [number, number, number, number]> = {
  india: [8.4, 37.6, 68.7, 97.2],
  "Japan Trench": [30, 45, 130, 145],
  "San Andreas": [32, 43, -125, -113],
  Himalayas: [25, 35, 75, 95],
  "Ring of Fire": [-60, 60, -180, 180]
}

export async function POST(request: NextRequest) {
  try {
    const body: PredictionRequest = await request.json()

    // Fetch real-time earthquake data
    const regionBounds = REGIONS[body.region]
    const bounds = regionBounds
      ? {
          minLat: regionBounds[0],
          maxLat: regionBounds[1],
          minLng: regionBounds[2],
          maxLng: regionBounds[3],
        }
      : undefined

    const earthquakeData = await fetchEarthquakeData(bounds, 30)

    // Aggregate by region
    const regionMetrics = aggregateByRegion(earthquakeData, new Map([[body.region, regionBounds]]))

    // Mock seismic region for prediction
    const seismicRegion = {
      id: body.region.replace(/\s+/g, "_"),
      name: body.region,
      latitude: (regionBounds[0] + regionBounds[1]) / 2,
      longitude: (regionBounds[2] + regionBounds[3]) / 2,
      historicalMagnitudes: [4.2, 4.5, 3.8, 5.1, 4.7, 4.3, 4.9, 4.1],
      recentActivity: earthquakeData.slice(0, 20).map((e) => e.magnitude),
      faultDepth: 50 + Math.random() * 100,
      tectonicPlateVelocity: 2 + Math.random() * 8,
    }

    // Generate prediction
    const prediction = generateEarthquakePrediction(seismicRegion, body.radiusKm, body.minMagnitude)

    return NextResponse.json({
      ...prediction,
      model: body.model,
      timeHorizon: body.timeHorizon,
      dataPoints: earthquakeData.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Prediction API error:", error)
    return NextResponse.json({ error: "Prediction generation failed" }, { status: 500 })
  }
}
