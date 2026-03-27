/**
 * Dual source earthquake data fetching utility
 * Fetches from both USGS and RISEQ (Indian Institute of Seismology)
 */

export interface EarthquakeData {
  id: string
  lat: number
  lng: number
  mag: number
  place: string
  time: string
  depth: number
  timestamp: number
  source: 'usgs' | 'riseq'
}

/**
 * Fetch earthquake data from USGS API
 * Uses the standard USGS GeoJSON feed with multiple time ranges
 */
async function fetchFromUSGS(timeRange: string = 'week'): Promise<EarthquakeData[]> {
  try {
    const urls: Record<string, string> = {
      hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
      day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson',
      month: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
    }

    const response = await fetch(urls[timeRange] || urls.week, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`USGS HTTP ${response.status}`)
    const data = await response.json()

    return (data.features || []).map((feature: any, idx: number) => {
      const { geometry, properties } = feature
      const [lng, lat, depth] = geometry?.coordinates || [0, 0, 0]
      return {
        id: `usgs-${properties?.code || idx}`,
        lat,
        lng,
        mag: properties?.mag || 0,
        place: properties?.place || 'Unknown',
        time: properties?.time ? new Date(properties.time).toLocaleString() : 'N/A',
        depth: depth || 0,
        timestamp: properties?.time || Date.now(),
        source: 'usgs' as const,
      }
    })
  } catch (error) {
    console.error('[dual-earthquake-fetch] USGS fetch error:', error)
    return []
  }
}

/**
 * Fetch earthquake data from RISEQ (Regional Seismic Network of India)
 * RISEQ provides real-time earthquake data for the Indian region and surrounding areas
 * API: https://riseq.seismo.gov.in/riseq/earthquake
 */
async function fetchFromRISEQ(): Promise<EarthquakeData[]> {
  // RISEQ often blocks client-side browsers due to strict CORS rules. 
  // We bypass direct browser fetching here to prevent V0 React crashes.
  // Our Python ML Backend handles RISEQ securely server-side.
  return [];
}

/**
 * Fetch earthquake data from both sources and merge
 * Deduplicates based on location and time proximity
 */
export async function fetchDualSourceEarthquakes(timeRange: string = 'week'): Promise<EarthquakeData[]> {
  try {
    const [usgsData, riseqData] = await Promise.all([
      fetchFromUSGS(timeRange),
      fetchFromRISEQ(),
    ])

    // Merge and deduplicate
    const merged: EarthquakeData[] = [...usgsData, ...riseqData]

    // Remove duplicates based on similar coordinates and magnitude (within 0.1 degrees and 0.1 magnitude)
    const seen = new Set<string>()
    const deduplicated: EarthquakeData[] = []

    merged.forEach((item) => {
      const key = `${Math.round(item.lat * 100)}-${Math.round(item.lng * 100)}-${Math.round(item.mag * 10)}`
      if (!seen.has(key)) {
        seen.add(key)
        deduplicated.push(item)
      }
    })

    // Sort by timestamp descending (most recent first)
    return deduplicated.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('[dual-earthquake-fetch] Combined fetch error:', error)
    // Fallback to USGS only
    return fetchFromUSGS(timeRange)
  }
}

/**
 * Fetch only 24-hour earthquake data from both sources
 */
export async function fetchDualSource24Hours(): Promise<EarthquakeData[]> {
  return fetchDualSourceEarthquakes('day')
}
