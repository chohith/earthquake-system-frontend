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

function calculateRiskIndexForRegion(earthquakes: any[]): {
  riskIndex: number
  algorithmScores: {
    staLta: number
    epic: { mag: number; confidence: number }
    finDer: { ruptureMagnitude: number; extent: number }
    plum: { intensity: number; velocity: number }
    ann: number
    cnn: { pattern: string; confidence: number }
    combined: number
  }
} {
  if (earthquakes.length === 0) {
    return {
      riskIndex: 0,
      algorithmScores: {
        staLta: 0,
        epic: { mag: 0, confidence: 0 },
        finDer: { ruptureMagnitude: 0, extent: 0 },
        plum: { intensity: 0, velocity: 0 },
        ann: 0,
        cnn: { pattern: "none", confidence: 0 },
        combined: 0,
      },
    }
  }

  const magnitudes = earthquakes.map((eq: any) => eq.magnitude)
  const depths = earthquakes.map((eq: any) => eq.depth || 10)
  const avgMag = magnitudes.reduce((a: number, b: number) => a + b, 0) / magnitudes.length
  const maxMag = Math.max(...magnitudes)
  const avgDepth = depths.reduce((a: number, b: number) => a + b, 0) / depths.length

  // 1. STA/LTA - Short-term vs long-term amplitude ratio
  const staLta = calculateSTALTA(magnitudes, Math.min(5, magnitudes.length), Math.min(20, magnitudes.length))

  // 2. EPIC - Point-source magnitude estimation
  const distances = earthquakes.map((_: any, i: number) => (i + 1) * 50)
  const epic = calculateEPIC(distances, magnitudes)

  // 3. FinDer - Finite-fault rupture detection
  const finDer = calculateFinDer(maxMag, avgDepth)

  // 4. PLUM - Ground motion propagation
  const plum = calculatePLUM(avgMag, avgDepth)

  // 5. ANN - Neural network trend prediction
  const ann = predictWithANN(magnitudes)

  // 6. CNN - Pattern detection in frequency domain
  const cnn = detectWithCNN(magnitudes)

  // Combined score from all 6 models
  const combined = calculateCombinedSeismicScore(
    staLta,
    epic.mag,
    finDer.extent,
    plum.intensity,
    ann,
    cnn.confidence
  )

  const riskIndex = Math.max(5, Math.min(95, Math.round(combined * 100)))

  return {
    riskIndex,
    algorithmScores: { staLta, epic, finDer, plum, ann, cnn, combined },
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get("region")

    const thirtyDaysAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)

    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${thirtyDaysAgo.toISOString().split("T")[0]}&minmagnitude=2.5&limit=5000`,
      { cache: "no-store" }
    )

    if (!response.ok) throw new Error("USGS API failed")

    const data = await response.json()
    const features = data.features || []

    const regionData = new Map<
      string,
      { earthquakes: any[]; lat: number; lng: number; recentCount: number; lastEventTime: number }
    >()

    features.forEach((feature: any) => {
      const place = feature.properties.place || "Unknown"
      const regionName = place.split(",").pop()?.trim() || place
      const coords = feature.geometry.coordinates
      const mag = feature.properties.mag || 0
      const time = feature.properties.time

      if (!regionData.has(regionName)) {
        regionData.set(regionName, {
          earthquakes: [],
          lat: coords[1],
          lng: coords[0],
          recentCount: 0,
          lastEventTime: 0,
        })
      }

      const rd = regionData.get(regionName)!
      rd.earthquakes.push({
        magnitude: mag,
        depth: coords[2] || 10,
        time: new Date(time),
        lat: coords[1],
        lng: coords[0],
      })
      rd.recentCount++
      rd.lastEventTime = Math.max(rd.lastEventTime, time)
    })

    const riskResults = Array.from(regionData.entries())
      .map(([regionName, rd]) => {
        const { riskIndex, algorithmScores } = calculateRiskIndexForRegion(rd.earthquakes)
        return {
          region: regionName,
          lat: rd.lat,
          lng: rd.lng,
          riskIndex,
          recentEvents: rd.recentCount,
          lastEventTime: rd.lastEventTime,
          earthquakeCount: rd.earthquakes.length,
          algorithms: {
            staLta: parseFloat(algorithmScores.staLta.toFixed(3)),
            epicMagnitude: parseFloat(algorithmScores.epic.mag.toFixed(2)),
            epicConfidence: parseFloat(algorithmScores.epic.confidence.toFixed(2)),
            finDerRupture: parseFloat(algorithmScores.finDer.ruptureMagnitude.toFixed(2)),
            finDerExtent: parseFloat(algorithmScores.finDer.extent.toFixed(1)),
            plumIntensity: parseFloat(algorithmScores.plum.intensity.toFixed(2)),
            plumVelocity: parseFloat(algorithmScores.plum.velocity.toFixed(4)),
            annPrediction: parseFloat(algorithmScores.ann.toFixed(3)),
            cnnPattern: algorithmScores.cnn.pattern,
            cnnConfidence: parseFloat(algorithmScores.cnn.confidence.toFixed(2)),
            combinedScore: parseFloat(algorithmScores.combined.toFixed(3)),
          },
        }
      })
      .sort((a, b) => b.riskIndex - a.riskIndex)

    const filtered = region
      ? riskResults.filter((r) => r.region.toLowerCase().includes(region.toLowerCase()))
      : riskResults

    return NextResponse.json({
      data: filtered.slice(0, 20),
      total: riskResults.length,
    })
  } catch (error) {
    console.error("[v0] Risk index API error:", error)
    return NextResponse.json({ data: [], total: 0, error: "Failed to calculate risk index" }, { status: 500 })
  }
}
