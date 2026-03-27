from tensorflow.keras.models import load_model
import joblib

lstm_model = None
cnn_model = None
scaler = None


def load_models():
    global lstm_model, cnn_model, scaler

    lstm_model = load_model("models/lstm_model.h5")
    cnn_model = load_model("models/cnn_model.h5")
    scaler = joblib.load("models/scaler.pkl")


def get_lstm_model():
    return lstm_model


def get_cnn_model():
    return cnn_model


def get_scaler():
    return scaler


ann_model = None
ann_scaler = None

def load_ann_model():
    global ann_model, ann_scaler
    try:
        from tensorflow.keras.models import load_model
        import joblib
        ann_model = load_model("models/ann_model_fixed.h5")
        ann_scaler = joblib.load("models/ann_scaler_fixed.pkl")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to load ANN risk layer: {e}")

def get_ann_model():
    if ann_model is None:
        load_ann_model()
    return ann_model

def get_ann_scaler():
    if ann_scaler is None:
        load_ann_model()
    return ann_scaler