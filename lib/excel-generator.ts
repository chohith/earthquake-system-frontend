import ExcelJS from 'exceljs';

export interface HistoricalEarthquakeData {
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  eventCount?: number;
}

export interface EarthquakeEvent {
  timestamp: string;
  location: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  timeUTC: string;
}

export interface Year2026Data {
  date: string;
  location: string;
  magnitude: number;
  depth: number;
  lastUpdated: string;
  eventCount: number;
}

/**
 * Generate multi-sheet Excel workbook with earthquake data
 * Sheet 1: Historical data
 * Sheet 2: 2026 year-to-date live data
 * Sheet 3: Last 24 hours data
 */
export async function generateEarthquakeExcel(
  historicalData: HistoricalEarthquakeData[],
  year2026Data: Year2026Data[],
  last24HoursData: EarthquakeEvent[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Historical Data
  const historicalSheet = workbook.addWorksheet('Historical Data', {
    properties: { tabColor: { argb: 'FF1F4E78' } },
  });

  historicalSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Magnitude', key: 'magnitude', width: 12 },
    { header: 'Depth (km)', key: 'depth', width: 12 },
    { header: 'Latitude', key: 'latitude', width: 12 },
    { header: 'Longitude', key: 'longitude', width: 12 },
    { header: 'Event Count', key: 'eventCount', width: 12 },
  ];

  // Style header row
  historicalSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  historicalSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' },
  };

  historicalData.forEach((row) => {
    historicalSheet.addRow({
      date: row.date,
      location: row.location,
      magnitude: row.magnitude,
      depth: row.depth,
      latitude: row.latitude,
      longitude: row.longitude,
      eventCount: row.eventCount || 1,
    });
  });

  // Add alternating row colors for historical data
  for (let i = 2; i <= historicalSheet.rowCount; i++) {
    if (i % 2 === 0) {
      historicalSheet.getRow(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }
  }

  // Sheet 2: 2026 Live Data (Jan-Dec)
  const year2026Sheet = workbook.addWorksheet('2026 Live Data', {
    properties: { tabColor: { argb: 'FF70AD47' } },
  });

  year2026Sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Magnitude', key: 'magnitude', width: 12 },
    { header: 'Depth (km)', key: 'depth', width: 12 },
    { header: 'Last Updated (UTC)', key: 'lastUpdated', width: 20 },
    { header: 'Event Count', key: 'eventCount', width: 12 },
  ];

  // Style header row
  year2026Sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  year2026Sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' },
  };

  year2026Data.forEach((row) => {
    year2026Sheet.addRow({
      date: row.date,
      location: row.location,
      magnitude: row.magnitude,
      depth: row.depth,
      lastUpdated: row.lastUpdated,
      eventCount: row.eventCount,
    });
  });

  // Add alternating row colors for 2026 data
  for (let i = 2; i <= year2026Sheet.rowCount; i++) {
    if (i % 2 === 0) {
      year2026Sheet.getRow(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }
  }

  // Sheet 3: Last 24 Hours Data
  const last24HoursSheet = workbook.addWorksheet('Last 24 Hours', {
    properties: { tabColor: { argb: 'FFFF6B35' } },
  });

  last24HoursSheet.columns = [
    { header: 'Time (UTC)', key: 'timeUTC', width: 20 },
    { header: 'Location', key: 'location', width: 25 },
    { header: 'Magnitude', key: 'magnitude', width: 12 },
    { header: 'Depth (km)', key: 'depth', width: 12 },
    { header: 'Latitude', key: 'latitude', width: 12 },
    { header: 'Longitude', key: 'longitude', width: 12 },
  ];

  // Style header row
  last24HoursSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  last24HoursSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF6B35' },
  };

  last24HoursData.forEach((row) => {
    last24HoursSheet.addRow({
      timeUTC: row.timeUTC,
      location: row.location,
      magnitude: row.magnitude,
      depth: row.depth,
      latitude: row.latitude,
      longitude: row.longitude,
    });
  });

  // Add alternating row colors for 24-hour data
  for (let i = 2; i <= last24HoursSheet.rowCount; i++) {
    if (i % 2 === 0) {
      last24HoursSheet.getRow(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }
  }

  // Add summary metadata to all sheets
  const addedDate = new Date().toISOString();
  const metadata = `Generated: ${addedDate}`;
  
  [historicalSheet, year2026Sheet, last24HoursSheet].forEach((sheet) => {
    const lastRow = sheet.lastRow.number + 2;
    sheet.getCell(`A${lastRow}`).value = metadata;
    sheet.getCell(`A${lastRow}`).font = { italic: true, size: 9, color: { argb: 'FF808080' } };
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}

/**
 * Parse earthquake data from USGS API response
 */
export function parseUSGSEarthquakeData(features: any[]): EarthquakeEvent[] {
  return features.map((feature) => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates;

    return {
      timestamp: new Date(props.time).toISOString(),
      timeUTC: new Date(props.time).toUTCString(),
      location: props.place || 'Unknown Location',
      magnitude: props.mag || 0,
      depth: coords[2] || 0, // depth is the 3rd coordinate in USGS data
      latitude: coords[1] || 0,
      longitude: coords[0] || 0,
    };
  });
}

/**
 * Aggregate earthquake events by date for 2026 data
 */
export function aggregateEarthquakesByDate(
  events: EarthquakeEvent[],
  dateRange: { start: Date; end: Date }
): Year2026Data[] {
  const aggregated: { [key: string]: Year2026Data } = {};

  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);

    // Only include events within the date range
    if (eventDate >= dateRange.start && eventDate <= dateRange.end) {
      const dateKey = eventDate.toISOString().split('T')[0];

      if (!aggregated[dateKey]) {
        aggregated[dateKey] = {
          date: dateKey,
          location: event.location,
          magnitude: event.magnitude,
          depth: event.depth,
          lastUpdated: new Date().toISOString(),
          eventCount: 1,
        };
      } else {
        aggregated[dateKey].eventCount++;
        // Use highest magnitude for that day
        if (event.magnitude > aggregated[dateKey].magnitude) {
          aggregated[dateKey].magnitude = event.magnitude;
          aggregated[dateKey].location = event.location;
        }
      }
    }
  });

  return Object.values(aggregated).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Filter events from the last 24 hours
 */
export function getLast24HoursEvents(events: EarthquakeEvent[]): EarthquakeEvent[] {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return events.filter((event) => {
    const eventTime = new Date(event.timestamp);
    return eventTime >= twentyFourHoursAgo && eventTime <= now;
  });
}
