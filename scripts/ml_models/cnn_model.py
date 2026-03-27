"""
CNN (Convolutional Neural Networks) Model for Earthquake Prediction
Uses convolutional layers to extract spatial patterns from earthquake data
"""

import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import warnings
warnings.filterwarnings('ignore')


class CNNEarthquakeModel:
    """CNN model using convolutional layers for earthquake prediction"""
    
    def __init__(self, sequence_length=30, predict_steps=1):
        """
        Initialize CNN model
        
        Args:
            sequence_length: Number of time steps to look back
            predict_steps: Number of steps ahead to predict
        """
        self.sequence_length = sequence_length
        self.predict_steps = predict_steps
        self.model = None
        self.scaler_X = MinMaxScaler()
        self.scaler_y = MinMaxScaler()
        self.is_trained = False
        
    def create_sequences(self, data, targets):
        """Create sequences for model input"""
        X, y = [], []
        for i in range(len(data) - self.sequence_length - self.predict_steps + 1):
            X.append(data[i:i + self.sequence_length])
            y.append(targets[i + self.sequence_length:i + self.sequence_length + self.predict_steps])
        return np.array(X), np.array(y)
    
    def build_model(self, input_shape):
        """Build CNN model architecture"""
        self.model = Sequential([
            # Convolutional blocks
            Conv1D(filters=64, kernel_size=3, activation='relu', padding='same', 
                   input_shape=input_shape),
            MaxPooling1D(pool_size=2),
            Dropout(0.2),
            
            Conv1D(filters=128, kernel_size=3, activation='relu', padding='same'),
            MaxPooling1D(pool_size=2),
            Dropout(0.2),
            
            Conv1D(filters=64, kernel_size=3, activation='relu', padding='same'),
            MaxPooling1D(pool_size=2),
            Dropout(0.2),
            
            # Flatten and dense layers
            Flatten(),
            Dense(256, activation='relu'),
            Dropout(0.3),
            Dense(128, activation='relu'),
            Dropout(0.2),
            Dense(64, activation='relu'),
            Dropout(0.1),
            Dense(self.predict_steps)
        ])
        
        self.model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        print("CNN Model Architecture:")
        self.model.summary()
    
    def train(self, X_train, y_train, X_val, y_val, epochs=100, batch_size=32, verbose=1):
        """Train the CNN model"""
        # Scale data
        X_train_scaled = self.scaler_X.fit_transform(X_train.reshape(-1, X_train.shape[-1])).reshape(X_train.shape)
        X_val_scaled = self.scaler_X.transform(X_val.reshape(-1, X_val.shape[-1])).reshape(X_val.shape)
        y_train_scaled = self.scaler_y.fit_transform(y_train.reshape(-1, 1)).reshape(y_train.shape)
        y_val_scaled = self.scaler_y.transform(y_val.reshape(-1, 1)).reshape(y_val.shape)
        
        # Build model
        self.build_model((X_train_scaled.shape[1], X_train_scaled.shape[2]))
        
        # Callbacks
        early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
        
        # Train
        history = self.model.fit(
            X_train_scaled, y_train_scaled,
            validation_data=(X_val_scaled, y_val_scaled),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stop, reduce_lr],
            verbose=verbose
        )
        
        self.is_trained = True
        return history
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained or self.model is None:
            raise ValueError("Model must be trained before making predictions")
        
        X_scaled = self.scaler_X.transform(X.reshape(-1, X.shape[-1])).reshape(X.shape)
        y_pred_scaled = self.model.predict(X_scaled, verbose=0)
        y_pred = self.scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).reshape(y_pred_scaled.shape)
        
        return y_pred
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        y_pred = self.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\nCNN Model Performance:")
        print(f"MSE: {mse:.4f}")
        print(f"RMSE: {rmse:.4f}")
        print(f"MAE: {mae:.4f}")
        print(f"R² Score: {r2:.4f}")
        
        return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2}


# Example usage
if __name__ == "__main__":
    print("[v0] Loading earthquake training data for CNN...")
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    data = np.random.randn(n_samples, 5) * 10 + np.array([5, 50, 35, 90, 1000])
    targets = np.random.randn(n_samples, 1) * 0.5 + 5
    
    # Create sequences
    model = CNNEarthquakeModel(sequence_length=30, predict_steps=1)
    X, y = model.create_sequences(data, targets)
    
    # Split data
    split_idx = int(0.7 * len(X))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    val_split = int(0.2 * len(X_train))
    X_val, X_train = X_train[:val_split], X_train[val_split:]
    y_val, y_train = y_train[:val_split], y_train[val_split:]
    
    print(f"[v0] Training CNN model...")
    model.train(X_train, y_train, X_val, y_val, epochs=50, batch_size=32)
    
    print("[v0] Evaluating CNN model...")
    metrics = model.evaluate(X_test, y_test)
    
    print("[v0] CNN Model training completed successfully!")
