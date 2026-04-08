import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

interface EarthquakeEvent {
  timestamp: string;
  timeUTC: string;
  location: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  source: 'usgs' | 'riseq';
}

/**
 * Fetch real-time earthquake data from USGS API for 2026
 */
async function fetchUSGSEarthquakeData(): Promise<EarthquakeEvent[]> {
  try {
    const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson', {
      headers: { 'User-Agent': 'Earthquake-Dashboard/1.0' },
      next: { revalidate: 3600 }
    });

    if (!response.ok) throw new Error(`USGS API error: ${response.status}`);
    
    const data = await response.json();
    const features = data.features || [];

    return features.map((feature: any) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      return {
        timestamp: new Date(props.time).toISOString(),
        timeUTC: new Date(props.time).toUTCString(),
        location: props.place || 'Unknown Location',
        magnitude: props.mag || 0,
        depth: coords[2] || 0,
        latitude: coords[1] || 0,
        longitude: coords[0] || 0,
        source: 'usgs' as const,
      };
    }).filter((event: any) => {
      const year = new Date(event.timestamp).getFullYear();
      return year === 2026;
    });
  } catch (error) {
    console.error('[v0] Error fetching USGS data:', error);
    return [];
  }
}

/**
 * Fetch earthquake data from RISEQ (Regional Seismic Network of India) by scraping HTML
 */
async function fetchRISEQEarthquakeData(): Promise<EarthquakeEvent[]> {
  try {
    const response = await fetch('https://riseq.seismo.gov.in/riseq/earthquake', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 0 }
    });

    if (!response.ok) throw new Error(`RISEQ HTTP error: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const events: EarthquakeEvent[] = [];

    $('li.event_list').each((_, el) => {
      try {
        const jsonStr = $(el).attr('data-json');
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          const coords = data.lat_long ? data.lat_long.split(',').map((s: string) => parseFloat(s.trim())) : [0, 0];
          
          let mag = 0; let depth = 0;
          if (data.magnitude_depth) {
             const mMatch = data.magnitude_depth.match(/M:\s*([\d.]+)/);
             if (mMatch) mag = parseFloat(mMatch[1]);
             const dMatch = data.magnitude_depth.match(/D:\s*([\d.]+)km/);
             if (dMatch) depth = parseFloat(dMatch[1]);
          }

          let timeVal = new Date().toISOString();
          if (data.origin_time) {
             const cleanDateStr = data.origin_time.replace(' IST', '').replace(/-/g, '/');
             const localMillis = new Date(cleanDateStr).getTime();
             if (!isNaN(localMillis)) {
                timeVal = new Date(localMillis - (5.5 * 60 * 60 * 1000)).toISOString();
             }
          }

          events.push({
            timestamp: timeVal,
            timeUTC: new Date(timeVal).toUTCString(),
            location: data.event_name ? data.event_name.replace(/M:\s*[\d.]+\s*-\s*/, '') : 'Unknown Region',
            magnitude: mag,
            depth: depth,
            latitude: coords[0] || 0,
            longitude: coords[1] || 0,
            source: 'riseq',
          });
        }
      } catch (e) {}
    });

    return events.filter(e => new Date(e.timestamp).getFullYear() === 2026);
  } catch (error) {
    console.error('[v0] Error fetching RISEQ data:', error);
    return [];
  }
}

/**
 * Aggregate events by date
 */
function aggregateByDate(events: EarthquakeEvent[]) {
  const aggregated: { [key: string]: any } = {};

  events.forEach((event) => {
    const dateKey = event.timestamp.split('T')[0];
    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        date: dateKey,
        location: event.location,
        magnitude: event.magnitude,
        depth: event.depth,
        lastUpdated: new Date().toISOString(),
        eventCount: 1,
        sources: new Set([event.source]),
      };
    } else {
      aggregated[dateKey].eventCount++;
      aggregated[dateKey].sources.add(event.source);
      if (event.magnitude > aggregated[dateKey].magnitude) {
        aggregated[dateKey].magnitude = event.magnitude;
        aggregated[dateKey].location = event.location;
      }
    }
  });

  return Object.values(aggregated)
    .map((item: any) => ({ ...item, sources: Array.from(item.sources) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET() {
  try {
    const [usgsEvents, riseqEvents] = await Promise.all([
      fetchUSGSEarthquakeData(),
      fetchRISEQEarthquakeData(),
    ]);

    const allEvents = [...usgsEvents, ...riseqEvents];
    const seen = new Set<string>();
    const deduplicated: EarthquakeEvent[] = [];

    allEvents.forEach((event) => {
      const key = `${Math.round(event.latitude * 100)}-${Math.round(event.longitude * 100)}-${Math.round(event.magnitude * 10)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(event);
      }
    });

    const aggregatedData = aggregateByDate(deduplicated);

    return NextResponse.json({
      success: true,
      data: aggregatedData,
      count: aggregatedData.length,
      lastUpdated: new Date().toISOString(),
      sources: ['usgs', 'riseq'],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch earthquake data' }, { status: 500 });
  }
}
