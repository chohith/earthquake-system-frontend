# Earthquake Prediction ML System - Complete Documentation

## Project Overview

A comprehensive machine learning system for earthquake prediction that combines six different models (LSTM, Hybrid RNN-LSTM, Transformer, CNN, Random Forest, XGBoost/LightGBM) into an intelligent ensemble for robust earthquake magnitude and occurrence predictions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Earthquake Data Sources (USGS + RISEQ)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│        Data Preprocessing & Feature Engineering             │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │   Six ML Models in Parallel         │
        ├─────────────────────────────────────┤
        │ • LSTM                              │
        │ • Hybrid RNN-LSTM                   │
        │ • Transformer                       │
        │ • CNN                               │
        │ • Random Forest                     │
        │ • XGBoost/LightGBM                  │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │     Ensemble Pipeline               │
        │  (Weighted Average / Median / Voting)
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │   Predictions & Confidence Scores   │
        │   Trend Analysis & Risk Assessment  │
        └─────────────────────────────────────┘
```

## File Structure

```
scripts/ml_models/
├── lstm_model.py                 # LSTM implementation
├── hybrid_rnn_lstm_model.py      # Hybrid RNN-LSTM implementation
├── transformer_model.py           # Transformer implementation
├── cnn_model.py                   # CNN implementation
├── random_forest_model.py         # Random Forest implementation
├── xgboost_lightgbm_model.py      # XGBoost/LightGBM implementation
├── ensemble_pipeline.py           # Ensemble combining all 6 models
├── model_evaluation.py            # Evaluation framework & metrics
├── train_all_models.py           # Master training script
├── realtime_predictor.py         # Real-time prediction system
├── batch_predictor.py            # Batch prediction processor
└── README.md                      # ML system documentation
```

## API Updates

### Earthquake Data Endpoints

**File: `app/api/earthquake-data/24hours/route.ts`**
- Now fetches from both USGS and RISEQ
- Returns earthquake data from last 24 hours
- Includes source breakdown metrics

**File: `app/api/earthquake-data/live-2026/route.ts`**
- Updated to use RISEQ as secondary source
- Returns aggregated 2026 earthquake data
- Supports multiple data formats from RISEQ

### Frontend Updates

**File: `components/recent-activity-section.tsx`**
- Updated data source attribution to show RISEQ
- Displays earthquake data from both USGS and RISEQ sources

## Models Overview

### 1. LSTM (Long Short-Term Memory)
- **Architecture**: Multi-layer LSTM with dropout
- **Input**: Sequence of earthquake features (30 time steps)
- **Output**: Predicted earthquake magnitude
- **Strengths**: Excellent for capturing long-term temporal patterns
- **Training**: 50 epochs, batch size 32

### 2. Hybrid RNN-LSTM
- **Architecture**: Bidirectional SimpleRNN → Bidirectional LSTM → Dense layers
- **Advantages**: Combines fast RNN processing with LSTM's memory
- **Best for**: Complex temporal dependencies
- **Parameters**: 256K+ trainable parameters

### 3. Transformer
- **Architecture**: Multi-head self-attention with feed-forward networks
- **Key Feature**: Parallel processing without sequential dependency
- **Attention Heads**: 4
- **Model Dimension**: 64

### 4. CNN (Convolutional Neural Networks)
- **Architecture**: Multiple Conv1D layers with MaxPooling
- **Strengths**: Efficient spatial pattern extraction
- **Layers**: 3 convolutional blocks with progressive feature extraction
- **Best for**: Extracting local patterns from earthquake sequences

### 5. Random Forest
- **Configuration**: 100 decision trees, max depth 15
- **Feature Importance**: Provides ranking of influential features
- **Advantage**: No scaling required, robust to outliers
- **Training**: Fast parallel training

### 6. XGBoost/LightGBM
- **Type**: Advanced gradient boosting algorithms
- **Regularization**: L1/L2 regularization included
- **Speed**: Faster than traditional boosting methods
- **Features**: Built-in feature importance, early stopping

## Ensemble Methods

The system supports three ensemble combination methods:

1. **Weighted Average** (Recommended)
   - Assigns custom weights to each model
   - Typically 5-15% improvement over best individual model
   - Default weights: Equal for all models

2. **Median Ensemble**
   - Takes median prediction across all models
   - Robust to outlier predictions
   - Conservative approach

3. **Voting (Simple Average)**
   - Averages all model predictions equally
   - Fast computation
   - Baseline approach

## Training Pipeline

### Data Preparation
```python
# Generate or load earthquake data
X_sequence: (n_samples, 30, 5)  # 30 time steps, 5 features
y_targets: (n_samples, 1)        # Earthquake magnitude

# Split into train/validation/test
train_idx = 0.6 * n_samples
val_idx = 0.8 * n_samples
```

### Model Training
Each model trains independently on the same data with early stopping and learning rate scheduling.

### Ensemble Assembly
All trained models combine their predictions using weighted averaging.

## Usage Examples

### Train All Models
```bash
python scripts/ml_models/train_all_models.py
```

### Train Individual Model
```python
from lstm_model import LSTMEarthquakeModel

model = LSTMEarthquakeModel(sequence_length=30, predict_steps=1)
model.train(X_train, y_train, X_val, y_val, epochs=100)
predictions = model.predict(X_test)
metrics = model.evaluate(X_test, y_test)
```

### Use Ensemble
```python
from ensemble_pipeline import EnsembleEarthquakePredictor

ensemble = EnsembleEarthquakePredictor(ensemble_method='weighted_average')
ensemble.train(X_train, y_train, X_val, y_val, epochs=50)
predictions = ensemble.predict(X_test)
metrics = ensemble.evaluate(X_test, y_test)
```

### Real-Time Prediction
```bash
python scripts/ml_models/realtime_predictor.py
```

### Batch Processing
```bash
python scripts/ml_models/batch_predictor.py
```

## Performance Metrics

All models report:
- **MSE**: Mean Squared Error
- **RMSE**: Root Mean Squared Error  
- **MAE**: Mean Absolute Error
- **R² Score**: Coefficient of determination (0-1)
- **MAPE**: Mean Absolute Percentage Error
- **Confidence Intervals**: 95% CI for predictions

## Feature Engineering

Input features for each earthquake event:
1. **Magnitude**: Earthquake strength (1-9 scale)
2. **Depth**: Distance below surface (km)
3. **Latitude**: Geographic latitude coordinate
4. **Longitude**: Geographic longitude coordinate
5. **Pressure/Stress**: Derived seismic stress indicator

Additional features generated:
- Temporal sequences (30-step lookback)
- Normalized features (mean=0, std=1)
- Derived features (e.g., sin(latitude) for spherical coordinates)

## Data Integration

### USGS Data
- **URL**: earthquake.usgs.gov/earthquakes/feed/
- **Update Frequency**: Real-time
- **Format**: GeoJSON
- **Coverage**: Global

### RISEQ Data
- **URL**: riseq.seismo.gov.in/riseq/earthquake
- **Coverage**: India/South Asia region
- **Format**: Multiple formats supported
- **Advantage**: Regional detail for earthquake-prone areas

## Deployment Considerations

1. **Hardware Requirements**
   - CPU: 4+ cores for parallel model training
   - RAM: 8GB+ for large datasets
   - GPU: Optional, significantly speeds up deep learning models

2. **Dependencies**
   ```bash
   numpy==1.24.0
   scikit-learn==1.3.0
   tensorflow==2.13.0
   pandas==2.0.0
   xgboost==1.7.0
   lightgbm==4.0.0
   ```

3. **Model Persistence**
   - Save trained models as pickle or TensorFlow SavedModel format
   - Store model weights separately for versioning
   - Implement model registry for deployment tracking

4. **Monitoring**
   - Track prediction accuracy over time
   - Monitor data quality and completeness
   - Alert on unusual model predictions
   - Log all predictions for audit trail

## Advanced Features

### Cross-Validation
```python
from model_evaluation import CrossValidationEvaluator

cv_eval = CrossValidationEvaluator(model, 'lstm', n_splits=5)
cv_results = cv_eval.evaluate_with_cv(X, y)
```

### Model Comparison
```python
from model_evaluation import EnsembleEvaluator

evaluator = EnsembleEvaluator(models_dict)
results = evaluator.evaluate_all(X_test, y_test)
report = evaluator.create_comparison_report()
```

### Prediction Analysis
```python
from model_evaluation import PredictionAnalyzer

PredictionAnalyzer.analyze_predictions(y_true, y_pred, 'LSTM')
outliers = PredictionAnalyzer.identify_outlier_predictions(y_true, y_pred)
```

## Future Enhancements

1. **Online Learning**: Continuously update models with new data
2. **Hyperparameter Optimization**: Bayesian optimization for tuning
3. **Uncertainty Quantification**: Probabilistic predictions
4. **Federated Learning**: Train on distributed earthquake networks
5. **Transfer Learning**: Pre-trained models from global data
6. **Explainability**: SHAP values for prediction interpretation
7. **A/B Testing**: Compare model versions in production
8. **Auto-scaling**: Dynamic ensemble sizing based on data volume

## Troubleshooting

### Out of Memory
- Reduce batch size
- Use data generators for large datasets
- Enable GPU acceleration

### Poor Model Performance
- Check data quality and normalization
- Verify feature engineering
- Increase training epochs
- Adjust hyperparameters
- Ensure train/test split isn't leaking data

### Slow Training
- Enable GPU acceleration
- Use parallel processing for Random Forest
- Reduce sequence length or feature count
- Use lighter models (Random Forest vs Deep Learning)

## References

- [TensorFlow Documentation](https://www.tensorflow.org/api_docs)
- [Scikit-learn Guide](https://scikit-learn.org/stable/)
- [USGS Earthquake API](https://earthquake.usgs.gov/earthquakes/feed/v1.0/)
- [XGBoost Tutorial](https://xgboost.readthedocs.io/)
- [Transformer Architecture](https://arxiv.org/abs/1706.03762)
- [Ensemble Methods](https://scikit-learn.org/stable/modules/ensemble.html)

## License & Attribution

This ML system is designed for research and educational purposes. Earthquake data comes from USGS (public domain) and RISEQ (institutional data).

## Contact & Support

For issues, questions, or contributions, refer to the project documentation and comment examples in each model file.

---

**Last Updated**: 2026-02-25  
**Version**: 1.0.0  
**Status**: Production Ready
