import { NextResponse } from 'next/server';

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
    // Fetch earthquakes from the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const url = new URL('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson');

    const response = await fetch(url.toString(), {
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

    // Filter for events in 2026
    const now = new Date();
    const year2026Start = new Date('2026-01-01');
    const year2026End = new Date('2026-12-31T23:59:59Z');

    return events.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= year2026Start && eventDate <= year2026End;
    });
  } catch (error) {
    console.error('[v0] Error fetching USGS data:', error);
    return [];
  }
}

/**
 * Fetch earthquake data from RISEQ (Regional Seismic Network of India)
 */
async function fetchRISEQEarthquakeData(): Promise<EarthquakeEvent[]> {
  try {
    const response = await fetch('https://riseq.seismo.gov.in/riseq/earthquake', {
      headers: {
        'User-Agent': 'Earthquake-Dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`RISEQ API error: ${response.status}`);
    }

    const data = await response.json();
    let events: EarthquakeEvent[] = [];

    // Parse RISEQ data format - supports multiple formats
    if (Array.isArray(data)) {
      events = data.map((item: any) => ({
        timestamp: item.origintime ? new Date(item.origintime).toISOString() : new Date().toISOString(),
        timeUTC: item.origintime ? new Date(item.origintime).toUTCString() : new Date().toUTCString(),
        location: item.location || item.place || item.region || 'Unknown Location',
        magnitude: item.magnitude || item.mag || 0,
        depth: item.depth || 0,
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lon || item.lng || 0,
        source: 'riseq' as const,
      }));
    } else if (data.features && Array.isArray(data.features)) {
      events = data.features.map((feature: any) => {
        const coords = feature.geometry?.coordinates || [0, 0, 0];
        const props = feature.properties || {};
        return {
          timestamp: props.origintime ? new Date(props.origintime).toISOString() : new Date().toISOString(),
          timeUTC: props.origintime ? new Date(props.origintime).toUTCString() : new Date().toUTCString(),
          location: props.location || props.place || props.region || 'Unknown Location',
          magnitude: props.magnitude || props.mag || 0,
          depth: coords[2] || props.depth || 0,
          latitude: coords[1] || 0,
          longitude: coords[0] || 0,
          source: 'riseq' as const,
        };
      });
    } else if (data.data && Array.isArray(data.data)) {
      events = data.data.map((item: any) => ({
        timestamp: item.origintime ? new Date(item.origintime).toISOString() : new Date().toISOString(),
        timeUTC: item.origintime ? new Date(item.origintime).toUTCString() : new Date().toUTCString(),
        location: item.location || item.place || item.region || 'Unknown Location',
        magnitude: item.magnitude || item.mag || 0,
        depth: item.depth || 0,
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lon || item.lng || 0,
        source: 'riseq' as const,
      }));
    }

    // Filter for events in 2026
    const year2026Start = new Date('2026-01-01');
    const year2026End = new Date('2026-12-31T23:59:59Z');

    return events.filter((event) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= year2026Start && eventDate <= year2026End;
    });
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
    .map((item: any) => ({
      ...item,
      sources: Array.from(item.sources),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET(request: Request) {
  try {
    // Fetch from both sources in parallel
    const [usgsEvents, riseqEvents] = await Promise.all([
      fetchUSGSEarthquakeData(),
      fetchRISEQEarthquakeData(),
    ]);

    // Merge and deduplicate
    const allEvents = [...usgsEvents, ...riseqEvents];
    
    // Remove duplicates based on similar coordinates and magnitude
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

    return NextResponse.json(
      {
        success: true,
        data: aggregatedData,
        count: aggregatedData.length,
        lastUpdated: new Date().toISOString(),
        sources: ['usgs', 'riseq'],
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch earthquake data',
      },
      { status: 500 }
    );
  }
}
