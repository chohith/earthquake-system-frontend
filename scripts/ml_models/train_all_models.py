"""
Master Training Script for All ML Models
Trains all 6 models individually and as an ensemble
"""

import sys
import os
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lstm_model import LSTMEarthquakeModel
from hybrid_rnn_lstm_model import HybridRNNLSTMModel
from transformer_model import TransformerEarthquakeModel
from cnn_model import CNNEarthquakeModel
from random_forest_model import RandomForestEarthquakeModel
from ensemble_pipeline import EnsembleEarthquakePredictor

try:
    from xgboost_lightgbm_model import XGBoostEarthquakeModel, LightGBMEarthquakeModel
    HAS_GRADIENT_BOOST = True
except ImportError:
    HAS_GRADIENT_BOOST = False
    print("[v0] Warning: XGBoost/LightGBM not available")


def generate_synthetic_data(n_samples=1000, random_state=42):
    """Generate synthetic earthquake data for training"""
    np.random.seed(random_state)
    
    print("[v0] Generating synthetic earthquake training data...")
    
    # Sequence data for deep learning models
    sequence_length = 30
    n_features = 5
    
    X_sequence = np.random.randn(n_samples, sequence_length, n_features) * 10 + \
                 np.array([5, 50, 35, 90, 1000])
    
    # Targets
    y = np.random.randn(n_samples, 1) * 0.5 + 5
    
    # Flatten for traditional ML models
    X_flat = X_sequence.reshape(n_samples, -1)
    
    print(f"[v0] Generated {n_samples} samples")
    print(f"[v0] Sequence shape: {X_sequence.shape}")
    print(f"[v0] Target shape: {y.shape}\n")
    
    return X_sequence, X_flat, y


def train_individual_models(X_train_seq, X_train_flat, y_train, X_val_seq, X_val_flat, 
                            y_val, X_test_seq, X_test_flat, y_test):
    """Train all 6 individual models"""
    print("\n" + "=" * 80)
    print("TRAINING INDIVIDUAL MODELS")
    print("=" * 80 + "\n")
    
    results = {}
    
    # 1. LSTM Model
    print("[v0] 1. Training LSTM Model...")
    try:
        lstm_model = LSTMEarthquakeModel(sequence_length=30, predict_steps=1)
        lstm_model.train(X_train_seq, y_train, X_val_seq, y_val, 
                        epochs=30, batch_size=32, verbose=0)
        lstm_metrics = lstm_model.evaluate(X_test_seq, y_test)
        results['lstm'] = lstm_metrics
        print("[v0] LSTM training completed.\n")
    except Exception as e:
        print(f"[v0] Error training LSTM: {e}\n")
    
    # 2. Hybrid RNN-LSTM Model
    print("[v0] 2. Training Hybrid RNN-LSTM Model...")
    try:
        hybrid_model = HybridRNNLSTMModel(sequence_length=30, predict_steps=1)
        hybrid_model.train(X_train_seq, y_train, X_val_seq, y_val, 
                          epochs=30, batch_size=32, verbose=0)
        hybrid_metrics = hybrid_model.evaluate(X_test_seq, y_test)
        results['hybrid_rnn_lstm'] = hybrid_metrics
        print("[v0] Hybrid RNN-LSTM training completed.\n")
    except Exception as e:
        print(f"[v0] Error training Hybrid RNN-LSTM: {e}\n")
    
    # 3. Transformer Model
    print("[v0] 3. Training Transformer Model...")
    try:
        transformer_model = TransformerEarthquakeModel(sequence_length=30, predict_steps=1)
        transformer_model.train(X_train_seq, y_train, X_val_seq, y_val, 
                               epochs=30, batch_size=32, verbose=0)
        transformer_metrics = transformer_model.evaluate(X_test_seq, y_test)
        results['transformer'] = transformer_metrics
        print("[v0] Transformer training completed.\n")
    except Exception as e:
        print(f"[v0] Error training Transformer: {e}\n")
    
    # 4. CNN Model
    print("[v0] 4. Training CNN Model...")
    try:
        cnn_model = CNNEarthquakeModel(sequence_length=30, predict_steps=1)
        cnn_model.train(X_train_seq, y_train, X_val_seq, y_val, 
                       epochs=30, batch_size=32, verbose=0)
        cnn_metrics = cnn_model.evaluate(X_test_seq, y_test)
        results['cnn'] = cnn_metrics
        print("[v0] CNN training completed.\n")
    except Exception as e:
        print(f"[v0] Error training CNN: {e}\n")
    
    # 5. Random Forest Model
    print("[v0] 5. Training Random Forest Model...")
    try:
        rf_model = RandomForestEarthquakeModel(n_estimators=100, max_depth=15)
        rf_model.train(X_train_flat, y_train, X_val_flat, y_val, verbose=0)
        rf_metrics = rf_model.evaluate(X_test_flat, y_test)
        results['random_forest'] = rf_metrics
        print("[v0] Random Forest training completed.\n")
    except Exception as e:
        print(f"[v0] Error training Random Forest: {e}\n")
    
    # 6. XGBoost/LightGBM Models
    if HAS_GRADIENT_BOOST:
        print("[v0] 6. Training XGBoost Model...")
        try:
            xgb_model = XGBoostEarthquakeModel(n_estimators=100)
            xgb_model.train(X_train_flat, y_train, X_val_flat, y_val, verbose=0)
            xgb_metrics = xgb_model.evaluate(X_test_flat, y_test)
            results['xgboost'] = xgb_metrics
            print("[v0] XGBoost training completed.\n")
        except Exception as e:
            print(f"[v0] Error training XGBoost: {e}\n")
        
        print("[v0] 7. Training LightGBM Model...")
        try:
            lgb_model = LightGBMEarthquakeModel(n_estimators=100)
            lgb_model.train(X_train_flat, y_train, X_val_flat, y_val, verbose=0)
            lgb_metrics = lgb_model.evaluate(X_test_flat, y_test)
            results['lightgbm'] = lgb_metrics
            print("[v0] LightGBM training completed.\n")
        except Exception as e:
            print(f"[v0] Error training LightGBM: {e}\n")
    
    return results


def print_comparison_report(individual_results):
    """Print comparison report for all models"""
    print("\n" + "=" * 80)
    print("INDIVIDUAL MODEL PERFORMANCE COMPARISON")
    print("=" * 80)
    
    print("\n{:<20} {:<12} {:<12} {:<12} {:<12}".format(
        "Model", "MSE", "RMSE", "MAE", "R² Score"
    ))
    print("-" * 80)
    
    for model_name, metrics in sorted(individual_results.items()):
        print("{:<20} {:<12.4f} {:<12.4f} {:<12.4f} {:<12.4f}".format(
            model_name,
            metrics['mse'],
            metrics['rmse'],
            metrics['mae'],
            metrics['r2']
        ))
    
    print("-" * 80)
    
    if individual_results:
        best_model = max(individual_results.items(), key=lambda x: x[1]['r2'])
        print(f"\nBest Model: {best_model[0].upper()} (R² = {best_model[1]['r2']:.4f})")
    print("=" * 80)


def main():
    """Main execution function"""
    print("\n" + "=" * 80)
    print("EARTHQUAKE PREDICTION - ML TRAINING SYSTEM")
    print("=" * 80)
    
    # Generate data
    X_seq, X_flat, y = generate_synthetic_data(n_samples=600, random_state=42)
    
    # Split data
    train_idx = int(0.6 * len(X_seq))
    val_idx = int(0.8 * len(X_seq))
    
    X_train_seq = X_seq[:train_idx]
    X_train_flat = X_flat[:train_idx]
    y_train = y[:train_idx]
    
    X_val_seq = X_seq[train_idx:val_idx]
    X_val_flat = X_flat[train_idx:val_idx]
    y_val = y[train_idx:val_idx]
    
    X_test_seq = X_seq[val_idx:]
    X_test_flat = X_flat[val_idx:]
    y_test = y[val_idx:]
    
    # Train individual models
    individual_results = train_individual_models(
        X_train_seq, X_train_flat, y_train,
        X_val_seq, X_val_flat, y_val,
        X_test_seq, X_test_flat, y_test
    )
    
    # Print comparison
    print_comparison_report(individual_results)
    
    # Train ensemble
    print("\n" + "=" * 80)
    print("TRAINING ENSEMBLE MODEL")
    print("=" * 80 + "\n")
    
    ensemble = EnsembleEarthquakePredictor(ensemble_method='weighted_average')
    ensemble.train(X_train_seq, y_train, X_val_seq, y_val, epochs=30, verbose=0)
    
    # Evaluate ensemble
    print("[v0] Evaluating ensemble model...")
    ensemble_metrics = ensemble.evaluate(X_test_seq, y_test)
    
    # Final report
    print("\n" + "=" * 80)
    print("FINAL TRAINING SUMMARY")
    print("=" * 80)
    print(f"\nIndividual Models Trained: {len(individual_results)}")
    print("Ensemble Method: Weighted Average")
    print(f"Ensemble R² Score: {ensemble_metrics['r2']:.4f}")
    print(f"Ensemble RMSE: {ensemble_metrics['rmse']:.4f}")
    
    if individual_results:
        best_individual = max(individual_results.items(), key=lambda x: x[1]['r2'])
        improvement = ((ensemble_metrics['r2'] - best_individual[1]['r2']) / 
                      abs(best_individual[1]['r2'] + 0.0001) * 100)
        
        print(f"\nBest Individual: {best_individual[0].upper()}")
        print(f"Individual R²: {best_individual[1]['r2']:.4f}")
        print(f"Ensemble Improvement: {improvement:+.2f}%")
    
    print("\n[v0] Training completed successfully!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
