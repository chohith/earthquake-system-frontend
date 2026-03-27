import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000'

/**
 * Get model status and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const [statusRes, perfRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/models/status`),
      fetch(`${BACKEND_URL}/api/models/performance`),
    ])

    if (!statusRes.ok || !perfRes.ok) {
      throw new Error('Failed to fetch model data')
    }

    const [status, performance] = await Promise.all([
      statusRes.json(),
      perfRes.json(),
    ])

    return NextResponse.json({
      status,
      performance,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[v0] Models API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch model data' },
      { status: 500 }
    )
  }
}
