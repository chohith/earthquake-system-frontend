from flask import Flask, request, jsonify
import numpy as np
import joblib

app = Flask(__name__)

# Load ANN model
model = joblib.load("models/ann_risk_model.pkl")

@app.route("/")
def home():
    return "Backend is running"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    features = np.array(data["features"]).reshape(1, -1)
    prediction = model.predict(features)
    return jsonify({"prediction": float(prediction[0])})

if __name__ == "__main__":
    app.run(debug=True)