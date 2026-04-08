"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchDualSource24Hours } from "@/lib/dual-earthquake-fetch"
import { useRouter } from "next/navigation"

interface Earthquake {
  place: string
  mag: number
  lat: number
  lng: number
  time: string
  timestamp: number
  depth: number
  source: string
}

interface RecentActivitySectionProps {
  selectedLocation?: Earthquake | null
  onSelectEvent?: (location: Earthquake) => void
  searchRegion?: string
}

export function RecentActivitySection({ selectedLocation, onSelectEvent, searchRegion = "" }: RecentActivitySectionProps) {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [sourceFilter, setSourceFilter] = useState<'all' | 'usgs' | 'riseq'>('all')
  const { t, i18n } = useTranslation()
  const [translatedPlaces, setTranslatedPlaces] = useState<Record<string, string>>({})
  const [localCountryFilter, setLocalCountryFilter] = useState<string>('all')
  const [magFilter, setMagFilter] = useState<number>(0)
  const [timeFilter, setTimeFilter] = useState<number>(24)


  // Automated UI Geo-Translations Disabled per request
  useEffect(() => {
    // Return early, natively bypassing proxy
    return;
  }, [earthquakes, i18n.language]);

  useEffect(() => {
    let isMounted = true
    let abortController = new AbortController()

    const fetchEarthquakes = async () => {
      try {
        // Technically fetchDualSource24Hours should take signal, but since it's an abstraction
        // we'll rely on the AbortController for setting state cleanly if unmounted.
        const data = await fetchDualSource24Hours()
        
        if (!isMounted) return

        const earthquakesData: Earthquake[] = data.map((item: any) => {
          let parsedPlace = item.place || "Unknown Location";
          // Natively append India to IMD state-level API returns so they group flawlessly under a single Country Dropdown!
          if (item.source === 'riseq' && !parsedPlace.toLowerCase().includes('india')) {
             parsedPlace += ", India";
          }
          
          return {
            place: parsedPlace,
            mag: item.mag || 0,
            lat: item.lat,
            lng: item.lng,
            time: "", // We calculate this dynamically at render time now!
            timestamp: item.timestamp || Date.now(),
            depth: item.depth || 0,
            source: item.source || 'usgs',
          };
        })
        
        setEarthquakes(earthquakesData)
        setLastUpdated(new Date().toLocaleString())
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching earthquakes:", error)
        if (isMounted) setIsLoading(false)
      }
    }

    fetchEarthquakes()
    // Poll exactly every 60 seconds
    const interval = setInterval(fetchEarthquakes, 60 * 1000)
    return () => {
      isMounted = false
      abortController.abort()
      clearInterval(interval)
    }
  }, [])

  // Severity-based colors: Minor=green, Moderate=yellow, Strong=orange, Major=red
  const getMagnitudeColor = (mag: number) => {
    if (mag >= 7) return "bg-red-500/20 text-red-300 border-red-500/30"
    if (mag >= 6) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
    if (mag >= 4) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    return "bg-green-500/20 text-green-300 border-green-500/30"
  }

  const getSeverityLabel = (mag: number) => {
    if (mag >= 7) return "Major"
    if (mag >= 6) return "Strong"
    if (mag >= 4) return "Moderate"
    return "Minor"
  }

  const uniqueCountries = [...new Set(earthquakes.map(eq => {
    const parts = (eq.place || "").split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : "Unknown Region";
  }))].filter(c => c && c !== "Unknown Region").sort();

  const filteredEarthquakes = earthquakes.filter((eq) => {
    if (sourceFilter !== 'all' && eq.source !== sourceFilter) return false;
    
    // 1. Country Filter (Local)
    if (localCountryFilter !== 'all') {
       const c = eq.place.split(',').pop()?.trim() || "Unknown Region";
       if (c !== localCountryFilter) return false;
    }
    
    // 2. Magnitude Filter
    if (eq.mag < magFilter) return false;
    
    // 3. Time Filter (Math.abs protects against timezone skews from foreign API servers)
    const diffHours = Math.abs(Date.now() - eq.timestamp) / (1000 * 60 * 60);
    if (diffHours > timeFilter) return false;

    return true;
  })

  const firstTwenty = filteredEarthquakes.slice(0, 20)
  const remaining = filteredEarthquakes.slice(20)

  const formatCoordinate = (value: number): string => {
    return Math.abs(value).toFixed(2)
  }

  const getDynamicRelativeTime = (ts: number) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(i18n.language.split('-')[0], { numeric: 'auto' })
      const diffInSeconds = (ts - Date.now()) / 1000
      if (Math.abs(diffInSeconds) < 60) return i18n.language === 'ta' ? "இப்போது" : "Just now"
      const diffInMinutes = Math.round(diffInSeconds / 60)
      if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute')
      const diffInHours = Math.round(diffInMinutes / 60)
      if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour')
      return rtf.format(Math.round(diffInHours / 24), 'day')
    } catch {
      return "Recently"
    }
  }

  const renderEarthquakeTable = (data: Earthquake[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">Source</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">{t("recent.location")}</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">{t("recent.magnitude")}</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">{t("recent.severity")}</th>
            <th className="text-left py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">{t("recent.datetime")}</th>
            <th className="text-center py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">{t("recent.depth")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((quake, idx) => (
            <tr
              key={`${quake.place}-${quake.time}-${idx}`}
              onClick={() => onSelectEvent?.(quake)}
              className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors cursor-pointer"
            >
              <td className="py-3 px-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                {quake.source === 'riseq' ? 'IMD India' : 'USGS'}
              </td>
              <td className="py-3 px-4 text-slate-200 font-medium break-words min-w-[150px] max-w-[200px]">
                {translatedPlaces[quake.place] || quake.place}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge className={`${getMagnitudeColor(quake.mag)} border whitespace-nowrap`}>M{quake.mag.toFixed(1)}</Badge>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`text-xs font-semibold ${
                  quake.mag >= 7 ? "text-red-400" : quake.mag >= 6 ? "text-orange-400" : quake.mag >= 4 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {quake.mag >= 7 ? t("dashboard.strong") : quake.mag >= 6 ? t("dashboard.strong") : quake.mag >= 4 ? t("dashboard.moderate") : t("dashboard.minor")}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{getDynamicRelativeTime(quake.timestamp)}</td>
              <td className="py-3 px-4 text-slate-300 text-center whitespace-nowrap">{quake.depth.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Card className="bg-slate-800/50 border-cyan-500/20 p-4 sm:p-6 w-full">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-white mb-1">{t("recent.title")}</h2>
           <p className="text-sm text-slate-400">{t("recent.total")}: {filteredEarthquakes.length}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex flex-wrap gap-2">
             {/* Country Filter */}
             <select 
                value={localCountryFilter} 
                onChange={(e) => setLocalCountryFilter(e.target.value)}
                className="bg-slate-800 border-cyan-500/30 text-white rounded-md px-3 py-1.5 text-xs outline-none cursor-pointer"
             >
               <option value="all">All Regions</option>
               {uniqueCountries.map(c => (
                 <option key={c} value={c}>{c}</option>
               ))}
             </select>

             {/* Magnitude Filter */}
             <select 
                value={magFilter} 
                onChange={(e) => setMagFilter(Number(e.target.value))}
                className="bg-slate-800 border-cyan-500/30 text-white rounded-md px-3 py-1.5 text-xs outline-none cursor-pointer shrink-0"
             >
               <option value={0}>Any Magnitude</option>
               <option value={3}>M 3.0+</option>
               <option value={5}>M 5.0+</option>
               <option value={6}>M 6.0+</option>
             </select>

             {/* Date/Time Filter */}
             <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(Number(e.target.value))}
                className="bg-slate-800 border-cyan-500/30 text-white rounded-md px-3 py-1.5 text-xs outline-none cursor-pointer shrink-0"
             >
               <option value={24}>Past 24 Hours</option>
               <option value={12}>Past 12 Hours</option>
               <option value={6}>Past 6 Hours</option>
               <option value={1}>Past Hour</option>
             </select>
           </div>

           {/* Source Filters */}
           <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button onClick={() => setSourceFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sourceFilter === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>All</button>
              <button onClick={() => setSourceFilter('usgs')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sourceFilter === 'usgs' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>USGS</button>
              <button onClick={() => setSourceFilter('riseq')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sourceFilter === 'riseq' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'}`}>India (IMD)</button>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400 mx-auto mb-2" />
            <p className="text-slate-400">Fetching earthquake data...</p>
          </div>
        </div>
      ) : filteredEarthquakes.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4 bg-slate-900/20 rounded-xl border border-dashed border-slate-700/50">
          <p className="text-slate-400 text-center font-medium">There is currently no significant geological activity matching these specific parameters within the selected timeframe.</p>
        </div>
      ) : (
        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-700/30 border border-cyan-500/20">
            <TabsTrigger value="latest" className="text-sm">
              {t("recent.latest")} ({firstTwenty.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm" disabled={remaining.length === 0}>
              {t("recent.all")} ({remaining.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="mt-4">
            {firstTwenty.length > 0 ? (
              <>
                {renderEarthquakeTable(firstTwenty)}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">No earthquakes in this view</div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {remaining.length > 0 ? (
              <>
                {renderEarthquakeTable(remaining)}
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">No additional earthquakes</div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-6 text-xs text-slate-500 border-t border-slate-700/30 pt-4">
        <p>
          {t("recent.sourcePrefix")}
          {lastUpdated ? ` | ${t("recent.lastUpdated")}: ${lastUpdated}` : ""}
        </p>
      </div>
    </Card>
  )
}

