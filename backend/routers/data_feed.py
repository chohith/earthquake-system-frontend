import requests
from fastapi import APIRouter
import numpy as np
from datetime import datetime

router = APIRouter()

# In-memory cache for historical data to prevent spamming the USGS API on every UI render
_historical_cache = None

@router.get("/historical-timeline")
def get_historical_timeline():
    """
    Pulls an entire decade (2015-2025) of M6.0+ global earthquakes 
    to feed the UI 3D Globe Time-lapse slider.
    """
    global _historical_cache
    if _historical_cache:
        return _historical_cache
        
    try:
        # Requesting M6.0+ over 10 years gives a beautiful, manageable dataset (approx 1,500 events)
        url = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2015-01-01&endtime=2025-12-31&minmagnitude=6.0"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            features = []
            for feature in data.get('features', []):
                props = feature['properties']
                coords = feature['geometry']['coordinates']
                
                features.append({
                    "time": props['time'],
                    "place": props['place'],
                    "magnitude": props['mag'],
                    "latitude": coords[1],
                    "longitude": coords[0],
                    "depth": coords[2]
                })
            
            # Sort chronologically for the time-lapse player
            features = sorted(features, key=lambda x: x['time'])
            result = {"status": "success", "count": len(features), "data": features}
            _historical_cache = result
            return result
            
        return {"error": "Failed to fetch USGS historical API"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/live-seismograph")
def get_seismograph_stream():
    """
    Simulate a highly realistic raw waveform stream (Seismometer trace)
    tied mathematically to the actual max magnitude currently happening in the last hour.
    """
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            max_mag = 1.0 # default low baseline
            for f in data.get('features', []):
                m = f['properties'].get('mag')
                if m and type(m) in [int, float] and float(m) > max_mag:
                    max_mag = float(m)
                    
            # Generate 50 points of random seismic background earth noise
            base_noise = np.random.normal(0, 0.4, 50)
            
            # If there's an active earthquake globally, physically simulate a P-Wave / S-Wave strike
            if max_mag >= 1.5:
                spike_idx = np.random.randint(10, 40)
                spike_width = max(3, int(max_mag * 1.5))
                amp = (max_mag ** 1.8) # Exponential amplitude scaling
                
                for i in range(50):
                    dist = abs(i - spike_idx)
                    if dist < spike_width:
                        damp = 1.0 - (dist / spike_width)
                        # Add massive oscillating amplitude
                        base_noise[i] += np.random.normal(0, amp * damp)
                        
            return {
                "timestamp": datetime.now().isoformat(), 
                "waveform": np.round(base_noise, 3).tolist(), 
                "station_mag_detected": max_mag
            }
        return {"error": "USGS API unreachable"}
    except Exception as e:
        return {"error": str(e)}
