import { type NextRequest, NextResponse } from "next/server"
import { generateEarthquakeExcel, parseUSGSEarthquakeData, aggregateEarthquakesByDate, getLast24HoursEvents } from "@/lib/excel-generator"

/**
 * Fetch historical earthquake data from USGS
 */
async function fetchHistoricalData() {
  try {
    const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
    const response = await fetch(url)
    const data = await response.json()
    return data.features || []
  } catch (error) {
    console.error("[v0] Error fetching historical data:", error)
    return []
  }
}

/**
 * Fetch 2026 year-to-date earthquake data
 */
async function fetch2026Data() {
  try {
    const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
    const response = await fetch(url)
    const data = await response.json()
    const features = data.features || []
    
    // Parse and filter for 2026
    const events = parseUSGSEarthquakeData(features)
    const year2026Start = new Date("2026-01-01")
    const year2026End = new Date("2026-12-31T23:59:59Z")
    
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= year2026Start && eventDate <= year2026End
    })
    
    return aggregateEarthquakesByDate(filteredEvents, { start: year2026Start, end: year2026End })
  } catch (error) {
    console.error("[v0] Error fetching 2026 data:", error)
    return []
  }
}

/**
 * Fetch 24-hour earthquake data
 */
async function fetch24HourData() {
  try {
    const url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    const response = await fetch(url)
    const data = await response.json()
    const features = data.features || []
    
    const events = parseUSGSEarthquakeData(features)
    return getLast24HoursEvents(events)
  } catch (error) {
    console.error("[v0] Error fetching 24-hour data:", error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    // Fetch all data in parallel
    const [historicalFeatures, year2026Data, last24HourData] = await Promise.all([
      fetchHistoricalData(),
      fetch2026Data(),
      fetch24HourData(),
    ])

    // Parse historical data
    const historicalEvents = parseUSGSEarthquakeData(historicalFeatures)
    const historicalData = historicalEvents.map((event) => ({
      date: event.timestamp.split("T")[0],
      location: event.location,
      magnitude: event.magnitude,
      depth: event.depth,
      latitude: event.latitude,
      longitude: event.longitude,
      eventCount: 1,
    }))

    // Generate Excel file with all three sheets
    const excelBuffer = await generateEarthquakeExcel(
      historicalData,
      year2026Data,
      last24HourData
    )

    const filename = `earthquake_report_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating Excel report:", error)
    return NextResponse.json(
      { error: "Failed to generate Excel report", details: String(error) },
      { status: 500 }
    )
  }
}
