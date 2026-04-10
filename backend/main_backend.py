from models.model_loader import load_models
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import predictions
import os
import logging
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Import routers
from routers import predictions, models, data, health, data_feed

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Earthquake ML Backend Server")
    logger.info("USGS API URL: " + os.getenv('USGS_API_URL', 'Not configured'))
    logger.info("RISEQ API URL: " + os.getenv('RISEQ_API_URL', 'Not configured'))
    load_models() 
    yield
    # Shutdown
    logger.info("Shutting down Earthquake ML Backend Server")

# Create FastAPI app
app = FastAPI(
    title="Earthquake ML Prediction System",
    description="Real-time earthquake prediction using dual-source data (USGS + RISEQ)",
    version="1.0.0",
    lifespan=lifespan
)


from fastapi import Request
from fastapi.responses import JSONResponse

# Configure CORS headers forcefully to bypass V0 local browser fetching network barriers
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    # Handle preflight OPTIONS requests directly
    if request.method == "OPTIONS":
        response = JSONResponse(content="OK")
    else:
        response = await call_next(request)
        
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "*"
    # CRITICAL: This allows public websites (like v0.app) to request localhost on modern Chrome!
    response.headers["Access-Control-Allow-Private-Network"] = "true" 
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(models.router, prefix="/api/models", tags=["Models"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(data_feed.router, prefix="/api/data_feed", tags=["Data Feed"])

@app.on_event("startup")
def startup_event():
    load_models()


# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Earthquake ML Prediction System",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "predictions": "/api/predictions",
            "models": "/api/models",
            "data": "/api/data"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('BACKEND_PORT', 8000))
    host = os.getenv('BACKEND_HOST', '0.0.0.0')
    uvicorn.run(app, host=host, port=port)
