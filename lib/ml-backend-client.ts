/**
 * Service to communicate with Python ML Backend
 */
const BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "https://chohith-seismic-ml-engine-live.hf.space"

export interface PredictionResponse {
  prediction: number
  confidence: number
  model_name: string
  timestamp: string
  sources: string[]
}

export interface LiveEarthquakeData {
  total_events: number
  events: Array<{
    source: string
    id: string
    magnitude: number
    latitude: number
    longitude: number
    depth: number
    place: string
    time: string
    timestamp: number
  }>
  stats: {
    max_magnitude: number
    avg_magnitude: number
    max_depth: number
    avg_depth: number
    usgs_count: number
    riseq_count: number
  }
  timestamp: string
}

export interface ModelStatus {
  timestamp: string
  models: Record<string, { available: boolean; path: string }>
  data_sources: string[]
}

/**
 * Predict earthquake magnitude using trained ML models
 */
export async function predictMagnitude(features: number[], modelName: string = "ensemble"): Promise<PredictionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/predictions/magnitude`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, model_name: modelName }),
    })

    if (!response.ok) throw new Error(`Prediction failed: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Magnitude prediction error:", error)
    throw error
  }
}

/**
 * Get live earthquake data from both USGS and RISEQ sources
 */
export async function getLiveEarthquakes(limit: number = 100): Promise<LiveEarthquakeData> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/data/live-earthquakes?limit=${limit}`)

    if (!response.ok) throw new Error(`Failed to fetch live earthquakes: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Live earthquakes fetch error:", error)
    throw error
  }
}

/**
 * Get earthquake statistics
 */
export async function getEarthquakeStatistics() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/data/statistics`)

    if (!response.ok) throw new Error(`Failed to fetch statistics: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Statistics fetch error:", error)
    throw error
  }
}

/**
 * Get model status
 */
export async function getModelStatus(): Promise<ModelStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/models/status`)

    if (!response.ok) throw new Error(`Failed to fetch model status: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Model status fetch error:", error)
    throw error
  }
}

/**
 * Get model performance metrics
 */
export async function getModelPerformance() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/models/performance`)

    if (!response.ok) throw new Error(`Failed to fetch performance metrics: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Performance fetch error:", error)
    throw error
  }
}

/**
 * Get earthquake risk index assessment
 */
export async function getRiskIndex() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/predictions/risk-index`, {
      cache: "no-store",
    })

    if (!response.ok) throw new Error(`Failed to fetch risk index: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Risk index fetch error:", error)
    throw error
  }
}

/**
 * Get live region specific earthquake data and predictions
 */
export async function getLiveRegionData(country: string, timeWindow: string = "month") {
  try {
    const response = await fetch(`${BACKEND_URL}/api/predictions/live-region?country=${country}&time_window=${timeWindow}`, {
      cache: "no-store",
    })

    if (!response.ok) throw new Error(`Failed to fetch live region data: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Live region data fetch error:", error)
    throw error
  }
}

/**
 * Trigger model retraining
 */
export async function triggerModelRetraining() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/models/train`, {
      method: "POST",
    })

    if (!response.ok) throw new Error(`Retraining request failed: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error("[v0] Retraining request error:", error)
    throw error
  }
}
