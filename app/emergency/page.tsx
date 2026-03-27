"use client"

import { GlobalNavigation } from "@/components/global-navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Phone, MapPin, BookOpen, CheckCircle2, Circle, ShieldAlert, Backpack, Compass, HeartPulse } from "lucide-react"
import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

const COUNTRY_EMERGENCY_DATA: Record<string, any> = {
  JP: {
    name: "Japan",
    emergencyNumber: "110 (Police) / 119 (Ambulance)",
    earthquakeHotline: "03-3211-0011",
    shelters: [
      { name: "Tokyo Metropolitan Building", lat: 35.6895, lng: 139.7671 },
      { name: "Yoyogi Park Shelter", lat: 35.6734, lng: 139.7003 },
      { name: "Odaiba Disaster Prevention Center", lat: 35.6294, lng: 139.7558 },
    ],
  },
  TR: {
    name: "Turkey",
    emergencyNumber: "112",
    earthquakeHotline: "0212-567-1234",
    shelters: [
      { name: "Istanbul Convention Center", lat: 41.077, lng: 29.0066 },
      { name: "Ümraniye Emergency Shelter", lat: 41.0275, lng: 29.1181 },
    ],
  },
  IN: {
    name: "India",
    emergencyNumber: "112 / 100",
    earthquakeHotline: "1077",
    shelters: [
      { name: "New Delhi Convention Center", lat: 28.5355, lng: 77.249 },
      { name: "Mumbai Emergency Relief Center", lat: 19.076, lng: 72.8777 },
      { name: "Ahmedabad Relief Shelter", lat: 23.0225, lng: 72.5714 },
    ],
  },
  US: {
    name: "United States",
    emergencyNumber: "911",
    earthquakeHotline: "1-800-USGS-ASK",
    shelters: [
      { name: "San Francisco Convention Center", lat: 37.7841, lng: -122.395 },
      { name: "Los Angeles Convention Center", lat: 34.4194, lng: -118.268 },
    ],
  },
  MX: {
    name: "Mexico",
    emergencyNumber: "911",
    earthquakeHotline: "5555-1435",
    shelters: [
      { name: "Mexico City Metropolitan Center", lat: 19.4343, lng: -99.1332 },
      { name: "Guadalajara Emergency Center", lat: 20.6637, lng: -103.276 },
    ],
  },
  CL: {
    name: "Chile",
    emergencyNumber: "911 / 133",
    earthquakeHotline: "1410",
    shelters: [
      { name: "Santiago Emergency Center", lat: -33.4489, lng: -70.6693 },
      { name: "Valparaíso Relief Center", lat: -33.0458, lng: -71.6196 },
    ],
  },
}

const EMERGENCY_KIT_ITEMS = [
  { id: "water", label: "Water (1 gallon/person/day) for 3 days", icon: <Compass className="w-4 h-4 text-blue-400" /> },
  { id: "food", label: "Non-perishable food for 3 days", icon: <Backpack className="w-4 h-4 text-orange-400" /> },
  { id: "radio", label: "Battery-powered or hand-crank radio", icon: <ShieldAlert className="w-4 h-4 text-yellow-400" /> },
  { id: "light", label: "Flashlight & extra batteries", icon: <ShieldAlert className="w-4 h-4 text-yellow-400" /> },
  { id: "medkit", label: "First aid kit & guide", icon: <HeartPulse className="w-4 h-4 text-red-400" /> },
  { id: "whistle", label: "Whistle to signal for help", icon: <ShieldAlert className="w-4 h-4 text-yellow-400" /> },
  { id: "dust", label: "Dust mask for contaminated air", icon: <HeartPulse className="w-4 h-4 text-red-400" /> },
  { id: "tools", label: "Wrench or pliers to turn off utilities", icon: <ShieldAlert className="w-4 h-4 text-yellow-400" /> },
  { id: "docs", label: "Important family documents in waterproof container", icon: <Compass className="w-4 h-4 text-blue-400" /> },
]

export default function EmergencyPage() {
  const [selectedCountry, setSelectedCountry] = useState("US")
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const countryData = COUNTRY_EMERGENCY_DATA[selectedCountry]

  // Load checklist from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("earthquake-kit")
    if (saved) setChecklist(JSON.parse(saved))
  }, [])

  const toggleItem = (id: string) => {
    const newChecklist = { ...checklist, [id]: !checklist[id] }
    setChecklist(newChecklist)
    localStorage.setItem("earthquake-kit", JSON.stringify(newChecklist))
  }

  const progressPercent = Math.round((Object.values(checklist).filter(Boolean).length / EMERGENCY_KIT_ITEMS.length) * 100) || 0;

  return (
    <main className="min-h-screen bg-slate-950">
      <GlobalNavigation />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Hero Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            {/* Subtle glow effect behind header */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="space-y-3 z-10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
                <h1 className="text-3xl font-bold tracking-tight text-white">Emergency & Preparedness</h1>
              </div>
              <p className="text-slate-400 max-w-xl text-lg">
                Your survival depends on preparation. Access official safety guidance, local automated emergency contacts, and track your disaster readiness.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT COLUMN: 8 columns wide on standard desktop */}
            <div className="lg:col-span-8 space-y-6">

              {/* Safety TABS Section */}
              <Card className="bg-slate-900/60 border-slate-800 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  Official Safety Guidelines
                </h3>

                <Tabs defaultValue="during" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                    <TabsTrigger value="before" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-300">Before Shaking</TabsTrigger>
                    <TabsTrigger value="during" className="data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400 font-bold tracking-widest">DURING SHAKING</TabsTrigger>
                    <TabsTrigger value="after" className="data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400">Aftermath</TabsTrigger>
                  </TabsList>

                  <TabsContent value="before" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                        <h4 className="font-semibold text-white flex gap-2 items-center"><span className="text-cyan-400 font-black">01</span> Secure Furniture</h4>
                        <p className="text-slate-400 text-sm mt-2">Anchor bookcases, shelving units, and heavy appliances to walls using L-brackets and wall studs.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                        <h4 className="font-semibold text-white flex gap-2 items-center"><span className="text-cyan-400 font-black">02</span> Know Safe Spots</h4>
                        <p className="text-slate-400 text-sm mt-2">Identify sturdy tables and against interior walls in your home, workplace, and school. Stay away from glass.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                        <h4 className="font-semibold text-white flex gap-2 items-center"><span className="text-cyan-400 font-black">03</span> Prepare Emergency Kit</h4>
                        <p className="text-slate-400 text-sm mt-2">Use the interactive tracker on this page to build out a functional 72-hour survival kit.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                        <h4 className="font-semibold text-white flex gap-2 items-center"><span className="text-cyan-400 font-black">04</span> Practice Drills</h4>
                        <p className="text-slate-400 text-sm mt-2">Conduct monthly earthquake drills with family members. Muscle memory saves lives in a panic.</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="during" className="space-y-4 mt-6">
                    <div className="bg-red-950/20 p-6 rounded-2xl border border-red-900/50 text-center space-y-6">
                      <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                        <div className="flex-1 bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                          <h4 className="text-2xl font-black text-white tracking-widest mb-2">DROP</h4>
                          <p className="text-red-200 text-sm">Immediately get down on your hands and knees. This protects you from being knocked down.</p>
                        </div>
                        <div className="flex-1 bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                          <h4 className="text-2xl font-black text-white tracking-widest mb-2">COVER</h4>
                          <p className="text-red-200 text-sm">Cover your head and neck under a sturdy desk or table. Protect your core from falling debris.</p>
                        </div>
                        <div className="flex-1 bg-red-900/20 p-4 rounded-xl border border-red-800/30">
                          <h4 className="text-2xl font-black text-white tracking-widest mb-2">HOLD ON</h4>
                          <p className="text-red-200 text-sm">Hold directly onto your shelter. Be prepared to move with it if the extreme shaking slides it.</p>
                        </div>
                      </div>
                      <div className="bg-slate-900/80 inline-block px-6 py-3 rounded-full text-amber-300 font-semibold border border-amber-900/50 text-sm">
                        ⚠️ DO NOT RUN OUTSIDE. You are statistically more likely to be crushed by exterior building facades.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="after" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-emerald-900/30">
                        <h4 className="font-semibold text-emerald-300">1. Check for Injuries</h4>
                        <p className="text-slate-400 text-sm mt-2">Perform first aid on anyone who is hurt. Call emergency services only for life-threatening injuries.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-emerald-900/30">
                        <h4 className="font-semibold text-emerald-300">2. Inspect Property</h4>
                        <p className="text-slate-400 text-sm mt-2">Check for gas leaks and broken electrical wires. Smell for gas. Evacuate if the building is visibly unsafe.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-emerald-900/30">
                        <h4 className="font-semibold text-emerald-300">3. Stay Informed</h4>
                        <p className="text-slate-400 text-sm mt-2">Use your battery-powered radio to listen to local news and official emergency alerts for instructions.</p>
                      </div>
                      <div className="bg-slate-800/40 p-5 rounded-xl border border-emerald-900/30">
                        <h4 className="font-semibold text-emerald-300">4. Expect Aftershocks</h4>
                        <p className="text-slate-400 text-sm mt-2">Secondary shockwaves will follow the main earthquake. Be prepared to Drop, Cover, and Hold On again.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* LIVE SCIENTIFIC FEEDS */}
              <Card className="bg-slate-900/60 border-slate-800 p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                  <span className="text-2xl">📡</span>
                  Scientific Live Feeds
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="https://ds.iris.edu/ds/nodes/dmc/tools/iris_ws/" target="_blank" rel="noopener noreferrer" className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-colors group">
                    <h4 className="font-semibold text-emerald-400 group-hover:text-emerald-300">IRIS Seismic Monitor</h4>
                    <p className="text-slate-400 text-sm mt-2">Professional seismogram data and raw earthquake telemetry feeds globally.</p>
                  </a>

                  <a href="https://www.emsc-csem.org/" target="_blank" rel="noopener noreferrer" className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-colors group">
                    <h4 className="font-semibold text-emerald-400 group-hover:text-emerald-300">EMSC Real-time Feed</h4>
                    <p className="text-slate-400 text-sm mt-2">European-Mediterranean Seismological Centre live alerts and citizen reporting.</p>
                  </a>
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: 4 columns wide on standard desktop */}
            <div className="lg:col-span-4 space-y-6">

              {/* Emergency Contacts Widget */}
              <Card className="bg-slate-900/80 border-slate-800 p-6 shadow-lg shadow-black/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Phone className="w-4 h-4 text-red-400" />
                  Local Hotlines
                </h3>

                <div className="mb-5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Detected Region</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all shadow-inner"
                  >
                    {Object.entries(COUNTRY_EMERGENCY_DATA).map(([code, data]) => (
                      <option key={code} value={code}>
                        {data.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-red-900/50 transition-colors">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Police / EMS</p>
                      <p className="text-xl font-black text-white group-hover:text-red-400 transition-colors">{countryData.emergencyNumber}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-950/30 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-red-500" />
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-amber-900/50 transition-colors">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Seismic Hotline</p>
                      <p className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">{countryData.earthquakeHotline}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-950/30 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Designated Shelters */}
              <Card className="bg-slate-900/80 border-slate-800 p-6 shadow-lg shadow-black/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <MapPin className="w-4 h-4 text-cyan-400 truncate" />
                  <span className="truncate">Safe Zones in {countryData.name}</span>
                </h3>

                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {countryData.shelters.map((shelter: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-cyan-900/50 transition-colors">
                      <h4 className="font-semibold text-slate-200 text-sm mb-1">{shelter.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {shelter.lat.toFixed(4)}°N, {Math.abs(shelter.lng).toFixed(4)}°{shelter.lng > 0 ? "E" : "W"}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* External Resources */}
              <Card className="bg-slate-900/80 border-slate-800 p-6 shadow-lg shadow-black/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Disaster Links
                </h3>

                <div className="space-y-2">
                  <a href="https://www.redcross.org/get-help/" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 px-3 py-2 rounded transition-colors">
                    🏥 Red Cross Preparedness Guide ↗
                  </a>
                  <a href="https://www.fema.gov/disaster/earthquake" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 px-3 py-2 rounded transition-colors">
                    🛡️ Official FEMA Guidelines ↗
                  </a>
                  <a href="https://earthquake.usgs.gov/earthquakes/map/" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 px-3 py-2 rounded transition-colors">
                    🌍 USGS Incident Map Database ↗
                  </a>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
