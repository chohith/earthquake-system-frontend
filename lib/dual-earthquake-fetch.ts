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
  try {
    const response = await fetch('/api/india-earthquakes', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (!response.ok) throw new Error(`RISEQ API HTTP ${response.status}`)
    const data = await response.json()

    return (data.features || []).map((feature: any) => {
      const { geometry, properties, id } = feature
      const [lng, lat, depth] = geometry?.coordinates || [0, 0, 0]
      return {
        id: id || `imd-${Date.now()}-${Math.random()}`,
        lat,
        lng,
        mag: properties?.mag || 0,
        place: properties?.place || 'Unknown Indian Region',
        time: new Date(properties.time).toLocaleString(),
        depth: depth || 0,
        timestamp: properties?.time || Date.now(),
        source: 'riseq' as const,
      }
    })
  } catch (error) {
    console.error('[dual-earthquake-fetch] RISEQ fetch error:', error)
    return []
  }
}

/**
 * Fetch earthquake data from both sources via the centralized Python backend
 * This ensures strict filtering (no noise) and dynamic duration support.
 */
export async function fetchDualSourceEarthquakes(timeRange: string = 'week'): Promise<EarthquakeData[]> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "https://chohith-seismic-ml-engine-live.hf.space";
  
  try {
     // duration mapping: 'hour'|'day'|'week'|'month'
     const response = await fetch(`${BACKEND_URL}/api/data/recent?duration=${timeRange}`, {
       cache: 'no-store'
     });

     if (!response.ok) throw new Error(`Backend fetch failed: ${response.status}`);
     const result = await response.json();

     if (result.data) {
        return result.data.map((e: any) => ({
            id: `quake-${e.time}-${e.latitude}`,
            lat: e.latitude,
            lng: e.longitude,
            mag: e.magnitude,
            place: e.place, // Now maps to State names for Indian events!
            time: new Date(e.time).toLocaleString(),
            depth: e.depth,
            timestamp: e.time,
            source: e.source || 'usgs'
        }));
     }
     return [];
  } catch (error) {
    console.error('[dual-earthquake-fetch] Unified fetch error:', error);
    return [];
  }
}

/**
 * Fetch only 24-hour earthquake data from both sources
 */
export async function fetchDualSource24Hours(): Promise<EarthquakeData[]> {
  return fetchDualSourceEarthquakes('day')
}
