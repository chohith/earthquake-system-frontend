"use client"

import { useState } from "react"
import { GlobalNavigation } from "@/components/global-navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ChatbotWidget } from "@/components/chatbot-widget"

interface SelectedLocation {
  place: string
  mag: number
  lat: number
  lng: number
  time: string
  depth: number
}

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobalNavigation />
      <div className="w-full">
        <DashboardLayout selectedLocation={selectedLocation} onLocationSelect={setSelectedLocation} />
      </div>
      <ChatbotWidget />
    </main>
  )
}
