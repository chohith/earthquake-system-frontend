import asyncio
import numpy as np
import pandas as pd
from pathlib import Path
import logging
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from datetime import datetime
import json

from data_loader import DualSourceDataLoader
from models import (
    LSTMModel, HybridRNNLSTMModel, TransformerModel,
    CNNModel, RandomForestModel, XGBoostLightGBMModel
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class TrainingPipeline:
    """Complete training pipeline for all 6 models using dual-source data"""
    
    def __init__(self, model_dir: str = "./models", data_dir: str = "./data"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.loader = DualSourceDataLoader()
        self.scaler = StandardScaler()
        self.models = {}
        self.metrics = {}
    
    async def fetch_and_prepare_data(self, endpoint: str = 'month') -> Tuple[np.ndarray, np.ndarray]:
        """Fetch data from both USGS and RISEQ"""
        logger.info("Fetching earthquake data from USGS and RISEQ sources...")
        df = await self.loader.load_combined_data(endpoint)
        
        if len(df) == 0:
            raise ValueError("No earthquake data fetched from either source")
        
        logger.info(f"Total events fetched: {len(df)}")
        logger.info(f"USGS events: {len(df[df['source'] == 'usgs'])}")
        logger.info(f"RISEQ events: {len(df[df['source'] == 'riseq'])}")
        
        # Create features
        features_df = self.loader.create_features(df, window_size=10)
        
        # Handle NaN values
        features_df = features_df.fillna(0)
        
        # Separate features and target
        X = features_df.drop('target_magnitude_next', axis=1).values
        y = features_df['target_magnitude_next'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        logger.info(f"Feature matrix shape: {X_scaled.shape}")
        logger.info(f"Target shape: {y.shape}")
        
        return X_scaled, y
    
    def split_data(self, X: np.ndarray, y: np.ndarray, 
                   test_size: float = 0.2, val_size: float = 0.1) -> Dict:
        """Split data into train, validation, test sets"""
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        val_split = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=val_split, random_state=42
        )
        
        logger.info(f"Train set: {X_train.shape}")
        logger.info(f"Validation set: {X_val.shape}")
        logger.info(f"Test set: {X_test.shape}")
        
        return {
            'X_train': X_train, 'y_train': y_train,
            'X_val': X_val, 'y_val': y_val,
            'X_test': X_test, 'y_test': y_test
        }
    
    def train_lstm(self, data: Dict):
        """Train LSTM model"""
        logger.info("Training LSTM model...")
        X_train = data['X_train'].reshape(data['X_train'].shape[0], -1, 1)
        X_val = data['X_val'].reshape(data['X_val'].shape[0], -1, 1)
        
        model = LSTMModel((X_train.shape[1], 1))
        model.train(X_train, data['y_train'], X_val, data['y_val'], epochs=50)
        
        # Save model
        model_path = self.model_dir / "lstm_model.h5"
        model.save(str(model_path))
        
        self.models['lstm'] = model
        logger.info("LSTM training completed")
    
    def train_hybrid_rnn_lstm(self, data: Dict):
        """Train Hybrid RNN-LSTM model"""
        logger.info("Training Hybrid RNN-LSTM model...")
        model = HybridRNNLSTMModel(data['X_train'].shape[1])
        model.train(data['X_train'], data['y_train'], epochs=50)
        
        model_path = self.model_dir / "hybrid_rnn_lstm_model.pt"
        model.save(str(model_path))
        
        self.models['hybrid_rnn_lstm'] = model
        logger.info("Hybrid RNN-LSTM training completed")
    
    def train_transformer(self, data: Dict):
        """Train Transformer model"""
        logger.info("Training Transformer model...")
        model = TransformerModel(data['X_train'].shape[1])
        model.train(data['X_train'], data['y_train'], epochs=50)
        
        model_path = self.model_dir / "transformer_model.pt"
        model.save(str(model_path))
        
        self.models['transformer'] = model
        logger.info("Transformer training completed")
    
    def train_cnn(self, data: Dict):
        """Train CNN model"""
        logger.info("Training CNN model...")
        X_train = data['X_train'].reshape(data['X_train'].shape[0], -1, 1)
        X_val = data['X_val'].reshape(data['X_val'].shape[0], -1, 1)
        
        model = CNNModel((X_train.shape[1], 1))
        model.train(X_train, data['y_train'], X_val, data['y_val'], epochs=50)
        
        model_path = self.model_dir / "cnn_model.h5"
        model.save(str(model_path))
        
        self.models['cnn'] = model
        logger.info("CNN training completed")
    
    def train_random_forest(self, data: Dict):
        """Train Random Forest model"""
        logger.info("Training Random Forest model...")
        model = RandomForestModel()
        model.train(data['X_train'], data['y_train'])
        
        model_path = self.model_dir / "random_forest_model.pkl"
        model.save(str(model_path))
        
        # Log feature importance
        importance = model.get_feature_importance()
        logger.info(f"Top features: {np.argsort(importance)[-5:]}")
        
        self.models['random_forest'] = model
        logger.info("Random Forest training completed")
    
    def train_xgboost_lightgbm(self, data: Dict):
        """Train XGBoost and LightGBM ensemble"""
        logger.info("Training XGBoost and LightGBM models...")
        model = XGBoostLightGBMModel()
        model.train(data['X_train'], data['y_train'])
        
        xgb_path = self.model_dir / "xgboost_model.json"
        lgb_path = self.model_dir / "lightgbm_model.pkl"
        model.save(str(xgb_path), str(lgb_path))
        
        self.models['xgboost_lightgbm'] = model
        logger.info("XGBoost and LightGBM training completed")
    
    def evaluate_all_models(self, data: Dict) -> Dict:
        """Evaluate all models on test set"""
        logger.info("Evaluating all models...")
        results = {}
        
        for name, model in self.models.items():
            try:
                if name == 'lstm':
                    X_test = data['X_test'].reshape(data['X_test'].shape[0], -1, 1)
                    predictions = model.predict(X_test).flatten()
                elif name == 'cnn':
                    X_test = data['X_test'].reshape(data['X_test'].shape[0], -1, 1)
                    predictions = model.predict(X_test).flatten()
                elif name in ['hybrid_rnn_lstm', 'transformer']:
                    predictions = model.predict(data['X_test']).flatten()
                elif name == 'xgboost_lightgbm':
                    pred_dict = model.predict(data['X_test'])
                    predictions = pred_dict['ensemble']
                else:
                    predictions = model.predict(data['X_test'])
                
                # Calculate metrics
                mse = np.mean((predictions - data['y_test']) ** 2)
                rmse = np.sqrt(mse)
                mae = np.mean(np.abs(predictions - data['y_test']))
                r2 = 1 - (np.sum((predictions - data['y_test']) ** 2) / 
                         np.sum((data['y_test'] - np.mean(data['y_test'])) ** 2))
                
                results[name] = {
                    'mse': float(mse),
                    'rmse': float(rmse),
                    'mae': float(mae),
                    'r2': float(r2)
                }
                
                logger.info(f"{name} - RMSE: {rmse:.4f}, R²: {r2:.4f}")
            
            except Exception as e:
                logger.error(f"Error evaluating {name}: {e}")
                results[name] = {'error': str(e)}
        
        self.metrics = results
        return results
    
    async def run_full_pipeline(self):
        """Run complete training pipeline"""
        logger.info("=" * 80)
        logger.info("Starting Earthquake ML Training Pipeline")
        logger.info("Data sources: USGS + RISEQ")
        logger.info("=" * 80)
        
        try:
            # Fetch and prepare data
            X, y = await self.fetch_and_prepare_data()
            
            # Split data
            data = self.split_data(X, y)
            
            # Train all models
            self.train_lstm(data)
            self.train_hybrid_rnn_lstm(data)
            self.train_transformer(data)
            self.train_cnn(data)
            self.train_random_forest(data)
            self.train_xgboost_lightgbm(data)
            
            # Evaluate all models
            results = self.evaluate_all_models(data)
            
            # Save metrics report
            report = {
                'timestamp': datetime.now().isoformat(),
                'data_sources': ['usgs', 'riseq'],
                'total_samples': len(X),
                'metrics': results,
                'best_model': max(results.items(), key=lambda x: x[1].get('r2', 0))[0]
            }
            
            report_path = self.model_dir / "training_report.json"
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info("=" * 80)
            logger.info("Training Pipeline Completed Successfully")
            logger.info(f"Best model: {report['best_model']}")
            logger.info(f"Report saved to {report_path}")
            logger.info("=" * 80)
            
            return report
        
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            raise


async def main():
    """Main entry point"""
    pipeline = TrainingPipeline()
    report = await pipeline.run_full_pipeline()
    print("\nTraining Report:")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
