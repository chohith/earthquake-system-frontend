"use client"

import { useState, Suspense } from "react"
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading Dashboard...</div>}>
          <DashboardLayout selectedLocation={selectedLocation} onLocationSelect={setSelectedLocation} />
        </Suspense>
      </div>
      <ChatbotWidget />
    </main>
  )
}
