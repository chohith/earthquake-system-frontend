"""
Ensemble Pipeline combining all 6 ML models
- LSTM
- Hybrid RNN-LSTM
- Transformer
- CNN
- Random Forest
- XGBoost/LightGBM
"""

import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# Import model classes
from lstm_model import LSTMEarthquakeModel
from hybrid_rnn_lstm_model import HybridRNNLSTMModel
from transformer_model import TransformerEarthquakeModel
from cnn_model import CNNEarthquakeModel
from random_forest_model import RandomForestEarthquakeModel

try:
    from xgboost_lightgbm_model import XGBoostEarthquakeModel, LightGBMEarthquakeModel
    HAS_GRADIENT_BOOST = True
except ImportError:
    HAS_GRADIENT_BOOST = False


class EnsembleEarthquakePredictor:
    """
    Ensemble model combining predictions from multiple ML models
    Uses weighted averaging or stacking to produce final predictions
    """
    
    def __init__(self, ensemble_method='weighted_average', weights=None):
        """
        Initialize Ensemble Predictor
        
        Args:
            ensemble_method: 'weighted_average' or 'median' or 'voting'
            weights: Custom weights for models (if using weighted_average)
        """
        self.ensemble_method = ensemble_method
        self.weights = weights
        self.models = {}
        self.model_names = []
        self.is_trained = False
        
        # Initialize all models
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize all 6 models"""
        print("[v0] Initializing ensemble with 6 models...")
        
        # Deep Learning Models (for sequence data)
        self.models['lstm'] = LSTMEarthquakeModel(sequence_length=30, predict_steps=1)
        self.models['hybrid_rnn_lstm'] = HybridRNNLSTMModel(sequence_length=30, predict_steps=1)
        self.models['transformer'] = TransformerEarthquakeModel(sequence_length=30, predict_steps=1)
        self.models['cnn'] = CNNEarthquakeModel(sequence_length=30, predict_steps=1)
        
        # Traditional ML Models (for flattened features)
        self.models['random_forest'] = RandomForestEarthquakeModel(n_estimators=100, max_depth=15)
        
        # Gradient Boosting Models
        if HAS_GRADIENT_BOOST:
            self.models['xgboost'] = XGBoostEarthquakeModel(n_estimators=100)
            self.models['lightgbm'] = LightGBMEarthquakeModel(n_estimators=100)
            self.model_names = ['lstm', 'hybrid_rnn_lstm', 'transformer', 'cnn', 
                                'random_forest', 'xgboost', 'lightgbm']
        else:
            self.model_names = ['lstm', 'hybrid_rnn_lstm', 'transformer', 'cnn', 
                                'random_forest']
        
        # Set default weights if not provided
        if self.weights is None:
            self.weights = {name: 1.0 / len(self.model_names) for name in self.model_names}
        
        print(f"[v0] Ensemble initialized with {len(self.model_names)} models")
        print(f"[v0] Models: {', '.join(self.model_names)}")
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50, verbose=1):
        """
        Train all models in the ensemble
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features
            y_val: Validation targets
            epochs: Number of epochs for deep learning models
            verbose: Verbosity level
        """
        print("[v0] Training ensemble of 6 models...")
        print("=" * 80)
        
        # Train each model
        for i, (name, model) in enumerate(self.models.items()):
            if name not in self.model_names:
                continue
                
            print(f"\n[v0] Training Model {i+1}/{len(self.model_names)}: {name.upper()}")
            print("-" * 80)
            
            try:
                if name in ['lstm', 'hybrid_rnn_lstm', 'transformer', 'cnn']:
                    # Deep learning models need sequence data
                    model.train(X_train, y_train, X_val, y_val, 
                               epochs=epochs, batch_size=32, verbose=verbose)
                else:
                    # Traditional ML models use flattened data
                    model.train(X_train, y_train, X_val, y_val, verbose=verbose)
                    
            except Exception as e:
                print(f"[v0] Error training {name}: {str(e)}")
                continue
        
        self.is_trained = True
        print("\n[v0] All models trained successfully!")
        print("=" * 80)
    
    def predict(self, X):
        """
        Generate ensemble predictions by combining outputs from all models
        
        Args:
            X: Input features
            
        Returns:
            Ensemble prediction
        """
        if not self.is_trained:
            raise ValueError("Ensemble must be trained before making predictions")
        
        predictions = {}
        print("[v0] Generating predictions from all models...")
        
        for name, model in self.models.items():
            if name not in self.model_names:
                continue
                
            try:
                pred = model.predict(X).flatten()
                predictions[name] = pred
                print(f"[v0] {name}: Mean={pred.mean():.4f}, Std={pred.std():.4f}")
            except Exception as e:
                print(f"[v0] Error predicting with {name}: {str(e)}")
                continue
        
        # Combine predictions
        if self.ensemble_method == 'weighted_average':
            ensemble_pred = self._weighted_average(predictions)
        elif self.ensemble_method == 'median':
            ensemble_pred = self._median_ensemble(predictions)
        elif self.ensemble_method == 'voting':
            ensemble_pred = self._voting_ensemble(predictions)
        else:
            ensemble_pred = self._weighted_average(predictions)
        
        return ensemble_pred.reshape(-1, 1)
    
    def _weighted_average(self, predictions):
        """Compute weighted average of predictions"""
        ensemble_pred = np.zeros(len(list(predictions.values())[0]))
        total_weight = 0
        
        for name, pred in predictions.items():
            weight = self.weights.get(name, 1.0)
            ensemble_pred += pred * weight
            total_weight += weight
        
        ensemble_pred /= total_weight
        return ensemble_pred
    
    def _median_ensemble(self, predictions):
        """Compute median of predictions"""
        pred_array = np.array(list(predictions.values()))
        return np.median(pred_array, axis=0)
    
    def _voting_ensemble(self, predictions):
        """Compute average of predictions (simple voting)"""
        pred_array = np.array(list(predictions.values()))
        return np.mean(pred_array, axis=0)
    
    def evaluate(self, X_test, y_test):
        """Evaluate ensemble performance"""
        y_pred = self.predict(X_test).flatten()
        y_test_flat = y_test.flatten()
        
        mse = mean_squared_error(y_test_flat, y_pred)
        mae = mean_absolute_error(y_test_flat, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test_flat, y_pred)
        
        print(f"\n{'=' * 80}")
        print(f"ENSEMBLE MODEL PERFORMANCE (Method: {self.ensemble_method})")
        print(f"{'=' * 80}")
        print(f"MSE: {mse:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")
        print(f"{'=' * 80}\n")
        
        return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}
    
    def set_model_weights(self, weights_dict):
        """Update model weights for weighted averaging"""
        self.weights = weights_dict
        print(f"[v0] Updated model weights: {weights_dict}")


# Example usage and main execution
if __name__ == "__main__":
    print("[v0] Initializing Earthquake Prediction Ensemble System")
    print("=" * 80)
    
    # Generate synthetic training data
    print("[v0] Generating synthetic earthquake data...")
    np.random.seed(42)
    n_samples = 500
    
    # For sequence models
    data = np.random.randn(n_samples, 30, 5) * 10 + np.array([5, 50, 35, 90, 1000])
    targets = np.random.randn(n_samples, 1) * 0.5 + 5
    
    # Split into train/val/test
    train_idx = int(0.6 * n_samples)
    val_idx = int(0.8 * n_samples)
    
    X_train = data[:train_idx]
    y_train = targets[:train_idx]
    
    X_val = data[train_idx:val_idx]
    y_val = targets[train_idx:val_idx]
    
    X_test = data[val_idx:]
    y_test = targets[val_idx:]
    
    print(f"[v0] Training data: {X_train.shape}")
    print(f"[v0] Validation data: {X_val.shape}")
    print(f"[v0] Test data: {X_test.shape}\n")
    
    # Initialize ensemble
    ensemble = EnsembleEarthquakePredictor(ensemble_method='weighted_average')
    
    # Train ensemble
    print("[v0] Starting ensemble training...")
    ensemble.train(X_train, y_train, X_val, y_val, epochs=30, verbose=0)
    
    # Evaluate
    print("\n[v0] Evaluating ensemble on test set...")
    metrics = ensemble.evaluate(X_test, y_test)
    
    print("[v0] Ensemble Earthquake Prediction System training completed!")
