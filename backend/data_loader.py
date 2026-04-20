import asyncio
import aiohttp
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, timezone
import logging
import re
import json
from bs4 import BeautifulSoup
from collections import defaultdict
import os

logger = logging.getLogger(__name__)

# Global state for caching and connection pooling
_DATA_CACHE = {}
_CACHE_TIMEOUT_MINS = 5
_SESSION: Optional[aiohttp.ClientSession] = None

async def get_session():
    """Get or create a persistent aiohttp session with a pool and timeout"""
    global _SESSION
    if _SESSION is None or _SESSION.closed:
        # Strict timeout to prevent hanging on slow sources like RISEQ
        timeout = aiohttp.ClientTimeout(total=10, connect=5, sock_read=8)
        # Use a connector with a decent pool size
        connector = aiohttp.TCPConnector(limit=20, ttl_dns_cache=300)
        _SESSION = aiohttp.ClientSession(timeout=timeout, connector=connector)
    return _SESSION

def extract_indian_state(place: str) -> str:
    """Helper to extract Indian state from place string"""
    INDIAN_STATES = [
        "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
        "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa", 
        "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
        "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
        "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ]
    p_upper = place.upper()
    for state in INDIAN_STATES:
        if state.upper() in p_upper:
            return f"{state}, India"
    return place

class DualSourceDataLoader:
    """Handles high-performance earthquake data fetching from USGS and RISEQ"""
    
    def __init__(self):
        self.usgs_base_url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/"
        self.usgs_endpoints = {
            'hour': 'all_hour.geojson',
            'day': 'all_day.geojson',
            'week': 'all_week.geojson',
            'month': 'all_month.geojson'
        }

    async def fetch_usgs_data(self, endpoint: str = 'month') -> List[Dict]:
        """Fetch earthquake data from USGS API"""
        url = f"{self.usgs_base_url}{self.usgs_endpoints.get(endpoint, 'all_month.geojson')}"
        try:
            session = await get_session()
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    events = []
                    for f in data.get('features', []):
                        props = f.get('properties', {})
                        geom = f.get('geometry', {}).get('coordinates', [0, 0, 0])
                        events.append({
                            'source': 'usgs',
                            'id': f.get('id'),
                            'magnitude': float(props.get('mag') or 0),
                            'latitude': float(geom[1]),
                            'longitude': float(geom[0]),
                            'depth': float(geom[2] if len(geom) > 2 and geom[2] is not None else 0),
                            'place': props.get('place', 'Unknown'),
                            'time': datetime.fromtimestamp(props.get('time', 0) / 1000, tz=timezone.utc),
                            'timestamp': props.get('time')
                        })
                    return events
                logger.error(f"USGS API error: {response.status}")
                return []
        except Exception as e:
            logger.error(f"Error fetching USGS data: {e}")
            return []

    async def fetch_riseq_data(self) -> List[Dict]:
        """Fetch earthquake data from RISEQ API (HTML scraping)"""
        try:
            session = await get_session()
            async with session.get("https://riseq.seismo.gov.in/riseq/earthquake", headers={"User-Agent": "Mozilla/5.0"}) as response:
                if response.status == 200:
                    html = await response.text()
                    # Use built-in html.parser as lxml might not be available in all environments
                    soup = BeautifulSoup(html, 'html.parser')
                    earthquakes = []
                    
                    items = soup.find_all('li', class_='event_list')
                    logger.info(f"RISEQ Scraper: Found {len(items)} list items")
                    
                    for li in items:
                        data_json = li.get('data-json')
                        if data_json:
                            try:
                                data = json.loads(data_json)
                                lat_long = data.get('lat_long', '')
                                coords = [float(x.strip()) for x in lat_long.split(',')] if lat_long else [0, 0]
                                mag_match = re.search(r'M:\s*([\d.]+)', data.get('magnitude_depth', ''))
                                mag = float(mag_match.group(1)) if mag_match else 0
                                depth_match = re.search(r'D:\s*([\d.]+)km', data.get('magnitude_depth', ''))
                                depth = float(depth_match.group(1)) if depth_match else 0
                                
                                date_str = data.get('origin_time', '').replace(' IST', '')
                                try:
                                    local_time = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=None)
                                    utc_time = (local_time - timedelta(hours=5, minutes=30)).replace(tzinfo=timezone.utc)
                                except:
                                    utc_time = datetime.now(timezone.utc)
                                
                                # Clean place name (remove "M: 5.2 - " prefix)
                                raw_place = data.get('event_name', 'India Region')
                                clean_place = raw_place.split(' - ')[-1].strip() if ' - ' in raw_place else raw_place
                                    
                                earthquakes.append({
                                    'source': 'riseq',
                                    'id': data.get('event_id', ''),
                                    'magnitude': mag,
                                    'latitude': coords[0],
                                    'longitude': coords[1],
                                    'depth': depth,
                                    'place': clean_place,
                                    'time': utc_time,
                                    'timestamp': int(utc_time.timestamp() * 1000)
                                })
                            except Exception as parse_e:
                                logger.error(f"RISEQ Parse Error: {parse_e}")
                                continue
                    
                    logger.info(f"RISEQ Scraper: Successfully parsed {len(earthquakes)} earthquakes")
                    return earthquakes
                logger.warning(f"RISEQ Fetch Failed: HTTP {response.status}")
                return []
        except Exception as e:
            logger.error(f"Error fetching RISEQ data: {e}")
            return []

    def deduplicate_events(self, usgs_events: List[Dict], riseq_events: List[Dict], 
                         lat_tolerance=0.1, lon_tolerance=0.1, mag_tolerance=0.1) -> pd.DataFrame:
        """Merge and deduplicate events from both sources using spatial hashing"""
        if not usgs_events and not riseq_events:
            return pd.DataFrame()
            
        all_events = usgs_events + riseq_events
        if not all_events: return pd.DataFrame()
        
        seen_keys = {}
        unique_events = []
        
        # Sort by time to keep most recent or first reported
        all_events.sort(key=lambda x: x['time'], reverse=True)
        
        for event in all_events:
            # Spatial + Magnitude hash key
            key = (
                round(event['latitude'] / lat_tolerance),
                round(event['longitude'] / lon_tolerance),
                round(event['magnitude'] / mag_tolerance)
            )
            
            # Simple temporal check (30 min window)
            if key in seen_keys:
                existing_time = seen_keys[key]
                if abs((event['time'] - existing_time).total_seconds()) < 1800:
                    continue
            
            seen_keys[key] = event['time']
            unique_events.append(event)
            
        return pd.DataFrame(unique_events)

    async def load_combined_data(self, endpoint: str = 'month') -> pd.DataFrame:
        """Load and combine data with parallel fetching and caching"""
        global _DATA_CACHE, _CACHE_TIMEOUT_MINS
        now = datetime.now(timezone.utc)
        
        if endpoint in _DATA_CACHE:
            cached_time, cached_df = _DATA_CACHE[endpoint]
            if (now - cached_time) < timedelta(minutes=_CACHE_TIMEOUT_MINS):
                return cached_df

        # Parallel fetch for ultra-speed
        usgs_task = self.fetch_usgs_data(endpoint)
        riseq_task = self.fetch_riseq_data()
        
        usgs_data, riseq_data = await asyncio.gather(usgs_task, riseq_task)
        df = self.deduplicate_events(usgs_data, riseq_data)
        
        if not df.empty:
            # Optimized vectorized processing
            # 6 <= lat <= 38 and 68 <= lon <= 98 is India bounding box
            is_in_india = (df['latitude'] >= 6) & (df['latitude'] <= 38) & \
                         (df['longitude'] >= 68) & (df['longitude'] <= 98)
                         
            is_india_name = df['place'].str.contains('INDIA', case=False, na=False) & \
                           ~df['place'].str.contains('Mid|Ridge|Ocean|Indiana', case=False, na=False)
            
            india_mask = (df['source'] == 'riseq') | (is_in_india & ~df['place'].str.contains('Mid|Ridge|Ocean|Indiana', case=False, na=False)) | is_india_name
            
            if india_mask.any():
                df.loc[india_mask, 'place'] = df.loc[india_mask, 'place'].apply(extract_indian_state)
                # Force append 'India' if not already present
                df.loc[india_mask, 'place'] = df.loc[india_mask, 'place'].apply(lambda x: x if 'INDIA' in x.upper() else f"{x}, India")
                df.loc[india_mask, 'region'] = 'India'
            
            # Strict time filtering based on requested duration
            cutoff = None
            if endpoint == 'hour': cutoff = now - timedelta(hours=1)
            elif endpoint == 'day': cutoff = now - timedelta(days=1)
            elif endpoint == 'week': cutoff = now - timedelta(weeks=1)
            elif endpoint == 'month': cutoff = now - timedelta(days=30)
            
            if cutoff:
                # Ensure cutoff is UTC-aware to match df['time']
                cutoff = cutoff.replace(tzinfo=timezone.utc)
                df = df[df['time'] >= cutoff]

            df = df.sort_values('time', ascending=False)
            _DATA_CACHE[endpoint] = (now, df)
            
        return df

async def get_live_earthquake_data(limit: int = 100) -> Dict:
    """High-level wrapper for live data display"""
    loader = DualSourceDataLoader()
    df = await loader.load_combined_data('day')
    
    if df.empty:
        return {"total_events": 0, "events": [], "stats": {}, "timestamp": datetime.now().isoformat()}
        
    events = df.head(limit).to_dict('records')
    # Use pandas vectorization for stats
    stats = {
        "max_magnitude": float(df['magnitude'].max()),
        "avg_magnitude": float(df['magnitude'].mean()),
        "max_depth": float(df['depth'].max()),
        "avg_depth": float(df['depth'].mean()),
        "usgs_count": int(len(df[df['source'] == 'usgs'])),
        "riseq_count": int(len(df[df['source'] == 'riseq']))
    }
    
    return {
        "total_events": len(df),
        "events": events,
        "stats": stats,
        "timestamp": datetime.now().isoformat()
    }
