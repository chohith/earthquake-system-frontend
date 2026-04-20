import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "https://chohith-seismic-ml-engine-live.hf.space";

export async function GET() {
  try {
    // 1. Fetch from Python backend - filter specifically for 'riseq' or 'india'
    const response = await fetch(`${BACKEND_URL}/api/data/live-earthquakes?limit=100`, {
        cache: 'no-store'
    });

    if (!response.ok) throw new Error(`Backend fetch failed: ${response.status}`);
    const result = await response.json();
    
    // 2. Filter for Indian source only to maintain the legacy API contract
    let indianEvents = (result.events || []).filter((e: any) => 
        e.source === 'riseq' || (e.place && (e.place.toUpperCase().includes('INDIA') || e.place.toUpperCase().includes('UTTARAKHAND') || e.place.toUpperCase().includes('LADAKH')))
    );

    // 3. Fallback: If no Indian events found from backend, try a quick direct USGS check for India
    if (indianEvents.length === 0) {
      console.log("[India Proxy] No events from backend, trying direct USGS fallback...");
      const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", { cache: 'no-store' });
      if (usgsRes.ok) {
        const usgsData = await usgsRes.json();
        const filtered = usgsData.features.filter((f: any) => {
          const [lng, lat] = f.geometry.coordinates;
          // India Bounding Box
          return lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;
        });
        
        indianEvents = filtered.map((f: any) => ({
          id: f.id,
          source: 'usgs',
          magnitude: f.properties.mag,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          depth: f.geometry.coordinates[2],
          place: f.properties.place,
          timestamp: f.properties.time
        }));
      }
    }

    // 4. Map to GeoJSON format expected by the frontend
    const features = indianEvents.map((e: any) => ({
      type: "Feature",
      id: e.id,
      geometry: {
        type: "Point",
        coordinates: [e.longitude, e.latitude, -Math.abs(e.depth)]
      },
      properties: {
        mag: e.magnitude,
        place: e.place,
        time: e.timestamp,
        updated: e.timestamp,
        depth: e.depth,
        magType: "ML",
        net: "IMD",
        source: e.source
      }
    }));

    return NextResponse.json({
      type: "FeatureCollection",
      metadata: {
        generated: Date.now(),
        source: indianEvents.length > 0 && result.events ? "centralized_backend" : "usgs_fallback",
        count: features.length
      },
      features: features
    });

  } catch (error) {
    console.error("[India Proxy] Failed:", error);
    return NextResponse.json({
        type: "FeatureCollection",
        metadata: { generated: Date.now(), source: "india_imd", count: 0, error: (error as Error).message },
        features: []
    }, { status: 500 });
  }
}
