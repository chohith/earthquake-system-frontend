"""
Random Forest (RF) Model for Earthquake Prediction
Ensemble learning method using multiple decision trees
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')


class RandomForestEarthquakeModel:
    """Random Forest model for earthquake magnitude prediction"""
    
    def __init__(self, n_estimators=100, max_depth=15, min_samples_split=5, 
                 min_samples_leaf=2, n_jobs=-1, random_state=42):
        """
        Initialize Random Forest model
        
        Args:
            n_estimators: Number of trees in the forest
            max_depth: Maximum depth of trees
            min_samples_split: Minimum samples required to split
            min_samples_leaf: Minimum samples required at leaf node
            n_jobs: Number of jobs for parallel processing
            random_state: Random seed
        """
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            n_jobs=n_jobs,
            random_state=random_state
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = None
        
    def prepare_data(self, data, targets=None):
        """
        Prepare data for Random Forest
        
        Args:
            data: Feature matrix (n_samples, n_features)
            targets: Target vector (n_samples,)
        """
        # For Random Forest, we use flattened features directly
        if len(data.shape) > 2:
            n_samples = data.shape[0]
            data_flat = data.reshape(n_samples, -1)
        else:
            data_flat = data
            
        return data_flat
    
    def train(self, X_train, y_train, X_val=None, y_val=None, verbose=1):
        """
        Train the Random Forest model
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            verbose: Verbosity level
        """
        # Prepare data
        X_train_flat = self.prepare_data(X_train)
        y_train_flat = y_train.flatten()
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train_flat)
        
        if verbose:
            print(f"[v0] Training Random Forest with {self.model.n_estimators} trees...")
            print(f"[v0] Training data shape: {X_train_scaled.shape}")
        
        # Train
        self.model.fit(X_train_scaled, y_train_flat)
        self.is_trained = True
        
        # Validation evaluation if provided
        if X_val is not None and y_val is not None:
            val_score = self.evaluate(X_val, y_val, is_validation=True)
            if verbose:
                print(f"[v0] Validation R² Score: {val_score['r2']:.4f}")
        
        if verbose:
            print(f"[v0] Random Forest training completed!")
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X_flat = self.prepare_data(X)
        X_scaled = self.scaler.transform(X_flat)
        y_pred = self.model.predict(X_scaled)
        
        return y_pred.reshape(-1, 1)
    
    def evaluate(self, X_test, y_test, is_validation=False):
        """Evaluate model performance"""
        y_pred = self.predict(X_test).flatten()
        y_test_flat = y_test.flatten()
        
        mse = mean_squared_error(y_test_flat, y_pred)
        mae = mean_absolute_error(y_test_flat, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test_flat, y_pred)
        
        label = "Validation" if is_validation else "Random Forest"
        print(f"\n{label} Model Performance:")
        print(f"MSE: {mse:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}
    
    def get_feature_importance(self, top_n=10):
        """Get feature importance scores"""
        if not self.is_trained:
            raise ValueError("Model must be trained before getting feature importance")
        
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:top_n]
        
        print(f"\nTop {top_n} Important Features:")
        for i, idx in enumerate(indices):
            print(f"{i+1}. Feature {idx}: {importances[idx]:.4f}")
        
        return importances


# Example usage
if __name__ == "__main__":
    print("[v0] Loading earthquake training data for Random Forest...")
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    n_features = 20
    
    # Create feature matrix
    X = np.random.randn(n_samples, n_features) * 10 + np.array([5, 50, 35, 90] + [0]*16)
    y = np.random.randn(n_samples, 1) * 0.5 + 5
    
    # Split data
    split_idx = int(0.7 * n_samples)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    val_split = int(0.2 * len(X_train))
    X_val, X_train = X_train[:val_split], X_train[val_split:]
    y_val, y_train = y_train[:val_split], y_train[val_split:]
    
    print(f"[v0] Training Random Forest model...")
    model = RandomForestEarthquakeModel(n_estimators=100, max_depth=15)
    model.train(X_train, y_train, X_val, y_val)
    
    print("[v0] Evaluating Random Forest model...")
    metrics = model.evaluate(X_test, y_test)
    
    print("[v0] Feature importance analysis:")
    model.get_feature_importance(top_n=10)
    
    print("[v0] Random Forest Model training completed successfully!")
