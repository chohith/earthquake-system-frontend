from fastapi import APIRouter
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Earthquake ML Backend",
        "version": "1.0.0"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes"""
    return {
        "ready": True,
        "timestamp": datetime.utcnow().isoformat()
    }
