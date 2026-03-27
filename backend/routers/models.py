from fastapi import APIRouter, HTTPException, BackgroundTasks
import logging
from datetime import datetime
from pathlib import Path
import json

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
async def model_status():
    """Get status of all trained models"""
    model_dir = Path("./models")
    
    models_info = {
        "lstm": model_dir / "lstm_model.h5",
        "hybrid_rnn_lstm": model_dir / "hybrid_rnn_lstm_model.pt",
        "transformer": model_dir / "transformer_model.pt",
        "cnn": model_dir / "cnn_model.h5",
        "random_forest": model_dir / "random_forest_model.pkl",
        "xgboost": model_dir / "xgboost_model.json",
        "lightgbm": model_dir / "lightgbm_model.pkl",
    }
    
    status = {}
    for model_name, model_path in models_info.items():
        status[model_name] = {
            "available": model_path.exists() if isinstance(model_path, Path) else False,
            "path": str(model_path)
        }
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "models": status,
        "data_sources": ["usgs", "riseq"]
    }


@router.get("/performance")
async def model_performance():
    """Get performance metrics for all models"""
    try:
        report_path = Path("./models/training_report.json")
        if report_path.exists():
            with open(report_path, 'r') as f:
                report = json.load(f)
            return report
        else:
            return {
                "error": "Training report not found",
                "message": "Run training pipeline first"
            }
    except Exception as e:
        logger.error(f"Error reading performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
async def train_models(background_tasks: BackgroundTasks):
    """Trigger model retraining with latest data"""
    try:
        from training_pipeline import TrainingPipeline
        
        async def run_training():
            pipeline = TrainingPipeline()
            await pipeline.run_full_pipeline()
        
        background_tasks.add_task(run_training)
        
        return {
            "status": "training_started",
            "message": "Models are being retrained with latest USGS + RISEQ data",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error starting training: {e}")
        raise HTTPException(status_code=500, detail=str(e))
