import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Refresh every minute

const BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "https://chohith-earthquake-prediction-system.hf.space";

export async function GET() {
  try {
    // 1. Fetch from the centralized Python backend (Filtered for noise/deduplicated)
    const response = await fetch(`${BACKEND_URL}/api/data/live-earthquakes?limit=500`, {
      cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error(`Python Backend returned ${response.status}`);
    }

    const result = await response.json();
    const events = result.events || [];

    // 2. Map back to the legacy format exactly as expected by the Analytics graphs
    const mappedEvents = events.map((e: any) => ({
      timestamp: e.time, // ISO string
      timeUTC: new Date(e.time).toUTCString(),
      location: e.place, // Now maps to State names for India!
      magnitude: e.magnitude,
      depth: e.depth,
      latitude: e.latitude,
      longitude: e.longitude,
      source: e.source,
    }));

    // 3. Recalculate stats based on the filtered set
    const magnitudes = mappedEvents.map((e: any) => e.magnitude);
    const stats = {
        totalEvents: mappedEvents.length,
        maxMagnitude: magnitudes.length > 0 ? Math.max(...magnitudes) : 0,
        avgMagnitude: magnitudes.length > 0 ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length : 0,
        avgDepth: mappedEvents.length > 0 ? mappedEvents.reduce((a, b) => a + b, e.depth) / mappedEvents.length : 0,
        sourceBreakdown: result.stats?.usgs_count ? { 
            usgs: result.stats.usgs_count, 
            riseq: result.stats.riseq_count 
        } : { usgs: 0, riseq: 0 }
    };

    return NextResponse.json({
        success: true,
        data: mappedEvents,
        statistics: stats,
        count: mappedEvents.length,
        lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[v0] Proxy API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Backend is currently offline or unreachable.',
      },
      { status: 500 }
    );
  }
}
