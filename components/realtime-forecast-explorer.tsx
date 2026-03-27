"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { getLiveRegionData } from "@/lib/ml-backend-client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

interface LiveRegionReponse {
  region: string
  time_window_used: string
  historical_events_analyzed: number
  historical_mean_magnitude: number
  predicted_probability: number
  most_affected_places?: string[]
  predicted_next_magnitude: {
    lstm_prediction: number
    cnn_prediction: number
    ensemble_prediction: number
  }
  recent_events_sample: Array<{
    time: string
    magnitude: number
    depth: number
    place: string
  }>
}

export function RealtimeForecastExplorer({ selectedRegion: _selectedRegion }: { selectedRegion?: string | null }) {
  const [country, setCountry] = useState("japan")
  const [data, setData] = useState<LiveRegionReponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMSG, setErrorMSG] = useState("")

  const fetchLiveRegion = async () => {
    try {
      setLoading(true)
      setErrorMSG("")
      const result = await getLiveRegionData(country, "month")

      if (result.predicted_next_magnitude) {
        setData(result)
      } else {
        setErrorMSG("No seismic data found for this region.")
      }
    } catch (error) {
      console.error("[v0] Live Region Fetch Error:", error)
      setErrorMSG("Network error trying to hit the Python Backend.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveRegion()
  }, [])

  // Format chart data
  const chartData = data?.recent_events_sample.map((event) => ({
    time: new Date(event.time).toLocaleDateString() + " " + new Date(event.time).getHours() + ":00",
    magnitude: event.magnitude,
    depth: event.depth,
  })).reverse() || []

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-cyan-400">Live Regional Prediction (LSTM/CNN)</CardTitle>
          <CardDescription>Enter any country to fetch the last 30 days of data and run the deep learning prediction model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={country} onValueChange={(val) => setCountry(val)}>
                <SelectTrigger className="w-full h-10 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-60">
                  <SelectItem value="japan">Japan</SelectItem>
                  <SelectItem value="california">California, USA</SelectItem>
                  <SelectItem value="mexico">Mexico</SelectItem>
                  <SelectItem value="chile">Chile</SelectItem>
                  <SelectItem value="indonesia">Indonesia</SelectItem>
                  <SelectItem value="turkey">Turkey</SelectItem>
                  <SelectItem value="italy">Italy</SelectItem>
                  <SelectItem value="alaska">Alaska, USA</SelectItem>
                  <SelectItem value="hawaii">Hawaii, USA</SelectItem>
                  <SelectItem value="new zealand">New Zealand</SelectItem>
                  <SelectItem value="philippines">Philippines</SelectItem>
                  <SelectItem value="taiwan">Taiwan</SelectItem>
                  <SelectItem value="peru">Peru</SelectItem>
                  <SelectItem value="greece">Greece</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={fetchLiveRegion}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-10 w-full sm:w-auto"
            >
              {loading ? "Analyzing..." : "Analyze Model"}
            </Button>
          </div>
          {errorMSG && <p className="text-red-400 mt-4 text-sm font-semibold">{errorMSG}</p>}
        </CardContent>
      </Card>

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">AI Predicted Magnitude</CardTitle>
              <CardDescription>Ensemble model calculation for the next sequential event</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-8">
              <div className="flex flex-col items-center justify-center px-6 py-8 bg-slate-800/80 rounded-xl border border-slate-700/50 w-full mb-4 shadow-lg">
                <div className="flex flex-col items-center gap-1 mb-4">
                  <span className="text-5xl md:text-6xl font-black text-red-400 tracking-tighter drop-shadow-md">
                    {data.predicted_probability}%
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                    Calculated Probability
                  </span>
                </div>
                <p className="text-base md:text-lg text-slate-300 font-light text-center max-w-lg leading-relaxed">
                  Deep Learning models indicate a chance of at least one <strong className="text-violet-400 font-semibold px-1">M{data.predicted_next_magnitude.ensemble_prediction.toFixed(1)}+</strong> earthquake occurring in <strong className="text-cyan-400 font-semibold px-1">{data.region}</strong> over the next 7 days.
                </p>
                {data.most_affected_places && data.most_affected_places.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 w-full flex flex-col items-center">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Most Vulnerable Localities</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {data.most_affected_places.map((place, idx) => (
                        <span key={idx} className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded truncate max-w-[200px] border border-slate-600">
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-center font-mono text-sm p-2">
                Analyzed {data.historical_events_analyzed} events in the past 30 days.<br />
                Historical Average: M {data.historical_mean_magnitude.toFixed(2)}
              </p>

              <div className="w-full mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">CNN Model Confidence</p>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(data.predicted_next_magnitude.cnn_prediction / 10) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-blue-400">
                    {((data.predicted_next_magnitude.cnn_prediction / 10) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-slate-400 mb-1">LSTM Model Confidence</p>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${(data.predicted_next_magnitude.lstm_prediction / 10) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-indigo-400">
                    {((data.predicted_next_magnitude.lstm_prediction / 10) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Historical Sequence Trace</CardTitle>
              <CardDescription>Recent events fed into the LSTM layer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={(value) => value.split(" ")[0]}
                    />
                    <YAxis
                      domain={['dataMin - 1', 'dataMax + 1']}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="magnitude"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Metrics & Recommendation */}
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Analysis Details</CardTitle>
              <CardDescription>30-day earthquake activity metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="bg-cyan-950/30 border border-cyan-500/20 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Recent Events</p>
                    <p className="text-2xl font-bold text-cyan-400">{data.historical_events_analyzed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Calculated Probability</p>
                    <p className="text-2xl font-bold text-cyan-400">{data.predicted_probability}%</p>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-cyan-500 mt-4">
                <Badge
                  className={`mb-2 ${data.predicted_probability > 60
                    ? "bg-red-900/80 text-red-100"
                    : data.predicted_probability > 30
                      ? "bg-orange-900/80 text-orange-100"
                      : "bg-green-900/80 text-green-100"
                    }`}
                >
                  {data.predicted_probability > 60 ? "Critical Alert" : data.predicted_probability > 30 ? "Moderate Alert" : "Low Risk"}
                </Badge>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {data.predicted_probability > 60 ? "High earthquake probability detected in this region. The Deep Learning models have found severe patterns in the recent sequence." :
                    data.predicted_probability > 30 ? "Moderate earthquake risk. The AI has detected typical regional tectonic shifts." :
                      "Low earthquake risk currently. Continuous normal monitoring from the models."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
