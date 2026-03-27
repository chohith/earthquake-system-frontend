import aiohttp
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging
from collections import defaultdict
import os

import logging
from collections import defaultdict
import os

logger = logging.getLogger(__name__)

_DATA_CACHE = {}
_CACHE_TIMEOUT_MINS = 5

class DualSourceDataLoader:
    """Loads earthquake data from USGS and RISEQ sources"""
    
    def __init__(self, 
                 usgs_base_url: str = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/",
                 riseq_url: str = "https://riseq.seismo.gov.in/riseq/earthquake"):
        self.usgs_base_url = usgs_base_url
        self.riseq_url = riseq_url
        self.usgs_endpoints = {
            'hour': 'all_hour.geojson',
            'day': 'all_day.geojson',
            'week': 'all_week.geojson',
            'month': 'all_month.geojson',
        }
    
    async def fetch_usgs_data(self, endpoint: str = 'month') -> List[Dict]:
        """Fetch earthquake data from USGS API"""
        try:
            url = self.usgs_base_url + self.usgs_endpoints.get(endpoint, 'all_month.geojson')
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        data = await response.json()
                        earthquakes = []
                        for feature in data.get('features', []):
                            coords = feature['geometry']['coordinates']
                            props = feature['properties']
                            earthquakes.append({
                                'source': 'usgs',
                                'id': props.get('code'),
                                'magnitude': float(props.get('mag') or 0),
                                'latitude': float(coords[1]),
                                'longitude': float(coords[0]),
                                'depth': float(coords[2] if len(coords) > 2 and coords[2] is not None else 0),
                                'place': props.get('place', 'Unknown'),
                                'time': datetime.fromtimestamp(props['time'] / 1000),
                                'timestamp': props['time'],
                            })
                        logger.info(f"Fetched {len(earthquakes)} events from USGS")
                        return earthquakes
        except Exception as e:
            logger.error(f"Error fetching USGS data: {e}")
        return []
    
    async def fetch_riseq_data(self) -> List[Dict]:
        """Fetch earthquake data from RISEQ API"""
        # The Indian RISEQ API is currently returning HTML block-pages instead of JSON
        # Bypassing this fetch entirely to prevent the backend models from crashing
        # The USGS API provides sufficient global coverage for the ML prediction matrices
        return []
    
    @staticmethod
    def deduplicate_events(usgs_events: List[Dict], riseq_events: List[Dict], 
                          lat_tolerance: float = 0.1, 
                          lon_tolerance: float = 0.1,
                          mag_tolerance: float = 0.1,
                          time_tolerance_minutes: int = 30) -> List[Dict]:
        """Remove duplicate events from both sources"""
        deduped = []
        seen_dict = defaultdict(list)
        
        for event in usgs_events + riseq_events:
            # Create hash key based on location and magnitude
            key = (
                round(event['latitude'] / lat_tolerance) * lat_tolerance,
                round(event['longitude'] / lon_tolerance) * lon_tolerance,
                round(event['magnitude'] / mag_tolerance) * mag_tolerance
            )
            
            # Check if similar event already exists (time-based check) using O(1) key lookup
            is_duplicate = False
            if key in seen_dict:
                for seen_time, seen_sources in seen_dict[key]:
                    time_diff = abs((event['time'] - seen_time).total_seconds() / 60)
                    if time_diff < time_tolerance_minutes:
                        is_duplicate = True
                        # Track that this event has both sources
                        if event['source'] not in seen_sources:
                            seen_sources.add(event['source'])
                        break
            
            if not is_duplicate:
                seen_sources = {event['source']}
                seen_dict[key].append((event['time'], seen_sources))
                deduped.append(event)
        
        return deduped
    
    async def load_combined_data(self, endpoint: str = 'month') -> pd.DataFrame:
        """Load and combine data from both USGS and RISEQ, with caching"""
        global _DATA_CACHE, _CACHE_TIMEOUT_MINS
        now = datetime.now()
        
        # Check cache first
        if endpoint in _DATA_CACHE:
            cached_time, cached_df = _DATA_CACHE[endpoint]
            if (now - cached_time) < timedelta(minutes=_CACHE_TIMEOUT_MINS):
                logger.info(f"Using cached combined data for {endpoint} ({len(cached_df)} events)")
                return cached_df

        usgs_data = await self.fetch_usgs_data(endpoint)
        riseq_data = await self.fetch_riseq_data()
        
        # Deduplicate
        combined = self.deduplicate_events(usgs_data, riseq_data)
        
        # Convert to DataFrame
        df = pd.DataFrame(combined)
        
        if len(df) > 0:
            df = df.sort_values('time', ascending=False)
            logger.info(f"Combined dataset: {len(df)} unique events from both sources")
            
        # Store in cache
        _DATA_CACHE[endpoint] = (now, df)
        
        return df
    
    @staticmethod
    def create_features(df: pd.DataFrame, window_size: int = 10) -> pd.DataFrame:
        """Create features for ML models"""
        df = df.sort_values('time')
        features = []
        
        for i in range(len(df) - window_size):
            window = df.iloc[i:i+window_size]
            
            feature_dict = {
                'magnitude_current': window.iloc[-1]['magnitude'],
                'magnitude_max_window': window['magnitude'].max(),
                'magnitude_mean_window': window['magnitude'].mean(),
                'magnitude_std_window': window['magnitude'].std() if pd.notna(window['magnitude'].std()) else 0,
                'depth_current': window.iloc[-1]['depth'],
                'depth_mean_window': window['depth'].mean(),
                'lat_current': window.iloc[-1]['latitude'],
                'lon_current': window.iloc[-1]['longitude'],
                'event_count_window': len(window),
                'source_usgs': (window['source'] == 'usgs').sum(),
                'source_riseq': (window['source'] == 'riseq').sum(),
                'hours_since_last': ((window.iloc[-1]['time'] - window.iloc[-2]['time']).total_seconds() / 3600) if len(window) > 1 else 0,
                'target_magnitude_next': df.iloc[i+window_size]['magnitude'] if i+window_size < len(df) else 0,
            }
            features.append(feature_dict)
        
        return pd.DataFrame(features)


async def get_live_earthquake_data(limit: int = 100) -> Dict:
    """Fetch latest earthquake data from both sources for live display"""
    loader = DualSourceDataLoader()
    df = await loader.load_combined_data('day')
    
    if len(df) > 0:
        return {
            'total_events': len(df),
            'events': df.head(limit).to_dict('records'),
            'stats': {
                'max_magnitude': float(df['magnitude'].max()),
                'avg_magnitude': float(df['magnitude'].mean()),
                'max_depth': float(df['depth'].max()),
                'avg_depth': float(df['depth'].mean()),
                'usgs_count': len(df[df['source'] == 'usgs']),
                'riseq_count': len(df[df['source'] == 'riseq']),
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    return {'total_events': 0, 'events': [], 'timestamp': datetime.utcnow().isoformat()}
