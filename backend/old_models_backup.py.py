import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Sequential
from sklearn.ensemble import RandomForestRegressor
import joblib
from typing import Tuple, Dict, Any
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class LSTMModel:
    """LSTM model using TensorFlow for time-series earthquake prediction"""
    
    def __init__(self, input_shape: Tuple[int, int], output_shape: int = 1):
        self.model = Sequential([
            layers.LSTM(128, return_sequences=True, input_shape=input_shape),
            layers.Dropout(0.2),
            layers.LSTM(64, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(32, activation='relu'),
            layers.Dense(output_shape)
        ])
        self.model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 50, batch_size: int = 32):
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=1
        )
        return self.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        self.model.save(path)
        logger.info(f"LSTM model saved to {path}")
    
    def load(self, path: str):
        self.model = keras.models.load_model(path)
        logger.info(f"LSTM model loaded from {path}")


class HybridRNNLSTMModel:
    """Hybrid RNN-LSTM model using PyTorch"""
    
    def __init__(self, input_size: int, hidden_size: int = 64, output_size: int = 1):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model(input_size, hidden_size, output_size).to(self.device)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.MSELoss()
    
    def _build_model(self, input_size, hidden_size, output_size):
        return nn.Sequential(
            nn.Linear(input_size, hidden_size * 2),
            nn.ReLU(),
            nn.Linear(hidden_size * 2, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Linear(hidden_size // 2, output_size)
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, epochs: int = 50):
        X_train = torch.FloatTensor(X_train).to(self.device)
        y_train = torch.FloatTensor(y_train).reshape(-1, 1).to(self.device)
        
        for epoch in range(epochs):
            self.optimizer.zero_grad()
            outputs = self.model(X_train)
            loss = self.criterion(outputs, y_train)
            loss.backward()
            self.optimizer.step()
            
            if (epoch + 1) % 10 == 0:
                logger.info(f"Hybrid RNN-LSTM Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        X = torch.FloatTensor(X).to(self.device)
        with torch.no_grad():
            predictions = self.model(X)
        return predictions.cpu().numpy()
    
    def save(self, path: str):
        torch.save(self.model.state_dict(), path)
        logger.info(f"Hybrid RNN-LSTM model saved to {path}")
    
    def load(self, path: str):
        self.model.load_state_dict(torch.load(path))
        logger.info(f"Hybrid RNN-LSTM model loaded from {path}")


class TransformerModel:
    """Transformer model using PyTorch for sequence-to-sequence prediction"""
    
    def __init__(self, input_size: int, d_model: int = 64, nhead: int = 4, 
                 num_layers: int = 2, output_size: int = 1):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model(input_size, d_model, nhead, num_layers, output_size).to(self.device)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.MSELoss()
    
    def _build_model(self, input_size, d_model, nhead, num_layers, output_size):
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True)
        transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        return nn.Sequential(
            nn.Linear(input_size, d_model),
            nn.ReLU(),
            transformer_encoder,
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
            nn.Linear(d_model, 64),
            nn.ReLU(),
            nn.Linear(64, output_size)
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, epochs: int = 50):
        X_train = torch.FloatTensor(X_train).unsqueeze(1).to(self.device)
        y_train = torch.FloatTensor(y_train).reshape(-1, 1).to(self.device)
        
        for epoch in range(epochs):
            self.optimizer.zero_grad()
            outputs = self.model(X_train)
            loss = self.criterion(outputs, y_train)
            loss.backward()
            self.optimizer.step()
            
            if (epoch + 1) % 10 == 0:
                logger.info(f"Transformer Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        X = torch.FloatTensor(X).unsqueeze(1).to(self.device)
        with torch.no_grad():
            predictions = self.model(X)
        return predictions.cpu().numpy()
    
    def save(self, path: str):
        torch.save(self.model.state_dict(), path)
        logger.info(f"Transformer model saved to {path}")
    
    def load(self, path: str):
        self.model.load_state_dict(torch.load(path))
        logger.info(f"Transformer model loaded from {path}")


class CNNModel:
    """CNN model using TensorFlow for spatial pattern detection"""
    
    def __init__(self, input_shape: Tuple[int, int], output_shape: int = 1):
        self.model = Sequential([
            layers.Conv1D(64, kernel_size=3, activation='relu', input_shape=input_shape),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),
            layers.Conv1D(32, kernel_size=3, activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling1D(pool_size=2),
            layers.Flatten(),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(output_shape)
        ])
        self.model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              X_val: np.ndarray, y_val: np.ndarray,
              epochs: int = 50, batch_size: int = 32):
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=1
        )
        return self.history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X, verbose=0)
    
    def save(self, path: str):
        self.model.save(path)
        logger.info(f"CNN model saved to {path}")
    
    def load(self, path: str):
        self.model = keras.models.load_model(path)
        logger.info(f"CNN model loaded from {path}")


class RandomForestModel:
    """Random Forest model using Scikit-learn"""
    
    def __init__(self, n_estimators: int = 100, max_depth: int = 20, random_state: int = 42):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            n_jobs=-1,
            verbose=1
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        self.model.fit(X_train, y_train)
        logger.info("Random Forest model trained")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)
    
    def get_feature_importance(self) -> np.ndarray:
        return self.model.feature_importances_
    
    def save(self, path: str):
        joblib.dump(self.model, path)
        logger.info(f"Random Forest model saved to {path}")
    
    def load(self, path: str):
        self.model = joblib.load(path)
        logger.info(f"Random Forest model loaded from {path}")


class XGBoostLightGBMModel:
    """Ensemble of XGBoost and LightGBM models"""
    
    def __init__(self, random_state: int = 42):
        self.xgb_model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=random_state,
            verbosity=1
        )
        self.lgb_model = lgb.LGBMRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=random_state,
            verbose=1
        )
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray):
        self.xgb_model.fit(X_train, y_train)
        self.lgb_model.fit(X_train, y_train)
        logger.info("XGBoost and LightGBM models trained")
    
    def predict(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        xgb_pred = self.xgb_model.predict(X)
        lgb_pred = self.lgb_model.predict(X)
        ensemble_pred = (xgb_pred + lgb_pred) / 2
        
        return {
            'xgboost': xgb_pred,
            'lightgbm': lgb_pred,
            'ensemble': ensemble_pred
        }
    
    def save(self, path_xgb: str, path_lgb: str):
        self.xgb_model.save_model(path_xgb)
        joblib.dump(self.lgb_model, path_lgb)
        logger.info(f"XGBoost model saved to {path_xgb}")
        logger.info(f"LightGBM model saved to {path_lgb}")
    
    def load(self, path_xgb: str, path_lgb: str):
        self.xgb_model = xgb.XGBRegressor()
        self.xgb_model.load_model(path_xgb)
        self.lgb_model = joblib.load(path_lgb)
        logger.info(f"XGBoost model loaded from {path_xgb}")
        logger.info(f"LightGBM model loaded from {path_lgb}")
