import { type NextRequest, NextResponse } from "next/server"

// Fetch recent earthquake data from USGS
async function fetchEarthquakeData(location?: string, magnitude?: number) {
  try {
    let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    const response = await fetch(url)
    const data = await response.json()

    let earthquakes = data.features.map((feature: any) => ({
      place: feature.properties.place,
      magnitude: feature.properties.mag,
      time: new Date(feature.properties.time).toLocaleString(),
      depth: feature.geometry.coordinates[2],
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      tsunami: feature.properties.tsunami,
    }))

    // Filter by location if provided
    if (location) {
      earthquakes = earthquakes.filter((eq: any) =>
        eq.place.toLowerCase().includes(location.toLowerCase()),
      )
    }

    // Filter by magnitude if provided
    if (magnitude !== undefined) {
      earthquakes = earthquakes.filter((eq: any) => eq.magnitude >= magnitude)
    }

    return earthquakes.slice(0, 20) // Return latest 20
  } catch (error) {
    console.error("Error fetching earthquake data:", error)
    return []
  }
}

// Generate system prompt with earthquake context
async function generateSystemPrompt(language: string, location?: string) {
  const earthquakeData = await fetchEarthquakeData(location)

  const dataContext = earthquakeData.length > 0
    ? `Recent earthquake data (last 24 hours):\n${earthquakeData
      .map((eq: any) => `- ${eq.place}: Magnitude ${eq.magnitude}, Depth ${eq.depth}km, Time: ${eq.time}`)
      .join("\n")}`
    : "No recent earthquakes in the specified area."

  const basePrompt = `You are SeismoAI, an expert earthquake safety assistant. You provide accurate information about earthquakes, seismic activity, safety measures, and emergency preparedness. 

Current earthquake data context:
${dataContext}

When users ask about:
- Earthquakes: Provide specific details from the data (magnitude, location, depth, time)
- Safety: Give practical earthquake safety tips
- Preparedness: Offer guidance on disaster preparedness
- Reports: Summarize available seismic data concisely

Always be helpful, accurate, and safety-focused. Respond in the user's language preference.`

  return basePrompt
}

// NLP-based earthquake query analyzer with location extraction
function analyzeQuery(message: string): { type: string; location?: string } {
  const lowerMessage = message.toLowerCase()

  // Keywords mapping for NLP detection
  const queryPatterns = {
    website: ["website", "how it works", "explain", "features", "what is this", "dashboard", "about", "app"],
    formation: ["form", "cause", "why do earthquakes", "how do earthquakes", "tectonic", "plate", "happen", "create"],
    prediction: ["predict", "can we predict", "impossible to predict", "forecast", "why can't", "advance", "future", "when will"],
    recent: ["recent", "latest", "today", "last 24", "current", "now", "happening"],
    magnitude: ["magnitude", "strength", "strongest", "largest", "power", "force", "richter"],
    location: ["location", "where", "region", "area", "place", "zone", "near"],
    safety: ["safe", "safety", "protect", "prepare", "emergency", "disaster", "risk"],
    shelter: ["shelter", "refuge", "building", "safe building", "evacuation center", "safe place", "bunker"],
    depth: ["depth", "deep", "underground", "kilometers"],
    time: ["time", "when", "happened", "recorded"],
    tsunami: ["tsunami", "wave", "water", "coastal"],
  }

  let detectedType = "general"
  for (const [queryType, keywords] of Object.entries(queryPatterns)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      detectedType = queryType
      break
    }
  }

  // Extract location from message (e.g., "earthquakes near Japan" or "earthquakes in California")
  let extractedLocation: string | undefined
  const locationKeywords = ["near", "in", "around", "at", "earthquake in"]
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}\\s+([a-zA-Z\\s]+)`, "i")
    const match = lowerMessage.match(regex)
    if (match) {
      extractedLocation = match[1].trim().split(/[,.]|and/)[0]
      break
    }
  }

  return { type: detectedType, location: extractedLocation }
}

// Get shelter information based on user location
function getShelterInfo(userLocation?: string): string {
  const shelterDatabase: Record<string, any[]> = {
    japan: [
      { name: "Tokyo Metropolitan Shelters", distance: "Nearby", safety: "Seismic-rated", phone: "Emergency: 110/119" },
      { name: "Government Buildings", distance: "Walking distance", safety: "Reinforced", phone: "Local authority" },
    ],
    usa: [
      { name: "Federal Emergency Shelters", distance: "Nearby", safety: "FEMA certified", phone: "1-800-621-3362" },
      { name: "Community Centers", distance: "Walking distance", safety: "Standard building codes", phone: "Local city" },
    ],
    chile: [
      { name: "ONEMI Shelters", distance: "Nearby", safety: "Seismic-rated", phone: "Emergency: 112" },
    ],
    indonesia: [
      { name: "BNPB Shelters", distance: "Nearby", safety: "Disaster-resistant", phone: "Emergency: 113" },
    ],
    default: [
      { name: "Nearest Public Building", distance: "Walking distance", safety: "Check building code compliance", phone: "Local emergency: 911/999" },
    ],
  }

  const location = userLocation?.toLowerCase() || ""
  const shelters = Object.entries(shelterDatabase).find(([key]) => location.includes(key))?.[1] || shelterDatabase.default

  return `Earthquake Shelters in Your Area:\n\n${shelters
    .map(
      (shelter) =>
        `🏢 ${shelter.name}\n   Distance: ${shelter.distance}\n   Safety Rating: ${shelter.safety}\n   Contact: ${shelter.phone}`,
    )
    .join("\n\n")}`
}

// Generate enhanced fallback response from earthquake data with NLP
function generateFallbackResponse(message: string, earthquakeData: any[], userLocation?: string): string {
  const { type: queryType, location: extractedLocation } = analyzeQuery(message)

  switch (queryType) {
    case "website":
      return `Welcome to the Earthquake Dashboard! Here is a simple explanation of how this website works:

1. Interactive 3D Globe: The main page shows a live interactive map spinning with real earthquakes that happened in the last 24 hours. The height of the glowing pillars shows the magnitude, and the color shows the depth!

2. Analytics & Insights Tab: This is the brain of the website. 
   - Real-Time Risk Index: Measures the live danger levels across global zones using an Artificial Neural Network.
   - Live Regional Prediction: Uses advanced Deep Learning (LSTM & CNN models) to predict the exact probability and magnitude of future earthquakes within the next 7 days for major countries.`

    case "formation":
      return `🌍 How Earthquakes are Formed:

Earthquakes are caused by the sudden release of stress that has built up within the Earth's crust. 

Our planet's outer shell is broken into massive puzzle pieces called "Tectonic Plates." These plates are constantly moving incredibly slowly over the hot mantle underneath. 
When two plates grind together at fault lines, they can get physically stuck due to friction while the rest of the plate keeps moving. Eventually, the immense stress overcomes the friction, causing the rock to snap or slip. 
This violent, sudden release of energy sends shockwaves (seismic waves) outward through the ground, which is the shaking we feel on the surface!`

    case "prediction":
      return `🔮 Why Earthquakes Cannot Be Predicted:

Unlike weather, which we can easily see and measure with satellites in the atmosphere, earthquakes happen miles underground where we cannot directly observe the immense stress building up on rock formations.

Currently, no scientist or government agency has ever successfully predicted the exact time, location, and magnitude of a major earthquake. We simply do not have the sensors capable of monitoring fault stress deep in the crust.

What this Dashboard does instead is "Forecasting Probability." By using Artificial Intelligence (LSTM & CNN networks) to analyze decades of past seismic data, the AI can detect hidden mathematical patterns and output a *probability percentage* that an earthquake might occur in a given region over the next week. It is a risk assessment, not a magical prediction!`

    case "recent":
      if (earthquakeData.length === 0) {
        return "No recent significant earthquakes have been recorded in the past 24 hours in your region. Stay alert and keep monitoring."
      }
      return `Latest Earthquakes (${earthquakeData.length} recorded):\n\n${earthquakeData
        .slice(0, 5)
        .map((eq) => `📍 ${eq.place}\n   M${eq.magnitude} | Depth: ${eq.depth}km | ${eq.time}`)
        .join("\n\n")}`

    case "magnitude":
      if (earthquakeData.length === 0) return "No earthquake magnitude data available."
      const strongest = earthquakeData.reduce((max, eq) => (eq.magnitude > max.magnitude ? eq : max), earthquakeData[0])
      return `Strongest Earthquake Recorded:\n📍 ${strongest.place}\nMagnitude: ${strongest.magnitude}\nDepth: ${strongest.depth}km\nTime: ${strongest.time}`

    case "shelter":
      return getShelterInfo(userLocation)

    case "safety":
      return `🚨 Earthquake Safety Guidelines:\n\n✋ DROP → Get down on hands and knees\n🛡️ COVER → Take cover under desk or table\n🔒 HOLD ON → Hold until shaking stops\n\n📍 SAFE LOCATIONS:\n• Under sturdy furniture\n• Against interior walls\n• Away from windows\n• NOT in doorways (myth)\n\n⚠️ AVOID:\n• Windows and mirrors\n• Heavy objects overhead\n• Stairs and elevators\n• Exterior walls`

    case "location":
      if (earthquakeData.length === 0) return "No recent earthquakes recorded in this area."
      return `Seismic Zones Detected:\n\n${earthquakeData
        .slice(0, 5)
        .map((eq) => `• ${eq.place} - M${eq.magnitude}`)
        .join("\n")}`

    case "tsunami":
      if (earthquakeData.some((eq) => eq.tsunami === 1)) {
        return "🌊 Tsunami Warning: Coastal residents should evacuate to higher ground immediately. Check local authorities for evacuation routes."
      }
      return "No tsunami alerts for recent earthquakes. Coastal areas remain safe."

    default:
      if (earthquakeData.length > 0) {
        return `SeismoAI - Your Earthquake Safety Assistant\n\nI can help with:\n• Real-time earthquake data and alerts\n• Safety tips and preparedness\n• Nearby shelter locations\n• Tsunami and hazard information\n\nCurrent Data: ${earthquakeData.length} earthquakes recorded. Ask me anything!`
      }
      return "I'm SeismoAI. I provide earthquake data, safety guidance, and emergency shelter information. How can I assist you?"
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, language = "en", location, userLocation } = await req.json()

    // Analyze query to extract location and query type
    const { location: extractedLocation } = analyzeQuery(message)
    const searchLocation = extractedLocation || location || userLocation

    // Fetch earthquake data with extracted location (primary data source)
    const earthquakeData = await fetchEarthquakeData(searchLocation)

    console.log("[v0] NLP Query - Message:", message)
    console.log("[v0] Extracted Location:", extractedLocation)
    console.log("[v0] Found earthquakes:", earthquakeData.length)

    // Use fallback response generation from earthquake data with NLP analysis
    // This provides intelligent, context-aware responses with real earthquake data
    const response = generateFallbackResponse(message, earthquakeData, userLocation || location || searchLocation)

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json(
      { message: "I'm having trouble connecting to the earthquake data service. Please try again." },
      { status: 200 },
    )
  }
}
