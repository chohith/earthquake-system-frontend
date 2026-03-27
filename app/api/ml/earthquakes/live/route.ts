import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000'

/**
 * Get live earthquake data from both USGS and RISEQ sources
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '100'

    const response = await fetch(`${BACKEND_URL}/api/data/live-earthquakes?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Add cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    console.error('[v0] Live earthquakes API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch live earthquakes' },
      { status: 500 }
    )
  }
}
