import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Poll every 60s as requested

// Simple in-memory cache
let memoryCache: { data: any, timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 mins

export async function GET() {
  try {
    const now = Date.now();
    
    // Check Cache
    if (memoryCache && (now - memoryCache.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json(memoryCache.data, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const response = await fetch('https://riseq.seismo.gov.in/riseq/earthquake', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      next: { revalidate: 0 } 
    });

    if (!response.ok) throw new Error(`RISEQ HTTP error: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const features: any[] = [];

    $('li.event_list').each((_, el) => {
      try {
        const jsonStr = $(el).attr('data-json');
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          
          const coords = data.lat_long ? data.lat_long.split(',').map((s: string) => parseFloat(s.trim())) : [0, 0];
          const lat = coords[0] || 0;
          const lon = coords[1] || 0;
          
          let mag = 0; let depth = 0;
          if (data.magnitude_depth) {
             const mMatch = data.magnitude_depth.match(/M:\s*([\d.]+)/);
             if (mMatch) mag = parseFloat(mMatch[1]);
             const dMatch = data.magnitude_depth.match(/D:\s*([\d.]+)km/);
             if (dMatch) depth = parseFloat(dMatch[1]);
          }

          let timeMillis = now;
          if (data.origin_time) {
             const cleanDateStr = data.origin_time.replace(' IST', '').replace(/-/g, '/');
             const localMillis = new Date(cleanDateStr).getTime();
             if (!isNaN(localMillis)) {
                // IST is UTC+5:30 -> subtract 5.5h
                timeMillis = localMillis - (5.5 * 60 * 60 * 1000);
             }
          }

          const place = data.event_name ? data.event_name.replace(/M:\s*[\d.]+\s*-\s*/, '') : 'Unknown Indian Region';
          
          // Generate unique ID: SHA1 hash of (date + lat + lon)
          const hashString = `${timeMillis}-${lat}-${lon}`;
          const id = 'imd_' + crypto.createHash('sha1').update(hashString).digest('hex').substring(0, 16);

          features.push({
            type: "Feature",
            properties: {
              mag: mag,
              place: place,
              time: timeMillis,
              updated: timeMillis,
              depth: depth,
              magType: "ML",
              net: "IMD",
              source: "india_imd"
            },
            geometry: {
              type: "Point",
              coordinates: [lon, lat, -Math.abs(depth)]
            },
            id: id
          });
        }
      } catch (err) {
        // Skip malformed rows
      }
    });

    const geoJson = {
      type: "FeatureCollection",
      metadata: {
        generated: now,
        source: "india_imd",
        count: features.length,
        stale: false
      },
      features: features
    };

    // Update Cache
    memoryCache = { data: geoJson, timestamp: now };

    return NextResponse.json(geoJson, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    // If scraping fails, return stale cache if available
    console.error("[India Scraper] Execution Failed:", error);
    if (memoryCache) {
      const staleData = {
        ...memoryCache.data,
        metadata: {
          ...memoryCache.data.metadata,
          stale: true,
          stale_since: new Date(memoryCache.timestamp).toISOString()
        }
      };
      return NextResponse.json(staleData, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return NextResponse.json({
        type: "FeatureCollection",
        metadata: { generated: Date.now(), source: "india_imd", count: 0, stale: true, error: (error as Error).message },
        features: []
    }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
