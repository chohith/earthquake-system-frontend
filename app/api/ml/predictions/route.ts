import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000'

/**
 * Proxy predictions endpoint to Python backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/predictions/magnitude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[v0] Prediction API error:', error)
    return NextResponse.json(
      { error: error.message || 'Prediction failed' },
      { status: 500 }
    )
  }
}
