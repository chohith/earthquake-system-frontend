'use client'

import { useEffect, useRef } from 'react'
import { useTranslation } from "react-i18next"

interface EarthquakeData {
  id: string
  lat: number
  lng: number
  mag: number
  depth: number
  time: string
  place: string
}

interface GlobeGLComponentProps {
  earthquakes: EarthquakeData[]
  showIndiaLayer?: boolean
  searchRegion?: string
  onSelectQuake: (quake: EarthquakeData) => void
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude >= 6) return '#D50000' // Red
  if (magnitude >= 5) return '#FF6D00' // Orange
  if (magnitude >= 3) return '#FFD600' // Yellow
  return '#00C853' // Green
}

const getRadiusSize = (magnitude: number): number => {
  if (magnitude >= 6) return 2.5
  if (magnitude >= 5) return 1.2
  if (magnitude >= 3) return 0.6
  return 0.3
}

export function GlobeGLComponent({ earthquakes, showIndiaLayer = true, searchRegion = "", onSelectQuake }: GlobeGLComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!containerRef.current) return

    const initGlobe = async () => {
      try {
        // Dynamically import globe.gl
        const GlobeGL = (await import('globe.gl')).default

        if (!containerRef.current) return

        // Clear previous content
        containerRef.current.innerHTML = ''

        // Create globe instance passing container directly
        // @ts-ignore
        const globe = GlobeGL()(containerRef.current)
          .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
          .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
          .backgroundColor('rgba(0, 0, 0, 0)')
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight)

        console.log('[v0] Globe initialized:', globe ? 'success' : 'failed')

        // Prepare earthquake points data
        const pointsData = earthquakes.map((quake) => ({
          lat: quake.lat,
          lng: quake.lng,
          size: getRadiusSize(quake.mag),
          color: getMagnitudeColor(quake.mag),
          quake: quake,
        }))

        console.log('[v0] Points data prepared:', pointsData.length)

        // Add points to globe
        if (pointsData.length > 0) {
          try {
            globe.pointsData(pointsData)
            globe.pointColor((d: any) => d.color)
            globe.pointAltitude(0.01)
            globe.pointLabel((d: any) => `
              <div style="background: rgba(15, 23, 42, 0.95); padding: 10px; border-radius: 6px; border: 1px solid #06b6d4; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.5);" dir="auto">
                <div style="font-weight: bold; color: white; display: flex; align-items: center; gap: 8px;">
                   <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${d.color}"></span>
                   M${d.quake.mag.toFixed(1)} - ${d.quake.place}
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 6px;">${t('recent.depth')}: ${d.quake.depth} km</div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">Time: ${new Date(d.quake.time).toLocaleString()}</div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">${t('recent.sourcePrefix').split(':')[0] || 'Source'}: <strong style="color: ${d.quake.id?.startsWith('imd') ? '#ff9933' : '#a78bfa'}">${d.quake.id?.startsWith('imd') ? 'India (IMD)' : 'USGS Database'}</strong></div>
              </div>
            `)
            globe.onPointClick((d: any) => {
              if (d && d.quake) {
                onSelectQuake(d.quake)
                
                // Fly to point
                globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.8 }, 1000);
                
                // Pause rotation interactively
                if (globe.controls()) {
                   globe.controls().autoRotate = false;
                   setTimeout(() => { if (globeRef.current && globeRef.current.controls()) globeRef.current.controls().autoRotate = true; }, 10000);
                }
              }
            })
            
            // Auto-rotate disabled by request
            if (globe.controls()) {
              globe.controls().autoRotate = false;
            }
            
            console.log('[v0] Points added successfully')
          } catch (err) {
            console.error('[v0] Error adding points:', err)
          }
        }
        
        // India Saffron Ripple Rings Layer
        if (showIndiaLayer) {
           const indianQuakes = earthquakes.filter(q => q.id && q.id.startsWith('imd'));
           const ringsData = indianQuakes.map(quake => ({
             lat: quake.lat,
             lng: quake.lng,
             maxR: Math.max(0.3, quake.mag * 0.3), // Substantially reduced size for clarity!
             propagationSpeed: 0.8, // Slower calmer ripple
             repeatPeriod: 1500 // More spacing between ripples
           }));
           globe.ringsData(ringsData)
             .ringColor(() => 'rgba(255, 153, 51, 0.7)') // Slightly transparent Saffron Color
             .ringMaxRadius('maxR')
             .ringPropagationSpeed('propagationSpeed')
             .ringRepeatPeriod('repeatPeriod')
        } else {
           globe.ringsData([])
        }

        // Add simple label overlays using a separate container
        const topQuakes = earthquakes.slice(0, 12)
        console.log('[v0] Top quakes for labels:', topQuakes.length)

        if (topQuakes.length > 0) {
          try {
            // Create wrapper for labels
            const labelWrapper = document.createElement('div')
            labelWrapper.style.position = 'absolute'
            labelWrapper.style.top = '0'
            labelWrapper.style.left = '0'
            labelWrapper.style.width = '100%'
            labelWrapper.style.height = '100%'
            labelWrapper.style.pointerEvents = 'none'

            // Create labels as simple HTML elements
            topQuakes.forEach((quake, index) => {
              const label = document.createElement('div')
              label.className = 'earthquake-label'
              label.textContent = quake.place.substring(0, 24)
              
              label.style.position = 'absolute'
              label.style.color = '#22d3ee'
              label.style.fontSize = '11px'
              label.style.fontWeight = '500'
              label.style.textShadow = '0 0 3px rgba(0,0,0,0.8)'
              label.style.pointerEvents = 'auto'
              label.style.cursor = 'pointer'
              label.style.whiteSpace = 'nowrap'
              label.style.top = `${20 + index * 25}px`
              label.style.left = '10px'
              label.style.zIndex = '10'
              label.style.transition = 'color 0.2s ease'

              label.addEventListener('click', (e) => {
                e.stopPropagation()
                onSelectQuake(quake)
              })

              label.addEventListener('mouseenter', () => {
                label.style.color = '#00d4ff'
              })

              label.addEventListener('mouseleave', () => {
                label.style.color = '#22d3ee'
              })

              labelWrapper.appendChild(label)
            })

            containerRef.current.appendChild(labelWrapper)
            console.log('[v0] Labels added successfully')
          } catch (err) {
            console.error('[v0] Error adding labels:', err)
          }
        }

        // Store globe reference
        globeRef.current = globe

        // Handle resize
        const handleResize = () => {
          if (containerRef.current && globeRef.current) {
            const width = containerRef.current.clientWidth
            const height = containerRef.current.clientHeight
            globeRef.current.width(width).height(height)
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
        }
      } catch (error) {
        console.error('[v0] Error initializing globe:', error)
      }
    }

    initGlobe()

    return () => {
      if (globeRef.current) {
        globeRef.current = null
      }
    }
  }, [earthquakes, onSelectQuake, t, showIndiaLayer])

  // Programmatically pan & zoom whenever the selected country dropdown updates!
  useEffect(() => {
    if (searchRegion && earthquakes.length > 0 && globeRef.current) {
      const cFilter = searchRegion.toLowerCase().trim();
      const targetedQuakes = earthquakes.filter(eq => {
        const countryExt = eq.place.split(',').pop()?.trim().toLowerCase() || "";
        return countryExt.includes(cFilter) || eq.place.toLowerCase().includes(cFilter);
      });
      
      if (targetedQuakes.length > 0) {
        // Stop default rolling 
        if (globeRef.current.controls()) {
           globeRef.current.controls().autoRotate = false;
        }
        // Jump smoothly to the largest quake in that territory
        const primaryTarget = targetedQuakes.reduce((max, current) => max.mag > current.mag ? max : current, targetedQuakes[0]);
        globeRef.current.pointOfView({ lat: primaryTarget.lat, lng: primaryTarget.lng, altitude: 1.2 }, 1500);
      }
    }
  }, [searchRegion, earthquakes])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black"
    />
  )
}
