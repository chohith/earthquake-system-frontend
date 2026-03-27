"use client"

import { GlobalNavigation } from "@/components/global-navigation"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function TechnologiesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobalNavigation />

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Advanced Seismic Technology Stack</h1>
            <p className="text-slate-400 text-lg">
              Understanding the technologies powering global earthquake detection, positioning, and emergency response
            </p>
          </div>

          {/* Core Detection Algorithms */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Core Seismic Detection Algorithms</h2>

            <Tabs defaultValue="staltas" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="staltas">STA/LTA</TabsTrigger>
                <TabsTrigger value="epic">EPIC</TabsTrigger>
                <TabsTrigger value="finder">FinDer</TabsTrigger>
              </TabsList>

              <TabsContent value="staltas" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Short-Term Average / Long-Term Average</h3>
                  <Badge className="bg-cyan-600/30 text-cyan-300 mb-4">Real-time Trigger Detection</Badge>
                  <p className="text-slate-300 mb-4">
                    STA/LTA is a fundamental algorithm for detecting sudden changes in seismic energy. It compares a
                    short-term window (typically 1-3 seconds) against a long-term baseline to identify earthquake
                    arrivals with minimal delay.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                    <p className="text-sm text-slate-200 font-mono">
                      Trigger Point = STA / LTA &gt; Threshold (typically 3-5)
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="epic" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Earthquake Point-Source Integrated Code</h3>
                  <Badge className="bg-orange-600/30 text-orange-300 mb-4">Magnitude & Location Estimation</Badge>
                  <p className="text-slate-300 mb-4">
                    EPIC rapidly estimates earthquake magnitude and location by analyzing the integrated ground
                    displacement from multiple seismic stations. Provides initial rapid estimates within 3-10 seconds.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Uses P-wave and S-wave arrivals for triangulation</p>
                    <p className="text-sm text-slate-200">• Integrates displacement amplitudes across stations</p>
                    <p className="text-sm text-slate-200">• Provides magnitude within ±0.3 units</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="finder" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Finite-Fault Rupture Detector</h3>
                  <Badge className="bg-red-600/30 text-red-300 mb-4">Rupture Length & Slip Estimation</Badge>
                  <p className="text-slate-300 mb-4">
                    FinDer uses kinematic rupture models to estimate fault dimensions and moment release in near-real
                    time. Critical for estimating damage potential and shaking maps for large earthquakes.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Models finite fault geometries</p>
                    <p className="text-sm text-slate-200">• Estimates rupture propagation</p>
                    <p className="text-sm text-slate-200">• Available within 15 seconds post-event</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Advanced Algorithms */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Advanced Analysis Methods</h2>

            <Tabs defaultValue="plum" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="plum">PLUM</TabsTrigger>
                <TabsTrigger value="ann">ANN</TabsTrigger>
                <TabsTrigger value="cnn">CNN</TabsTrigger>
              </TabsList>

              <TabsContent value="plum" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Propagation of Local Undamped Motion</h3>
                  <Badge className="bg-yellow-600/30 text-yellow-300 mb-4">Ground Motion Simulation</Badge>
                  <p className="text-slate-300 mb-4">
                    PLUM propagates seismic waves through local velocity models to predict ground shaking patterns. Used
                    for ShakeMaps and earthquake early warning systems.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• 3D finite difference wave propagation</p>
                    <p className="text-sm text-slate-200">• Regional velocity model integration</p>
                    <p className="text-sm text-slate-200">• Predicts PGA, PGV, spectral accelerations</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ann" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Artificial Neural Networks</h3>
                  <Badge className="bg-purple-600/30 text-purple-300 mb-4">Machine Learning Classification</Badge>
                  <p className="text-slate-300 mb-4">
                    Deep neural networks trained on seismic waveforms for automatic event classification, magnitude
                    refinement, and anomaly detection.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Waveform classification (P/S/noise)</p>
                    <p className="text-sm text-slate-200">• Magnitude and depth prediction</p>
                    <p className="text-sm text-slate-200">• Event vs. blast discrimination</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cnn" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Convolutional Neural Networks</h3>
                  <Badge className="bg-pink-600/30 text-pink-300 mb-4">Pattern Recognition</Badge>
                  <p className="text-slate-300 mb-4">
                    CNNs extract spatial-temporal patterns from continuous seismic data streams for improved accuracy in
                    phase picking, event detection, and rupture characterization.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Spectral feature extraction</p>
                    <p className="text-sm text-slate-200">• Real-time phase identification</p>
                    <p className="text-sm text-slate-200">• High-frequency rupture details</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Positioning & Communication */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Positioning & Communication Technologies</h2>

            <Tabs defaultValue="d2d" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
                <TabsTrigger value="d2d">D2D/DTC</TabsTrigger>
                <TabsTrigger value="leo">LEO Satellites</TabsTrigger>
                <TabsTrigger value="ntn">3GPP NTN</TabsTrigger>
                <TabsTrigger value="positioning">Positioning</TabsTrigger>
              </TabsList>

              <TabsContent value="d2d" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Direct-to-Device / Direct-to-Cell</h3>
                  <Badge className="bg-cyan-600/30 text-cyan-300 mb-4">Emergency Communication</Badge>
                  <p className="text-slate-300 mb-4">
                    D2D and DTC enable emergency alerts to reach users via satellite without requiring cellular
                    connectivity, Wi-Fi, or internet. Critical for disaster zones and remote areas.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• SMS/emergency alert broadcast via satellite</p>
                    <p className="text-sm text-slate-200">• Works on unmodified standard smartphones</p>
                    <p className="text-sm text-slate-200">• No subscription required for emergency messaging</p>
                    <p className="text-sm text-slate-200">• Limited bandwidth for life-critical alerts</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leo" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Low Earth Orbit (LEO) Satellites</h3>
                  <Badge className="bg-blue-600/30 text-blue-300 mb-4">Global Coverage Networks</Badge>
                  <p className="text-slate-300 mb-4">
                    LEO satellite constellations (500-2000 km altitude) provide global emergency communication, with
                    latency around 30-50ms. Examples: Starlink, Kuiper, OneWeb.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Low latency (~30-50ms round trip)</p>
                    <p className="text-sm text-slate-200">• Global coverage including poles</p>
                    <p className="text-sm text-slate-200">• High-speed data for detailed reports</p>
                    <p className="text-sm text-slate-200">• Requires compatible device hardware</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ntn" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">3GPP Non-Terrestrial Network (NTN)</h3>
                  <Badge className="bg-green-600/30 text-green-300 mb-4">Mobile Network Standard</Badge>
                  <p className="text-slate-300 mb-4">
                    3GPP NTN integrates satellite networks into cellular standards, enabling seamless emergency handoff
                    between terrestrial and satellite networks for continuous coverage.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• Standardized satellite-terrestrial handoff</p>
                    <p className="text-sm text-slate-200">• Doppler shift correction built-in</p>
                    <p className="text-sm text-slate-200">• Works with standard 5G/4G modems</p>
                    <p className="text-sm text-slate-200">• Network-assisted positioning (T-PRS)</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="positioning" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Hybrid Positioning Systems</h3>
                  <Badge className="bg-orange-600/30 text-orange-300 mb-4">Multi-Source Localization</Badge>
                  <p className="text-slate-300 mb-4">
                    Combining GPS/GNSS, A-GPS, TDOA/FDOA, and network-derived positioning for resilient localization
                    even when GPS is unavailable or jammed.
                  </p>
                  <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30 space-y-2">
                    <p className="text-sm text-slate-200">• GPS/GNSS: ±5m (open sky)</p>
                    <p className="text-sm text-slate-200">• Assisted-GPS: ±10-50m (faster lock)</p>
                    <p className="text-sm text-slate-200">• TDOA/FDOA: ±50-200m (no GPS needed)</p>
                    <p className="text-sm text-slate-200">• Network triangulation: ±100-500m (cellular)</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Security & Performance */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Security & Performance Architecture</h2>

            <Tabs defaultValue="crypto" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
                <TabsTrigger value="crypto">Cryptography</TabsTrigger>
                <TabsTrigger value="transport">Transport</TabsTrigger>
                <TabsTrigger value="optimization">Optimization</TabsTrigger>
              </TabsList>

              <TabsContent value="crypto" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Encryption & Integrity</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-green-300 mb-2">TLS 1.3</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Modern TLS implementation with Perfect Forward Secrecy. All data transmission encrypted with
                        zero cleartext exposure.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-blue-300 mb-2">AES-GCM (256-bit)</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Authenticated encryption standard. Provides confidentiality + authenticity in single operation.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-purple-300 mb-2">Elliptic Curve Cryptography (ECC)</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Modern asymmetric cryptography. Smaller keys than RSA with equivalent security (P-256, P-384).
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-pink-300 mb-2">ChaCha20-Poly1305</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Alternative AEAD cipher optimized for low-latency systems without hardware AES acceleration.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transport" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Protocol & Network Optimization</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-cyan-300 mb-2">HTTPS Enforcement</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        All requests upgraded to TLS. HSTS headers (max-age: 31536000) enforce secure transport.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-yellow-300 mb-2">HTTP/2 & HTTP/3</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Multiplexing reduces latency. HTTP/3 (QUIC) enables connection migration for resilience on
                        unreliable satellite links.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-green-300 mb-2">CDN & Geographic Redundancy</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Content distributed across 200+ CDN edge nodes. Automatic failover to nearest healthy endpoint.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded border border-slate-600/30">
                      <h4 className="font-semibold text-orange-300 mb-2">Intelligent Caching</h4>
                      <p className="text-sm text-slate-200 mb-2">
                        Earthquake data cached for 5-10 seconds. Static assets cached for 24h with versioned URLs.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="optimization" className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Latency & Performance Reduction</h3>
                  <div className="bg-slate-700/30 p-6 rounded border border-slate-600/30">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-cyan-300 mb-2">End-to-End Latency: ~200-500ms</h4>
                        <ul className="text-sm text-slate-200 space-y-1 ml-4">
                          <li>• Satellite uplink: 30-50ms (LEO)</li>
                          <li>• Processing & authentication: 50-100ms</li>
                          <li>• CDN response: 20-50ms</li>
                          <li>• Client rendering: 100-300ms</li>
                        </ul>
                      </div>
                      <div className="border-t border-slate-600 pt-4">
                        <h4 className="font-semibold text-green-300 mb-2">Optimization Techniques</h4>
                        <ul className="text-sm text-slate-200 space-y-1 ml-4">
                          <li>• Parallel asset loading (CDN pre-warming)</li>
                          <li>• Brotli compression (20-30% reduction)</li>
                          <li>• Resource hints (dns-prefetch, preconnect)</li>
                          <li>• Satellite-optimized packet batching</li>
                          <li>• Encryption offload to hardware accelerators</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Unified System Diagram */}
          <Card className="bg-slate-800/50 border-cyan-500/20 p-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Unified Seismic Monitoring System Architecture</h2>
            <div className="bg-slate-700/30 p-6 rounded border border-slate-600/30 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre>{`
EARTHQUAKE EVENT
    ↓
[Seismic Stations] → STA/LTA (Trigger Detection)
    ↓
[Real-time Data Stream] → EPIC + ARIMA Forecast
    ↓
    ├─→ ANN (Magnitude Refinement)
    ├─→ CNN (Phase Picking)
    └─→ FinDer (Rupture Analysis)
    ↓
[Multi-Model Consensus]
    ↓
ENCRYPTED TRANSMISSION (TLS 1.3 + AES-GCM)
    ↓
[Terrestrial Network] OR [LEO Satellite] OR [3GPP NTN]
    ↓
[CDN Edge Nodes] (HTTP/3, Brotli Compression)
    ↓
USER CLIENTS
    ├─→ Web Dashboard (Real-time 3D Globe)
    ├─→ Mobile Apps (Offline Capable)
    └─→ Emergency Alert System (D2D/DTC)
    ↓
[Positioning System]
    ├─→ GPS/GNSS (Primary, ±5m)
    ├─→ A-GPS (Assisted, ±10-50m)
    ├─→ TDOA/FDOA (Satellite, ±50-200m)
    └─→ Network Triangulation (Fallback, ±100-500m)
    ↓
[Emergency Response Teams]
    ├─→ Automated Resource Dispatch
    ├─→ Hazard Assessment
    └─→ Public Safety Coordination
              `}</pre>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
