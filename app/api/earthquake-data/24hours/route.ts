import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes for fresh 24-hour data

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
 * Fetch real-time earthquake data from USGS API for last 24 hours
 */
async function fetchLast24HoursFromUSGS(): Promise<EarthquakeEvent[]> {
  try {
    // USGS endpoint for earthquakes in the past day
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Earthquake-Dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];

    // Parse features into earthquake events
    const events: EarthquakeEvent[] = features.map((feature: any) => {
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
    });

    // Filter for events in the last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return events.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= twentyFourHoursAgo && eventDate <= now;
    });
  } catch (error) {
    console.error('[v0] Error fetching USGS 24-hour data:', error);
    return [];
  }
}

import * as cheerio from 'cheerio';

/**
 * Fetch earthquake data from RISEQ (Regional Seismic Network of India)
 */
async function fetchLast24HoursFromRISEQ(): Promise<EarthquakeEvent[]> {
  try {
    const url = 'https://riseq.seismo.gov.in/riseq/earthquake';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!response.ok) {
      throw new Error(`RISEQ fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const events: EarthquakeEvent[] = [];

    $('li.event_list').each((_, el) => {
      try {
        const jsonStr = $(el).attr('data-json');
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          // Coordinates format "26.522, 96.467"
          const coords = data.lat_long ? data.lat_long.split(',').map((s: string) => parseFloat(s.trim())) : [0, 0];
          
          // Mag Format: "M: 3.6 , D: 80km"
          let mag = 0;
          let depth = 0;
          if (data.magnitude_depth) {
             const mMatch = data.magnitude_depth.match(/M:\s*([\d.]+)/);
             if (mMatch) mag = parseFloat(mMatch[1]);
             const dMatch = data.magnitude_depth.match(/D:\s*([\d.]+)km/);
             if (dMatch) depth = parseFloat(dMatch[1]);
          }

          // Parse origin time to UTC timestamp "2026-04-06 08:35:32 IST"
          let timeVal = new Date().toISOString();
          let timeUTC = new Date().toUTCString();
          if (data.origin_time) {
             const cleanDateStr = data.origin_time.replace(' IST', '').replace(/-/g, '/');
             // IST is GMT+5:30. Let's just create a basic JS Date as an approximation since Date.parse might struggle with IST.
             // Subtract 5.5 hours to get UTC
             const localMillis = new Date(cleanDateStr).getTime();
             const utcMillis = localMillis - (5.5 * 60 * 60 * 1000);
             timeVal = new Date(utcMillis).toISOString();
             timeUTC = new Date(utcMillis).toUTCString();
          }

          let place = data.event_name ? data.event_name.replace(/M:\s*[\d.]+\s*-\s*/, '') : 'Unknown Region (India)';

          events.push({
            timestamp: timeVal,
            timeUTC: timeUTC,
            location: place,
            magnitude: mag,
            depth: depth,
            latitude: coords[0] || 0,
            longitude: coords[1] || 0,
            source: 'riseq',
          });
        }
      } catch (err) {
        // Skip errors in individual row parsing
      }
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Reverse events and filter within 24h
    return events.filter(e => {
        const d = new Date(e.timestamp);
        return d >= twentyFourHoursAgo && d <= now;
    });
  } catch (error) {
    console.error('[v0] Error fetching RISEQ data:', error);
    return [];
  }
}

/**
 * Sort events by time descending (most recent first)
 */
function sortByTimeDescending(events: EarthquakeEvent[]): EarthquakeEvent[] {
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get statistics for the 24-hour period
 */
function calculateStatistics(events: EarthquakeEvent[]) {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      maxMagnitude: 0,
      avgMagnitude: 0,
      avgDepth: 0,
      mostActiveLocation: 'N/A',
      sourceBreakdown: { usgs: 0, riseq: 0 },
    };
  }

  const magnitudes = events.map((e) => e.magnitude);
  const depths = events.map((e) => e.depth);

  // Find most active location
  const locationCounts: { [key: string]: number } = {};
  events.forEach((event) => {
    locationCounts[event.location] = (locationCounts[event.location] || 0) + 1;
  });
  const mostActiveLocation = Object.entries(locationCounts).sort(([, a], [, b]) => b - a)[0][0];

  // Count by source
  const sourceBreakdown = {
    usgs: events.filter(e => e.source === 'usgs').length,
    riseq: events.filter(e => e.source === 'riseq').length,
  };

  return {
    totalEvents: events.length,
    maxMagnitude: Math.max(...magnitudes),
    avgMagnitude: magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length,
    avgDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
    mostActiveLocation,
    sourceBreakdown,
  };
}

export async function GET(request: Request) {
  try {
    // Fetch from both sources in parallel
    const [usgsEvents, riseqEvents] = await Promise.all([
      fetchLast24HoursFromUSGS(),
      fetchLast24HoursFromRISEQ(),
    ]);

    // Merge and deduplicate
    const allEvents = [...usgsEvents, ...riseqEvents];

    // Remove duplicates based on similar coordinates and magnitude (within 0.1 degrees and 0.1 magnitude)
    const seen = new Set<string>();
    const deduplicated: EarthquakeEvent[] = [];

    allEvents.forEach((event) => {
      const key = `${Math.round(event.latitude * 100)}-${Math.round(event.longitude * 100)}-${Math.round(event.magnitude * 10)}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(event);
      }
    });

    const sortedEvents = sortByTimeDescending(deduplicated);
    const stats = calculateStatistics(sortedEvents);

    return NextResponse.json(
      {
        success: true,
        data: sortedEvents,
        statistics: stats,
        count: sortedEvents.length,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch 24-hour earthquake data',
      },
      { status: 500 }
    );
  }
}
