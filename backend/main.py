from fastapi import FastAPI
from prediction import predict_earthquake

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Earthquake Prediction API Running"}

@app.post("/predict")
def predict(data: dict):

    sample = [
        data["latitude"],
        data["longitude"],
        data["depth"],
        data["impact_score"],
        data["rolling_mag"],
        data["event_count"]
    ]

    result = predict_earthquake(sample)

    return {"predicted_magnitude": result}