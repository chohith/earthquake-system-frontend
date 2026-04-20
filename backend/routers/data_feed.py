import requests
from fastapi import APIRouter
import numpy as np
from datetime import datetime

router = APIRouter()

# In-memory cache for historical data to prevent spamming the USGS API on every UI render
_historical_cache = None

@router.get("/historical-timeline")
async def get_historical_timeline(duration: str = "month"):
    """
    Pulls seismic data to feed the UI 3D Globe Time-lapse slider.
    Supports: hour, day, week, month, year, decade.
    """
    from data_loader import DualSourceDataLoader
    
    # Decades/Years use the M6.0+ historical fetch (Manageable size for large time windows)
    if duration in ["year", "decade"]:
        global _historical_cache
        if _historical_cache and _historical_cache.get("duration") == duration:
            return _historical_cache
            
        try:
            now = datetime.now()
            current_date = now.strftime("%Y-%m-%d")
            start_year = (now.year - 10) if duration == "decade" else (now.year - 1)
            url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={start_year}-01-01&endtime={current_date}&minmagnitude=6.0"
            
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
                features = sorted(features, key=lambda x: x['time'])
                result = {"status": "success", "count": len(features), "data": features, "duration": duration}
                _historical_cache = result
                return result
        except Exception as e:
            return {"error": str(e)}

    # Recent windows (hour, day, week, month) use our filtered Dual Source Loader
    try:
        loader = DualSourceDataLoader()
        df = await loader.load_combined_data(duration)
        
        if len(df) == 0:
            return {"status": "success", "count": 0, "data": []}
            
        features = []
        for _, row in df.iterrows():
            features.append({
                "time": int(row['time'].timestamp() * 1000),
                "place": row['place'],
                "magnitude": row['magnitude'],
                "latitude": row['latitude'],
                "longitude": row['longitude'],
                "depth": row['depth']
            })
            
        # Sort chronologically for the time-lapse player
        features = sorted(features, key=lambda x: x['time'])
        return {"status": "success", "count": len(features), "data": features, "duration": duration}
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
