import { NextResponse } from "next/server"
import {
  calculateSTALTA,
  calculateEPIC,
  calculateFinDer,
  calculatePLUM,
  predictWithANN,
  detectWithCNN,
  calculateCombinedSeismicScore,
} from "@/lib/seismic-models"

function predictMagnitudeRange(magnitudes: number[]): [number, number] {
  if (magnitudes.length === 0) return [3.0, 6.0]
  const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
  const maxMag = Math.max(...magnitudes)
  const lowerBound = Math.max(3.0, avgMag - 0.5)
  const upperBound = Math.min(9.0, maxMag + 1.5)
  return [lowerBound, upperBound]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const regionQuery = searchParams.get("region")

    const ninetyDaysAgo = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)

    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${ninetyDaysAgo.toISOString().split("T")[0]}&minmagnitude=2.0&limit=10000`,
      { cache: "no-store" }
    )

    if (!response.ok) throw new Error("USGS API failed")

    const data = await response.json()
    const features = data.features || []

    const regionData = new Map<string, any[]>()

    features.forEach((feature: any) => {
      const place = feature.properties.place || "Unknown"
      const regionName = place.split(",").pop()?.trim() || place
      const mag = feature.properties.mag || 0

      if (!regionData.has(regionName)) {
        regionData.set(regionName, [])
      }
      regionData.get(regionName)!.push({
        magnitude: mag,
        depth: feature.geometry.coordinates[2] || 10,
        time: new Date(feature.properties.time),
        coords: feature.geometry.coordinates,
      })
    })

    const forecasts = Array.from(regionData.entries())
      .map(([regionName, earthquakes]) => {
        const magnitudes = earthquakes.map((eq: any) => eq.magnitude)
        const depths = earthquakes.map((eq: any) => eq.depth || 10)
        const avgMag = magnitudes.reduce((a: number, b: number) => a + b, 0) / magnitudes.length
        const maxMag = Math.max(...magnitudes)
        const avgDepth = depths.reduce((a: number, b: number) => a + b, 0) / depths.length

        // Run all 6 algorithms
        const staLta = calculateSTALTA(magnitudes, Math.min(5, magnitudes.length), Math.min(20, magnitudes.length))
        const distances = earthquakes.map((_: any, i: number) => (i + 1) * 50)
        const epic = calculateEPIC(distances, magnitudes)
        const finDer = calculateFinDer(maxMag, avgDepth)
        const plum = calculatePLUM(avgMag, avgDepth)
        const ann = predictWithANN(magnitudes)
        const cnn = detectWithCNN(magnitudes)

        const combined = calculateCombinedSeismicScore(
          staLta,
          epic.mag,
          finDer.extent,
          plum.intensity,
          ann,
          cnn.confidence
        )

        const probability = Math.min(Math.round(combined * 100), 95)
        const [minMag, maxMagRange] = predictMagnitudeRange(magnitudes)

        const recentEvents = earthquakes.filter((eq: any) => {
          const daysOld = (Date.now() - eq.time.getTime()) / (24 * 60 * 60 * 1000)
          return daysOld < 14
        }).length
        const confidence = Math.min(Math.round((recentEvents / Math.max(earthquakes.length, 1)) * 50 + 50), 95)

        let recommendation = "Low probability - maintain standard monitoring"
        if (probability >= 60) {
          recommendation = "High alert - implement emergency preparedness measures immediately"
        } else if (probability >= 30) {
          recommendation = "Moderate alert - review emergency plans and equipment"
        }

        return {
          region: regionName,
          lat: earthquakes[0]?.coords[1] || 0,
          lng: earthquakes[0]?.coords[0] || 0,
          probability,
          magnitude: [minMag, maxMagRange] as [number, number],
          timeframe: "7 days",
          confidence,
          recommendation,
          eventRate: parseFloat((earthquakes.length / 90).toFixed(2)),
          avgMagnitude: parseFloat(avgMag.toFixed(1)),
          algorithms: {
            staLta: parseFloat(staLta.toFixed(3)),
            epicMagnitude: parseFloat(epic.mag.toFixed(2)),
            finDerExtent: parseFloat(finDer.extent.toFixed(1)),
            plumIntensity: parseFloat(plum.intensity.toFixed(2)),
            annPrediction: parseFloat(ann.toFixed(3)),
            cnnPattern: cnn.pattern,
            cnnConfidence: parseFloat(cnn.confidence.toFixed(2)),
            combinedScore: parseFloat(combined.toFixed(3)),
          },
        }
      })
      .filter((f) => !regionQuery || f.region.toLowerCase().includes(regionQuery.toLowerCase()))
      .sort((a, b) => b.probability - a.probability)

    return NextResponse.json({
      forecasts: forecasts.slice(0, 20),
      totalRegions: forecasts.length,
    })
  } catch (error) {
    console.error("[v0] Forecast API error:", error)
    return NextResponse.json(
      { forecasts: [], totalRegions: 0, error: "Failed to generate forecasts" },
      { status: 500 }
    )
  }
}
