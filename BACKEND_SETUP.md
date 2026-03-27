# Earthquake ML Backend Setup Guide

## Overview
Real machine learning system for earthquake prediction using 6 trained models (LSTM, Hybrid RNN-LSTM, Transformer, CNN, Random Forest, XGBoost/LightGBM) trained on dual-source earthquake data (USGS + RISEQ).

## Architecture

```
Frontend (Next.js 16)
         ↓
API Routes (/app/api/ml/*)
         ↓
Backend Client (/lib/ml-backend-client.ts)
         ↓
Python Backend (FastAPI)
         ↓
Data Sources (USGS + RISEQ APIs)
         ↓
Trained Models (/backend/models/)
```

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy and edit `.env.example`:
```bash
cp .env.example .env
```

Key environment variables:
- `BACKEND_PORT=8000`
- `USGS_API_URL=https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/`
- `RISEQ_API_URL=https://riseq.seismo.gov.in/riseq/earthquake`
- `MODEL_SAVE_DIR=./models`

### 3. Configure Frontend

Add to `.env.local`:
```
NEXT_PUBLIC_ML_BACKEND_URL=https://chohith-earthquake-prediction-system.hf.space
ML_BACKEND_URL=https://chohith-earthquake-prediction-system.hf.space
```

## Training Models

### Run Complete Training Pipeline

```bash
cd backend
python training_pipeline.py
```

This will:
1. Fetch earthquake data from USGS and RISEQ
2. Deduplicate overlapping events
3. Create features and split data
4. Train all 6 models
5. Evaluate and compare performance
6. Save trained models to `/backend/models/`
7. Generate `training_report.json`

### Expected Training Time
- Total: ~15-30 minutes (depends on data size and hardware)
- USGS fetch: ~2-3 minutes
- RISEQ fetch: ~1-2 minutes
- Model training: ~10-20 minutes

### Training Output

```
backend/models/
├── lstm_model.h5                      # TensorFlow LSTM
├── hybrid_rnn_lstm_model.pt           # PyTorch Hybrid RNN-LSTM
├── transformer_model.pt               # PyTorch Transformer
├── cnn_model.h5                       # TensorFlow CNN
├── random_forest_model.pkl            # Scikit-learn Random Forest
├── xgboost_model.json                 # XGBoost model
├── lightgbm_model.pkl                 # LightGBM model
└── training_report.json               # Performance metrics
```

## Running Backend Server

### Start Development Server

```bash
cd backend
python main.py
```

Server will start at `http://localhost:8000`

### API Endpoints

#### Health Check
```
GET /health
GET /ready
```

#### Predictions
```
POST /api/predictions/magnitude
POST /api/predictions/location
GET /api/predictions/probability
```

#### Models
```
GET /api/models/status
GET /api/models/performance
POST /api/models/train (trigger retraining)
```

#### Data
```
GET /api/data/live-earthquakes
GET /api/data/statistics
```

## Model Details

### 1. LSTM (Long Short-Term Memory)
- **Framework**: TensorFlow/Keras
- **File**: `lstm_model.h5`
- **Use**: Time-series earthquake magnitude prediction
- **Architecture**: 3 LSTM layers with dropout

### 2. Hybrid RNN-LSTM
- **Framework**: PyTorch
- **File**: `hybrid_rnn_lstm_model.pt`
- **Use**: Bidirectional sequence modeling
- **Architecture**: RNN + LSTM combination

### 3. Transformer
- **Framework**: PyTorch
- **File**: `transformer_model.pt`
- **Use**: Attention-based sequence prediction
- **Architecture**: Multi-head self-attention layers

### 4. CNN (Convolutional Neural Networks)
- **Framework**: TensorFlow/Keras
- **File**: `cnn_model.h5`
- **Use**: Spatial pattern detection in earthquake data
- **Architecture**: 2 Conv1D layers with max pooling

### 5. Random Forest
- **Framework**: Scikit-learn
- **File**: `random_forest_model.pkl`
- **Use**: Feature importance analysis
- **Architecture**: 100 decision trees, max depth 20

### 6. XGBoost + LightGBM
- **Framework**: XGBoost, LightGBM
- **Files**: `xgboost_model.json`, `lightgbm_model.pkl`
- **Use**: Gradient boosting ensemble predictions
- **Architecture**: 100 boosting rounds, depth 6

## Data Sources

### USGS (US Geological Survey)
- **URL**: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/
- **Endpoints**: 
  - `all_hour.geojson` - Last hour
  - `all_day.geojson` - Last 24 hours
  - `all_week.geojson` - Last 7 days
  - `all_month.geojson` - Last 30 days
- **Coverage**: Global
- **Update Frequency**: Real-time

### RISEQ (Regional Seismic Network - India)
- **URL**: https://riseq.seismo.gov.in/riseq/earthquake
- **Coverage**: Indian subcontinent and nearby regions
- **Update Frequency**: Real-time
- **High Resolution**: Local epicenter data

### Deduplication
Events are deduplicated if they match:
- Latitude within ±0.1°
- Longitude within ±0.1°
- Magnitude within ±0.1
- Time within ±30 minutes

## Feature Engineering

Training features created from each 10-event window:
- `magnitude_current`: Current event magnitude
- `magnitude_max_window`: Max magnitude in window
- `magnitude_mean_window`: Average magnitude
- `magnitude_std_window`: Magnitude std deviation
- `depth_current`: Current event depth
- `depth_mean_window`: Average depth
- `lat_current`, `lon_current`: Current coordinates
- `event_count_window`: Events in window
- `source_usgs`, `source_riseq`: Count by source
- `hours_since_last`: Time since last event

## Performance Metrics

Calculated for each model:
- **MSE** (Mean Squared Error): Lower is better
- **RMSE** (Root Mean Squared Error): Primary metric
- **MAE** (Mean Absolute Error): Average prediction error
- **R²** (Coefficient of Determination): Goodness of fit (0-1)

## Auto-Retraining

To enable automatic weekly retraining:

```bash
# Create cron job (Linux/Mac)
0 2 * * 0 cd /path/to/backend && python training_pipeline.py

# On Windows, use Task Scheduler
# Or use the POST /api/models/train endpoint
```

## Troubleshooting

### USGS API Unavailable
- Fallback to cached data
- Check: https://earthquake.usgs.gov/earthquakes/feed/

### RISEQ API Unavailable
- System continues with USGS data only
- Check: https://riseq.seismo.gov.in/

### Model Not Found
- Run training pipeline first
- Verify `MODEL_SAVE_DIR` exists
- Check file permissions

### GPU Issues
- PyTorch models will auto-fallback to CPU
- For GPU: Install CUDA and `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - BACKEND_PORT=8000
      - ML_BACKEND_URL=http://backend:8000
```

## Monitoring

Check health and readiness:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Check model status:

```bash
curl http://localhost:8000/api/models/status
```

## Integration with Frontend

Frontend calls backend via:
- `/api/ml/predictions` - Magnitude predictions
- `/api/ml/earthquakes/live` - Live earthquake data
- `/api/ml/models/status` - Model information

See `/lib/ml-backend-client.ts` for client implementation.

## Next Steps

1. Run training pipeline to generate trained models
2. Start backend server
3. Verify frontend can connect via health endpoints
4. Deploy to production with Docker
5. Set up auto-retraining schedule
6. Monitor model performance metrics weekly
