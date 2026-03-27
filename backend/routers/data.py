from fastapi import APIRouter
import logging
from data_loader import get_live_earthquake_data, DualSourceDataLoader

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/live-earthquakes")
async def get_live_earthquakes(limit: int = 100):
    """Get latest earthquake data from USGS and RISEQ sources"""
    try:
        data = await get_live_earthquake_data(limit)
        return data
    except Exception as e:
        logger.error(f"Error fetching live earthquakes: {e}")
        return {
            "total_events": 0,
            "events": [],
            "error": str(e),
            "timestamp": None
        }


@router.get("/statistics")
async def get_statistics():
    """Get earthquake statistics from dual sources"""
    try:
        loader = DualSourceDataLoader()
        df = await loader.load_combined_data('month')
        
        if len(df) == 0:
            return {"error": "No data available"}
        
        return {
            "total_events": len(df),
            "magnitude_stats": {
                "min": float(df['magnitude'].min()),
                "max": float(df['magnitude'].max()),
                "mean": float(df['magnitude'].mean()),
                "median": float(df['magnitude'].median()),
                "std": float(df['magnitude'].std())
            },
            "depth_stats": {
                "min": float(df['depth'].min()),
                "max": float(df['depth'].max()),
                "mean": float(df['depth'].mean()),
                "median": float(df['depth'].median())
            },
            "source_breakdown": {
                "usgs": int(len(df[df['source'] == 'usgs'])),
                "riseq": int(len(df[df['source'] == 'riseq']))
            },
            "time_range": {
                "earliest": df['time'].min().isoformat(),
                "latest": df['time'].max().isoformat()
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating statistics: {e}")
        return {"error": str(e)}
