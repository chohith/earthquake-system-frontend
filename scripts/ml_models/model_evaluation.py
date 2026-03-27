"""
Model Evaluation and Comparison Framework
Provides comprehensive evaluation, cross-validation, and visualization utilities
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, cross_validate
from sklearn.metrics import (mean_squared_error, mean_absolute_error, r2_score,
                            mean_absolute_percentage_error)
import warnings
warnings.filterwarnings('ignore')


class ModelEvaluator:
    """Comprehensive model evaluation framework"""
    
    def __init__(self, model, model_name):
        """
        Initialize evaluator
        
        Args:
            model: Model instance
            model_name: Name of the model
        """
        self.model = model
        self.model_name = model_name
        self.evaluation_results = {}
    
    @staticmethod
    def calculate_metrics(y_true, y_pred):
        """Calculate comprehensive evaluation metrics"""
        y_true = y_true.flatten()
        y_pred = y_pred.flatten()
        
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        # Additional metrics
        mape = mean_absolute_percentage_error(y_true, np.clip(y_pred, 1, None))
        
        # Residuals analysis
        residuals = y_true - y_pred
        mean_residual = np.mean(residuals)
        std_residual = np.std(residuals)
        
        # Prediction error statistics
        mean_error = np.mean(y_pred - y_true)
        max_error = np.max(np.abs(y_pred - y_true))
        
        return {
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2,
            'mape': mape,
            'mean_residual': mean_residual,
            'std_residual': std_residual,
            'mean_error': mean_error,
            'max_error': max_error
        }
    
    def evaluate(self, X_test, y_test):
        """Evaluate model on test set"""
        y_pred = self.model.predict(X_test)
        metrics = self.calculate_metrics(y_test, y_pred)
        
        print(f"\n{'=' * 60}")
        print(f"EVALUATION REPORT: {self.model_name.upper()}")
        print(f"{'=' * 60}")
        print(f"MSE:              {metrics['mse']:.6f}")
        print(f"RMSE:             {metrics['rmse']:.6f}")
        print(f"MAE:              {metrics['mae']:.6f}")
        print(f"R² Score:         {metrics['r2']:.6f}")
        print(f"MAPE:             {metrics['mape']:.6f}%")
        print(f"Mean Residual:    {metrics['mean_residual']:.6f}")
        print(f"Std Residual:     {metrics['std_residual']:.6f}")
        print(f"Max Error:        {metrics['max_error']:.6f}")
        print(f"{'=' * 60}")
        
        self.evaluation_results = metrics
        return metrics
    
    def get_prediction_confidence(self, y_pred, y_true):
        """Calculate prediction confidence intervals"""
        residuals = y_true - y_pred.flatten()
        std_error = np.std(residuals)
        
        # 95% confidence interval
        confidence_95 = 1.96 * std_error
        
        return {
            'point_estimate': y_pred,
            'std_error': std_error,
            'ci_95_lower': y_pred.flatten() - confidence_95,
            'ci_95_upper': y_pred.flatten() + confidence_95
        }


class EnsembleEvaluator:
    """Evaluate ensemble model against individual models"""
    
    def __init__(self, models_dict):
        """
        Initialize ensemble evaluator
        
        Args:
            models_dict: Dictionary of {model_name: model_instance}
        """
        self.models_dict = models_dict
        self.results = {}
    
    def evaluate_all(self, X_test, y_test):
        """Evaluate all models"""
        print("\n" + "=" * 80)
        print("COMPREHENSIVE MODEL EVALUATION")
        print("=" * 80)
        
        for model_name, model in self.models_dict.items():
            try:
                evaluator = ModelEvaluator(model, model_name)
                metrics = evaluator.evaluate(X_test, y_test)
                self.results[model_name] = metrics
            except Exception as e:
                print(f"Error evaluating {model_name}: {e}")
        
        return self.results
    
    def create_comparison_report(self):
        """Create detailed comparison report"""
        print("\n" + "=" * 100)
        print("MODEL COMPARISON REPORT")
        print("=" * 100)
        
        # Prepare data for comparison
        df_data = []
        for model_name, metrics in self.results.items():
            df_data.append({
                'Model': model_name.upper(),
                'MSE': f"{metrics['mse']:.6f}",
                'RMSE': f"{metrics['rmse']:.6f}",
                'MAE': f"{metrics['mae']:.6f}",
                'R²': f"{metrics['r2']:.6f}",
                'MAPE': f"{metrics['mape']:.6f}%"
            })
        
        df = pd.DataFrame(df_data)
        print(df.to_string(index=False))
        print("=" * 100)
        
        # Find best model by different metrics
        best_r2 = max(self.results.items(), key=lambda x: x[1]['r2'])
        best_rmse = min(self.results.items(), key=lambda x: x[1]['rmse'])
        best_mae = min(self.results.items(), key=lambda x: x[1]['mae'])
        
        print(f"\nBest Model by R² Score: {best_r2[0].upper()} (R² = {best_r2[1]['r2']:.6f})")
        print(f"Best Model by RMSE: {best_rmse[0].upper()} (RMSE = {best_rmse[1]['rmse']:.6f})")
        print(f"Best Model by MAE: {best_mae[0].upper()} (MAE = {best_mae[1]['mae']:.6f})")
        print("=" * 100)
        
        return df


class CrossValidationEvaluator:
    """Cross-validation evaluation framework"""
    
    def __init__(self, model, model_name, n_splits=5):
        """
        Initialize cross-validation evaluator
        
        Args:
            model: Model instance
            model_name: Name of the model
            n_splits: Number of CV folds
        """
        self.model = model
        self.model_name = model_name
        self.n_splits = n_splits
        self.cv_results = {}
    
    def evaluate_with_cv(self, X, y):
        """Perform k-fold cross-validation"""
        kfold = KFold(n_splits=self.n_splits, shuffle=True, random_state=42)
        
        fold_results = {
            'rmse_scores': [],
            'mae_scores': [],
            'r2_scores': []
        }
        
        print(f"\n[v0] Cross-Validation ({self.n_splits}-fold) for {self.model_name}...")
        
        fold_num = 1
        for train_idx, test_idx in kfold.split(X):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            
            try:
                # Train model on fold
                self.model.train(X_train, y_train, X_test, y_test, verbose=0)
                
                # Evaluate
                y_pred = self.model.predict(X_test)
                
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                fold_results['rmse_scores'].append(rmse)
                fold_results['mae_scores'].append(mae)
                fold_results['r2_scores'].append(r2)
                
                print(f"  Fold {fold_num}: RMSE={rmse:.6f}, MAE={mae:.6f}, R²={r2:.6f}")
                fold_num += 1
                
            except Exception as e:
                print(f"  Error on fold {fold_num}: {e}")
                continue
        
        # Calculate statistics
        self.cv_results = {
            'rmse_mean': np.mean(fold_results['rmse_scores']),
            'rmse_std': np.std(fold_results['rmse_scores']),
            'mae_mean': np.mean(fold_results['mae_scores']),
            'mae_std': np.std(fold_results['mae_scores']),
            'r2_mean': np.mean(fold_results['r2_scores']),
            'r2_std': np.std(fold_results['r2_scores']),
            'fold_details': fold_results
        }
        
        print(f"\nCross-Validation Summary for {self.model_name}:")
        print(f"  RMSE: {self.cv_results['rmse_mean']:.6f} ± {self.cv_results['rmse_std']:.6f}")
        print(f"  MAE:  {self.cv_results['mae_mean']:.6f} ± {self.cv_results['mae_std']:.6f}")
        print(f"  R²:   {self.cv_results['r2_mean']:.6f} ± {self.cv_results['r2_std']:.6f}")
        
        return self.cv_results


class PredictionAnalyzer:
    """Analyze and visualize predictions"""
    
    @staticmethod
    def analyze_predictions(y_true, y_pred, model_name):
        """Comprehensive prediction analysis"""
        y_true = y_true.flatten()
        y_pred = y_pred.flatten()
        
        errors = y_pred - y_true
        abs_errors = np.abs(errors)
        
        print(f"\n{'=' * 60}")
        print(f"PREDICTION ANALYSIS: {model_name.upper()}")
        print(f"{'=' * 60}")
        
        print(f"Total Predictions:     {len(y_pred)}")
        print(f"Mean Actual Value:     {np.mean(y_true):.6f}")
        print(f"Mean Predicted Value:  {np.mean(y_pred):.6f}")
        print(f"Std Actual Value:      {np.std(y_true):.6f}")
        print(f"Std Predicted Value:   {np.std(y_pred):.6f}")
        
        print(f"\nError Statistics:")
        print(f"Mean Error:            {np.mean(errors):.6f}")
        print(f"Std Error:             {np.std(errors):.6f}")
        print(f"Mean Absolute Error:   {np.mean(abs_errors):.6f}")
        print(f"Median Error:          {np.median(errors):.6f}")
        print(f"Min Error:             {np.min(errors):.6f}")
        print(f"Max Error:             {np.max(errors):.6f}")
        
        # Error distribution
        error_95 = np.percentile(abs_errors, 95)
        error_90 = np.percentile(abs_errors, 90)
        error_75 = np.percentile(abs_errors, 75)
        
        print(f"\nError Percentiles:")
        print(f"75th Percentile:       {error_75:.6f}")
        print(f"90th Percentile:       {error_90:.6f}")
        print(f"95th Percentile:       {error_95:.6f}")
        
        print(f"{'=' * 60}")
    
    @staticmethod
    def identify_outlier_predictions(y_true, y_pred, threshold=2.0):
        """Identify outlier predictions"""
        errors = y_pred.flatten() - y_true.flatten()
        mean_error = np.mean(errors)
        std_error = np.std(errors)
        
        z_scores = np.abs((errors - mean_error) / (std_error + 1e-8))
        outliers = np.where(z_scores > threshold)[0]
        
        return {
            'indices': outliers,
            'count': len(outliers),
            'percentage': (len(outliers) / len(y_true)) * 100,
            'values': y_true[outliers],
            'predictions': y_pred.flatten()[outliers],
            'errors': errors[outliers]
        }


# Example usage
if __name__ == "__main__":
    print("[v0] Model Evaluation Framework Example")
    print("This module provides comprehensive evaluation tools for ML models")
    print("\nKey Classes:")
    print("  - ModelEvaluator: Single model evaluation")
    print("  - EnsembleEvaluator: Multi-model comparison")
    print("  - CrossValidationEvaluator: K-fold cross-validation")
    print("  - PredictionAnalyzer: Detailed prediction analysis")
