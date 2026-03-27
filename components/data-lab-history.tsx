"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Activity, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export function DataLabHistory() {
    const [timelineData, setTimelineData] = useState<any[]>([])
    const [seismoData, setSeismoData] = useState<any[]>([])
    const [playbackYear, setPlaybackYear] = useState(2015)
    const [isPlaying, setIsPlaying] = useState(false)
    const [loading, setLoading] = useState(true)

    // Fetch the massive 10-year dataset on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/data-feed/historical-timeline")
                if (response.ok) {
                    const res = await response.json()
                    if (res.data) setTimelineData(res.data)
                }
            } catch (e) {
                console.error("Failed to load timeline dataset")
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    // Poll the live seismograph stream every 1000ms
    useEffect(() => {
        const fetchSeismo = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/data-feed/live-seismograph")
                if (response.ok) {
                    const res = await response.json()
                    if (res.waveform) {
                        // Map plain floats to recharts objects
                        const points = res.waveform.map((val: number, idx: number) => ({
                            idx,
                            amplitude: val
                        }))
                        setSeismoData(points)
                    }
                }
            } catch (e) {
                console.error("Failed to load seismograph")
            }
        }

        fetchSeismo()
        const interval = setInterval(fetchSeismo, 1000)
        return () => clearInterval(interval)
    }, [])

    // Handle Playback Loop
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (isPlaying) {
            timer = setInterval(() => {
                setPlaybackYear((prev) => {
                    if (prev >= 2025) {
                        setIsPlaying(false)
                        return 2025
                    }
                    return prev + 1
                })
            }, 1500)
        }
        return () => clearInterval(timer)
    }, [isPlaying])

    // Filter 10-year data strictly to the playback slider year
    const currentYearData = timelineData.filter((d) => new Date(d.time).getFullYear() === playbackYear)

    return (
        <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-400" />
                        <CardTitle className="text-white">Live Global Seismograph Stream</CardTitle>
                    </div>
                    <CardDescription>
                        Real-time acoustic background earth noise and immediate P-Wave/S-Wave detection simulations from USGS global sensors.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="w-full h-48 bg-emerald-950/20 rounded-xl overflow-hidden border border-emerald-900/30 p-2 shadow-inner">
                        {seismoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={seismoData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={false} />
                                    <YAxis domain={[-5, 5]} hide />
                                    <Line
                                        type="monotone"
                                        dataKey="amplitude"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-emerald-700 font-mono text-sm animate-pulse">
                                Establishing uplink to USGS sensor networks...
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex justify-between px-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
                        <span>Sensor: GSN Virtual Array</span>
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Streaming Live
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-400" />
                        <CardTitle className="text-white">2015-2025 Historical Time-Lapse</CardTitle>
                    </div>
                    <CardDescription>
                        Explore a massive dataset of every global Magnitude 6.0+ earthquake over the last decade.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 relative">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-slate-400">Downloading 10-year dataset from NASA/USGS...</div>
                    ) : (
                        <>
                            {/* Year display overlay */}
                            <div className="absolute top-10 right-10 text-6xl font-black text-white/5 tracking-tighter pointer-events-none">
                                {playbackYear}
                            </div>

                            {/* Data Table / Log for that specific year */}
                            <div className="h-64 overflow-y-auto mb-6 bg-slate-950 rounded-lg p-4 border border-slate-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase sticky top-0 bg-slate-950">
                                        <tr>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2">Location</th>
                                            <th className="px-4 py-2 text-right">Magnitude</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentYearData.map((event, i) => (
                                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="px-4 py-2 text-slate-300">
                                                    {new Date(event.time).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2 text-slate-400 truncate max-w-[200px]">
                                                    {event.place}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <Badge className="bg-red-900/50 text-red-300 border border-red-800/50">
                                                        M {event.magnitude.toFixed(1)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentYearData.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                                    No M6.0+ events logged for this period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <Button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    variant="outline"
                                    className="bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/40 w-24"
                                >
                                    {isPlaying ? "Pause" : "Play"}
                                </Button>

                                <Slider
                                    value={[playbackYear]}
                                    min={2015}
                                    max={2025}
                                    step={1}
                                    onValueChange={(vals) => {
                                        setPlaybackYear(vals[0])
                                        setIsPlaying(false) // pause if user drags
                                    }}
                                    className="flex-1"
                                />

                                <span className="text-lg font-bold text-white w-16 text-right">
                                    {playbackYear}
                                </span>
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-4">
                                Showing {currentYearData.length} massive M6.0+ events during the selected year.
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
