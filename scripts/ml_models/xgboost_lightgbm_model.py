"""
XGBoost/LightGBM Model for Earthquake Prediction
Advanced gradient boosting ensemble methods
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False


class XGBoostEarthquakeModel:
    """XGBoost model for earthquake magnitude prediction"""
    
    def __init__(self, n_estimators=100, max_depth=6, learning_rate=0.1,
                 subsample=0.8, colsample_bytree=0.8, random_state=42):
        """Initialize XGBoost model"""
        if not HAS_XGBOOST:
            raise ImportError("XGBoost is not installed. Install it with: pip install xgboost")
        
        self.model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            random_state=random_state,
            objective='reg:squarederror',
            tree_method='hist'
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_data(self, data):
        """Prepare data for XGBoost"""
        if len(data.shape) > 2:
            n_samples = data.shape[0]
            data_flat = data.reshape(n_samples, -1)
        else:
            data_flat = data
        return data_flat
    
    def train(self, X_train, y_train, X_val=None, y_val=None, verbose=1):
        """Train the XGBoost model"""
        X_train_flat = self.prepare_data(X_train)
        y_train_flat = y_train.flatten()
        
        X_train_scaled = self.scaler.fit_transform(X_train_flat)
        
        eval_set = None
        if X_val is not None and y_val is not None:
            X_val_flat = self.prepare_data(X_val)
            X_val_scaled = self.scaler.transform(X_val_flat)
            eval_set = [(X_train_scaled, y_train_flat), (X_val_scaled, y_val.flatten())]
        
        if verbose:
            print(f"[v0] Training XGBoost model with {self.model.n_estimators} trees...")
        
        self.model.fit(
            X_train_scaled, y_train_flat,
            eval_set=eval_set,
            verbose=verbose
        )
        
        self.is_trained = True
        
        if verbose:
            print(f"[v0] XGBoost training completed!")
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X_flat = self.prepare_data(X)
        X_scaled = self.scaler.transform(X_flat)
        y_pred = self.model.predict(X_scaled)
        
        return y_pred.reshape(-1, 1)
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        y_pred = self.predict(X_test).flatten()
        y_test_flat = y_test.flatten()
        
        mse = mean_squared_error(y_test_flat, y_pred)
        mae = mean_absolute_error(y_test_flat, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test_flat, y_pred)
        
        print(f"\nXGBoost Model Performance:")
        print(f"MSE: {mse:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}


class LightGBMEarthquakeModel:
    """LightGBM model for earthquake magnitude prediction"""
    
    def __init__(self, n_estimators=100, max_depth=6, learning_rate=0.1,
                 num_leaves=31, subsample=0.8, colsample_bytree=0.8, random_state=42):
        """Initialize LightGBM model"""
        if not HAS_LIGHTGBM:
            raise ImportError("LightGBM is not installed. Install it with: pip install lightgbm")
        
        self.model = lgb.LGBMRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            num_leaves=num_leaves,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            random_state=random_state,
            objective='regression',
            metric='rmse'
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_data(self, data):
        """Prepare data for LightGBM"""
        if len(data.shape) > 2:
            n_samples = data.shape[0]
            data_flat = data.reshape(n_samples, -1)
        else:
            data_flat = data
        return data_flat
    
    def train(self, X_train, y_train, X_val=None, y_val=None, verbose=1):
        """Train the LightGBM model"""
        X_train_flat = self.prepare_data(X_train)
        y_train_flat = y_train.flatten()
        
        X_train_scaled = self.scaler.fit_transform(X_train_flat)
        
        eval_set = None
        if X_val is not None and y_val is not None:
            X_val_flat = self.prepare_data(X_val)
            X_val_scaled = self.scaler.transform(X_val_flat)
            eval_set = [(X_val_scaled, y_val.flatten())]
        
        if verbose:
            print(f"[v0] Training LightGBM model with {self.model.n_estimators} trees...")
        
        self.model.fit(
            X_train_scaled, y_train_flat,
            eval_set=eval_set,
            verbose_eval=verbose
        )
        
        self.is_trained = True
        
        if verbose:
            print(f"[v0] LightGBM training completed!")
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X_flat = self.prepare_data(X)
        X_scaled = self.scaler.transform(X_flat)
        y_pred = self.model.predict(X_scaled)
        
        return y_pred.reshape(-1, 1)
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        y_pred = self.predict(X_test).flatten()
        y_test_flat = y_test.flatten()
        
        mse = mean_squared_error(y_test_flat, y_pred)
        mae = mean_absolute_error(y_test_flat, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test_flat, y_pred)
        
        print(f"\nLightGBM Model Performance:")
        print(f"MSE: {mse:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}


# Example usage
if __name__ == "__main__":
    print("[v0] Loading earthquake training data for Gradient Boosting models...")
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    n_features = 20
    
    X = np.random.randn(n_samples, n_features) * 10 + np.array([5, 50, 35, 90] + [0]*16)
    y = np.random.randn(n_samples, 1) * 0.5 + 5
    
    # Split data
    split_idx = int(0.7 * n_samples)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    val_split = int(0.2 * len(X_train))
    X_val, X_train = X_train[:val_split], X_train[val_split:]
    y_val, y_train = y_train[:val_split], y_train[val_split:]
    
    # Train XGBoost if available
    if HAS_XGBOOST:
        print("[v0] Training XGBoost model...")
        xgb_model = XGBoostEarthquakeModel(n_estimators=100)
        xgb_model.train(X_train, y_train, X_val, y_val)
        xgb_metrics = xgb_model.evaluate(X_test, y_test)
        print("[v0] XGBoost Model training completed successfully!")
    else:
        print("[v0] XGBoost not installed. Skipping...")
    
    # Train LightGBM if available
    if HAS_LIGHTGBM:
        print("\n[v0] Training LightGBM model...")
        lgb_model = LightGBMEarthquakeModel(n_estimators=100)
        lgb_model.train(X_train, y_train, X_val, y_val)
        lgb_metrics = lgb_model.evaluate(X_test, y_test)
        print("[v0] LightGBM Model training completed successfully!")
    else:
        print("[v0] LightGBM not installed. Skipping...")
    
    if not HAS_XGBOOST and not HAS_LIGHTGBM:
        print("[v0] Neither XGBoost nor LightGBM is installed.")
        print("[v0] Install them with: pip install xgboost lightgbm")
