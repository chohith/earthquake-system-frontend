import { type NextRequest, NextResponse } from "next/server"

const REGIONAL_DATA: Record<string, any> = {
  "Japan Trench": {
    probability: 0.62,
    risk_level: "Elevated",
    confidence: 0.85,
    recent_magnitude: 4.6,
  },
  "San Andreas": {
    probability: 0.48,
    risk_level: "Moderate",
    confidence: 0.78,
    recent_magnitude: 3.4,
  },
  Himalayas: {
    probability: 0.35,
    risk_level: "Moderate",
    confidence: 0.72,
    recent_magnitude: 4.1,
  },
  Cascadia: {
    probability: 0.28,
    risk_level: "Low",
    confidence: 0.68,
    recent_magnitude: 2.85,
  },
  "Philippine Trench": {
    probability: 0.71,
    risk_level: "High",
    confidence: 0.81,
    recent_magnitude: 4.9,
  },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: "Query parameter is required",
        },
        { status: 400 },
      )
    }

    const regionData = REGIONAL_DATA[query] || REGIONAL_DATA[query.toLowerCase()]

    if (!regionData) {
      return NextResponse.json(
        {
          success: false,
          error: `Region "${query}" not found in database`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        region: query,
        ...regionData,
        queried_at: new Date().toISOString(),
        disclaimer: "Probabilistic forecast only. Not exact prediction.",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search region",
      },
      { status: 500 },
    )
  }
}
