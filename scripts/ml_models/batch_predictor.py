"""
Batch Prediction Script
Process large batches of earthquake data for training and evaluation
"""

import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class BatchPredictionProcessor:
    """Process batch predictions for multiple earthquake events"""
    
    def __init__(self, output_dir='predictions'):
        """
        Initialize batch processor
        
        Args:
            output_dir: Directory for saving predictions
        """
        self.output_dir = output_dir
        self.predictions = []
        self.batch_id = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_batch_data(self, n_samples=1000, sequence_length=30):
        """
        Generate batch of earthquake data
        
        Args:
            n_samples: Number of samples
            sequence_length: Length of sequences
            
        Returns:
            Feature matrix and metadata
        """
        print(f"[v0] Generating batch data with {n_samples} samples...")
        
        # Generate sequences
        X = np.random.randn(n_samples, sequence_length, 5) * 10 + \
            np.array([5, 50, 35, 90, 1000])
        
        # Generate metadata
        metadata = []
        for i in range(n_samples):
            meta = {
                'event_id': f'EVT_{self.batch_id}_{i:06d}',
                'timestamp': datetime.now().isoformat(),
                'region': f'Region_{np.random.randint(1, 50)}',
                'source': np.random.choice(['USGS', 'RISEQ'])
            }
            metadata.append(meta)
        
        print(f"[v0] Generated {len(X)} sequences of shape {X.shape[1:]}...")
        return X, metadata
    
    def normalize_batch(self, X):
        """Normalize batch data"""
        X_mean = X.mean()
        X_std = X.std()
        X_normalized = (X - X_mean) / (X_std + 1e-8)
        return X_normalized, X_mean, X_std
    
    def process_batch(self, X, metadata, model_predictions=None):
        """
        Process batch of predictions
        
        Args:
            X: Feature matrix
            metadata: Event metadata
            model_predictions: Pre-computed predictions (optional)
            
        Returns:
            Processed predictions with statistics
        """
        print(f"[v0] Processing {len(X)} predictions...")
        
        # Normalize
        X_norm, X_mean, X_std = self.normalize_batch(X)
        
        # Generate predictions if not provided
        if model_predictions is None:
            # Simulate model predictions using statistical approach
            magnitudes = X[:, :, 0].mean(axis=1)  # Extract magnitude feature
            model_predictions = magnitudes + np.random.normal(0, 0.3, len(X))
            model_predictions = np.clip(model_predictions, 1, 9)
        
        # Process each prediction
        for i, (pred, meta) in enumerate(zip(model_predictions, metadata)):
            prediction_record = {
                **meta,
                'predicted_magnitude': float(pred),
                'confidence': float(np.clip(0.7 + np.random.uniform(-0.1, 0.1), 0.5, 0.95)),
                'features': {
                    'mean_magnitude': float(X[i, :, 0].mean()),
                    'mean_depth': float(X[i, :, 1].mean()),
                    'latitude_std': float(X[i, :, 2].std()),
                    'longitude_std': float(X[i, :, 3].std())
                }
            }
            self.predictions.append(prediction_record)
        
        print(f"[v0] Processed {len(self.predictions)} predictions...")
        return self.predictions
    
    def filter_predictions(self, min_confidence=0.7, min_magnitude=4.0):
        """
        Filter predictions by criteria
        
        Args:
            min_confidence: Minimum confidence threshold
            min_magnitude: Minimum magnitude threshold
            
        Returns:
            Filtered predictions
        """
        filtered = [
            p for p in self.predictions
            if p['confidence'] >= min_confidence and 
               p['predicted_magnitude'] >= min_magnitude
        ]
        
        print(f"[v0] Filtered to {len(filtered)} high-confidence predictions")
        return filtered
    
    def aggregate_statistics(self):
        """Calculate batch statistics"""
        if not self.predictions:
            return None
        
        magnitudes = [p['predicted_magnitude'] for p in self.predictions]
        confidences = [p['confidence'] for p in self.predictions]
        
        stats = {
            'total_predictions': len(self.predictions),
            'magnitude': {
                'mean': float(np.mean(magnitudes)),
                'std': float(np.std(magnitudes)),
                'min': float(np.min(magnitudes)),
                'max': float(np.max(magnitudes)),
                'median': float(np.median(magnitudes))
            },
            'confidence': {
                'mean': float(np.mean(confidences)),
                'std': float(np.std(confidences)),
                'min': float(np.min(confidences)),
                'max': float(np.max(confidences)),
                'median': float(np.median(confidences))
            },
            'high_magnitude_count': int(np.sum(np.array(magnitudes) >= 6.0)),
            'high_confidence_count': int(np.sum(np.array(confidences) >= 0.8))
        }
        
        return stats
    
    def export_predictions(self, format='csv'):
        """
        Export predictions to file
        
        Args:
            format: Export format ('csv' or 'json')
        """
        if not self.predictions:
            print("[v0] No predictions to export")
            return None
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format == 'csv':
            # Convert to DataFrame
            df = pd.DataFrame(self.predictions)
            
            # Expand features column
            features_df = pd.json_normalize(df['features'])
            df = pd.concat([df.drop('features', axis=1), features_df], axis=1)
            
            # Save CSV
            filename = os.path.join(self.output_dir, f'predictions_{timestamp}.csv')
            df.to_csv(filename, index=False)
            print(f"[v0] Exported predictions to {filename}")
            
        elif format == 'json':
            # Save JSON
            filename = os.path.join(self.output_dir, f'predictions_{timestamp}.json')
            with open(filename, 'w') as f:
                import json
                json.dump(self.predictions, f, indent=2)
            print(f"[v0] Exported predictions to {filename}")
        
        return filename
    
    def generate_report(self):
        """Generate and print batch report"""
        stats = self.aggregate_statistics()
        
        if not stats:
            print("[v0] No predictions to report")
            return
        
        print("\n" + "=" * 80)
        print("BATCH PREDICTION REPORT")
        print("=" * 80)
        print(f"Batch ID: {self.batch_id}")
        print(f"Generated: {datetime.now().isoformat()}")
        
        print(f"\nTotal Predictions: {stats['total_predictions']}")
        
        print(f"\nMagnitude Statistics:")
        print(f"  Mean:   {stats['magnitude']['mean']:.2f}")
        print(f"  Std:    {stats['magnitude']['std']:.2f}")
        print(f"  Range:  {stats['magnitude']['min']:.2f} - {stats['magnitude']['max']:.2f}")
        print(f"  Median: {stats['magnitude']['median']:.2f}")
        print(f"  High Magnitude (≥6.0): {stats['high_magnitude_count']} events")
        
        print(f"\nConfidence Statistics:")
        print(f"  Mean:   {stats['confidence']['mean']:.2%}")
        print(f"  Std:    {stats['confidence']['std']:.2%}")
        print(f"  Range:  {stats['confidence']['min']:.2%} - {stats['confidence']['max']:.2%}")
        print(f"  Median: {stats['confidence']['median']:.2%}")
        print(f"  High Confidence (≥0.8): {stats['high_confidence_count']} events")
        
        print("=" * 80 + "\n")
        
        return stats


def main():
    """Main execution"""
    print("\n" + "=" * 80)
    print("BATCH EARTHQUAKE PREDICTION PROCESSOR")
    print("=" * 80 + "\n")
    
    # Initialize processor
    processor = BatchPredictionProcessor(output_dir='predictions')
    
    # Generate batch data
    X, metadata = processor.generate_batch_data(n_samples=500, sequence_length=30)
    
    # Process predictions
    print("[v0] Processing batch predictions...")
    predictions = processor.process_batch(X, metadata)
    
    # Filter high-confidence predictions
    print("\n[v0] Filtering high-confidence predictions...")
    high_conf = processor.filter_predictions(min_confidence=0.8, min_magnitude=5.0)
    print(f"[v0] Found {len(high_conf)} significant events")
    
    # Generate report
    print("\n[v0] Generating batch report...")
    stats = processor.generate_report()
    
    # Export results
    print("[v0] Exporting predictions...")
    csv_file = processor.export_predictions(format='csv')
    json_file = processor.export_predictions(format='json')
    
    print("\n" + "=" * 80)
    print("BATCH PROCESSING COMPLETED")
    print("=" * 80)
    print(f"CSV Export: {csv_file}")
    print(f"JSON Export: {json_file}")
    print(f"Total Predictions: {len(predictions)}")
    print(f"High-Confidence Events: {len(high_conf)}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
