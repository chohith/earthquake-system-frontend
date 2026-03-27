import { GlobalNavigation } from "@/components/global-navigation"
import { DataLabHistory } from "@/components/data-lab-history"

export default function LabPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <GlobalNavigation />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Data Lab & History Archive</h1>
                    <p className="text-slate-400">
                        Raw telemetry streams and interactive decade-scale seismic archives.
                    </p>
                </div>

                <DataLabHistory />
            </div>
        </main>
    )
}
