# IEEE Technical Specifications: AI-Driven Earthquake Prediction System

This document outlines the core mathematical formulas, input features, and architectural modules utilized in Pages 1, 2, and 3 of the system. This information is formatted for direct inclusion into the **Methodology** and **System Architecture** sections of an IEEE academic paper.

---

## 1. Input Features & Preprocessing Pipeline
The system relies on real-time spatial and temporal geological telemetry gathered from the **USGS FDSNWS Event API**. For localized deep learning inference, the raw data array is aggregated into six core normalized features (`X`).

**Raw Input Variables:**
*   Latitude (`lat_mean`)
*   Longitude (`lon_mean`)
*   Seismic Depth (`depth_mean`)
*   Average Magnitude (`rolling_mag`)
*   Temporal Event Frequency (`event_count` over a window $W$)
*   Impact Score Approximation (`impact_score` $\approx \sum magnitude$)

### Mathematical Normalization (Feature Scaling)
To prevent exploding gradients in the recurrent architectures, specific geometric and logarithmic transformations are explicitly applied to map the feature space $X_i \in [0, 1]$:
1.  Normalized Latitude: $X_1 = \frac{lat_{mean}}{90.0}$
2.  Normalized Longitude: $X_2 = \frac{lon_{mean}}{180.0}$
3.  Log-Scaled Depth: $X_3 = \frac{\ln(1 + depth_{mean})}{5.0}$
4.  Log-Scaled Impact: $X_4 = \frac{\ln(1 + impact_{score})}{5.0}$
5.  Base Magnitude: $X_5 = \frac{rolling_{mag}}{10.0}$
6.  Frequency Dampening: $X_6 = \frac{\ln(1 + event_{count})}{3.0}$

---

## 2. Predictive Modules & Core Formulas (Analytics Engine)

### 2.1 Regional Prediction Architecture (CNN-LSTM Hybrid)
The forecasting module utilizes independent Convolutional Neural Network (CNN) and Long Short-Term Memory (LSTM) models operating in parallel to extrapolate spatial anomaly patterns and time-series decay.

**A. Output Scaling (Centering)**
The raw tensor outputs from the models $(\hat{y}_{raw} \in [0, 1])$ are mathematically centered around the region's historical `rolling_mag` ($\mu_{mag}$) to ensure realistic tectonic outputs rather than explosive variances.
*   $LSTM_{Scaled} = \max\left(0.0, \min\left(9.9, \mu_{mag} + (\hat{y}_{lstm} - 0.5) \times 3.0\right)\right)$
*   $CNN_{Scaled} = \max\left(0.0, \min\left(9.9, \mu_{mag} + (\hat{y}_{cnn} - 0.5) \times 3.0\right)\right)$

**B. Ensemble Forecast Formula**
The absolute predicted magnitude for the subsequent $T+7$ days is calculated via simple ensembling:
$$Ensemble_{Pred} = \frac{LSTM_{Scaled} + CNN_{Scaled}}{2}$$

**C. Seven-Day Probability Calculation**
The percentage likelihood ($P_{event}$) of a major seismic anomaly occurring is derived from a weighted polynomial utilizing the normalized inputs and the ensemble forecast:
$$P_{event} = \min\left(88.0, \left(\frac{event_{count}}{300}\times 35\right) + \left(\frac{rolling_{mag}}{8}\times 35\right) + \left(\frac{Ensemble_{Pred}}{10}\times 10\right)\right)$$
*(Note: A hard floor of $12.0\%$ is enforced to account for inherent global baseline tectonic risk).*

### 2.2 Global Risk Index (Artificial Neural Network - ANN)
The Global Risk Index computes a dynamic threat level $R \in [1, 100]$ for major active clusters worldwide. It utilizes a multi-layer perceptron (ANN) architecture.

**Weighted Threat Calculation:**
The visual risk score presented to the end-user is a composite function weighting the maximum magnitude observed the frequency of recent events, and the latent output of the ANN risk classifier:
$$W_{mag} = \left(\min(mag_{max}, 10.0) / 10.0\right) \times 60$$
$$W_{freq} = \left(\min(event_{count}, 100) / 100.0\right) \times 20$$
$$W_{ann} = \left(\min(\hat{Y}_{ann}, 100.0) / 100.0\right) \times 20$$

$$Risk Index (R) = \max(1.0, \min(100.0, W_{mag} + W_{freq} + W_{ann}))$$

---

## 3. Web System Architecture & Frontend Modules

### Module 1: Live Monitoring & Geospatial Rendering (Page 1)
*   **Module Type:** WebGL 3D Visualization Pipeline.
*   **Technologies:** Next.js, React, `globe.gl`, Three.js.
*   **Functionality:** Translates real-time USGS GeoJSON coordinate parameters $(Latitude, Longitude, Depth)$ into absolute 3D Cartesian coordinates (`x, y, z`) mapped onto a spherical polygon mesh representing Earth. Applies dynamic atmospheric shaders and renders elevated hexagonal pillars where height $\propto Magnitude$.
*   **Sub-Module (NLP Chatbot):** Implements rule-based Natural Language Processing to detect algorithmic intent (e.g., "how formed", "what is this") and return localized domain-specific geological knowledge.

### Module 2: Analytics & Deep Learning Dashboard (Page 2)
*   **Module Type:** Asynchronous API Polling & Data Presentation.
*   **Technologies:** FastAPI (Backend), Recharts (SVG Graphing), Radix UI.
*   **Functionality:** Interfaces constantly with `/api/predictions/live-region` and `/api/predictions/risk-index`. Features independent React Context states to trigger the Python ML inference only when the user selects a specific spatial constraint (Country), optimizing GPU/CPU load.

### Module 3: Emergency Preparedness Toolkit (Page 3)
*   **Module Type:** Static Caching & Client-side Storage Routing.
*   **Technologies:** React HTML5 `localStorage`, Dynamic Component Rendering.
*   **Functionality:** A state-driven UI grid that utilizes hardcoded JSON dictionaries mapped to specific country ISO codes. It injects dynamic links to the NOAA Tsunami Warning Center and the USGS Incident Map Database. The "Interactive Tracker" utilizes a browser cache state array to maintain checklist persistence across navigation sessions.
