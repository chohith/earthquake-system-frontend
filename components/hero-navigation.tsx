"use client"

import { Activity, ShieldAlert, LineChart, Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function HeroNavigation() {
  const router = useRouter()
  const { t } = useTranslation()

  const handleViewLiveMap = () => {
    router.push("/#global-seismic-activity")
  }

  const handleLearnMore = () => {
    router.push("/emergency")
  }

  return (
    <div className="relative overflow-hidden w-full bg-slate-950 border-b border-cyan-500/20 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Live Monitoring Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            {t("hero.liveBadge")}
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 leading-tight block mb-2">
              AI-Driven Real-Time Spatiotemporal Analysis
            </span>
            and Seismic Risk Monitoring System
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            {t("hero.desc")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Button size="lg" onClick={handleViewLiveMap} className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[160px]">
            {t("hero.btnLive")}
          </Button>
          <Button size="lg" onClick={handleLearnMore} variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
            {t("hero.btnLearn")}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 text-center">
            <Globe className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">{t("hero.stat1")}</div>
            <div className="text-xs text-slate-400">{t("hero.stat1Desc")}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 text-center">
            <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">{t("hero.stat2")}</div>
            <div className="text-xs text-slate-400">{t("hero.stat2Desc")}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 text-center">
            <ShieldAlert className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">{t("hero.stat3")}</div>
            <div className="text-xs text-slate-400">{t("hero.stat3Desc")}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50 text-center">
            <LineChart className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white">{t("hero.stat4")}</div>
            <div className="text-xs text-slate-400">{t("hero.stat4Desc")}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
