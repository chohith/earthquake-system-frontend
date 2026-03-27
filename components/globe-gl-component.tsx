'use client'

import { useEffect, useRef } from 'react'

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
  onSelectQuake: (quake: EarthquakeData) => void
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude >= 6) return '#ef4444'
  if (magnitude >= 5) return '#f97316'
  if (magnitude >= 4) return '#eab308'
  return '#22c55e'
}

export function GlobeGLComponent({ earthquakes, onSelectQuake }: GlobeGLComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)

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
          size: Math.min(quake.mag * 1.5, 6),
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
            globe.onPointClick((d: any) => {
              if (d && d.quake) {
                onSelectQuake(d.quake)
              }
            })
            console.log('[v0] Points added successfully')
          } catch (err) {
            console.error('[v0] Error adding points:', err)
          }
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
  }, [earthquakes, onSelectQuake])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black"
    />
  )
}
