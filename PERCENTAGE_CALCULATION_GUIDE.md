# Earthquake Risk & Forecast Percentage Calculation Guide

## How to Verify Percentages

### Method 1: Browser Console Logs
1. Open your browser's Developer Tools (Press `F12` or Right-click → Inspect)
2. Go to the **Console** tab
3. Click on any region in the Risk Index tab
4. Look for the detailed calculation logs showing:
   - `========== RISK INDEX CALCULATION ==========`
   - `========== 7-DAY FORECAST CALCULATION ==========`
5. Each log shows the exact formula and intermediate values

### Method 2: On-Screen Breakdown
When you select a region, a "Percentage Calculation Breakdown" section appears showing:
- All component scores with their formulas
- Intermediate calculations
- Final capped values

---

## Risk Index Calculation (0-100 Score)

**Location:** Analytics Dashboard → Risk Index Tab

**Formula:**
```
Risk Index = Magnitude Score + Depth Score + Activity Score
           = [(M/9) × 60] + [((70-D)/70) × 30] + [(E/20) × 10]
```

### Components:

#### 1. Magnitude Score (0-60 points)
- **Formula:** `(Maximum Magnitude / 9.0) × 60`
- **What it means:** Stronger earthquakes = higher risk
- **Examples:**
  - M9.0 earthquake = 60 points (max)
  - M6.5 earthquake = 43.3 points
  - M3.0 earthquake = 20 points

#### 2. Depth Score (0-30 points)
- **Formula:** `((70 - Average Depth) / 70) × 30` (only if depth < 70 km)
- **What it means:** Shallower earthquakes cause more damage
- **Examples:**
  - 10 km deep = 25.7 points (very shallow, high risk)
  - 35 km deep = 15 points
  - 70+ km deep = 0 points (deep, low risk)

#### 3. Activity Score (0-10 points)
- **Formula:** `(Events in 24h / 20) × 10` (capped at 10)
- **What it means:** More frequent activity = higher risk
- **Examples:**
  - 20+ events = 10 points (max)
  - 10 events = 5 points
  - 5 events = 2.5 points

### Example Calculation:
```
Region: Pacific Ring of Fire
- Max Magnitude: 7.2
- Average Depth: 25 km
- Events (24h): 12

Magnitude Score: (7.2/9) × 60 = 48 points
Depth Score: ((70-25)/70) × 30 = 19.3 points
Activity Score: (12/20) × 10 = 6 points
─────────────────────────────
Total Risk Index: 48 + 19.3 + 6 = 73.3 → 73/100 (HIGH)
```

---

## 7-Day Forecast Calculation (0-95%)

**Location:** Analytics Dashboard → Risk Index Tab & Forecast Tab

**Formula:**
```
7-Day Forecast % = MIN(
                    [(M/9) × 40] + 
                    [(E/30) × 40] + 
                    [Trend Factor] + 
                    [Base Confidence]
                  , 95%)
```

### Components:

#### 1. Magnitude Contribution (0-40%)
- **Formula:** `(Maximum Magnitude / 9.0) × 40`
- **What it means:** Larger magnitude earthquakes have higher probability of aftershocks
- **Examples:**
  - M8.0 earthquake = 35.6% (very high probability)
  - M6.5 earthquake = 28.9%
  - M4.0 earthquake = 17.8%

#### 2. Activity Contribution (0-40%)
- **Formula:** `(Events in 24h / 30) × 40` (capped at 40%)
- **What it means:** High activity regions have higher earthquake probability
- **Examples:**
  - 30+ events = 40% (max)
  - 15 events = 20%
  - 5 events = 6.7%

#### 3. Trend Factor (-10% to +20%)
- **Formula:** Based on event trend comparison
- **Calculation Logic:**
  - Last 12 hours vs Previous 12 hours
  - If last 12h > previous 12h × 1.5 → **INCREASING** → +20%
  - If last 12h < previous 12h × 0.7 → **DECREASING** → -10%
  - Otherwise → **STABLE** → 0%
- **Examples:**
  - 20 events (last 12h) vs 10 events (previous 12h) = INCREASING = +20%
  - 5 events (last 12h) vs 10 events (previous 12h) = DECREASING = -10%
  - 10 events (last 12h) vs 12 events (previous 12h) = STABLE = 0%

#### 4. Base Confidence (20%)
- **What it means:** Minimum background probability (always included)

#### 5. Capping at 95%
- **Why:** 100% probability is theoretically impossible to predict; 95% is considered maximum realistic confidence

### Example Calculation:
```
Region: Japan Trench
- Max Magnitude: 7.8
- Events (24h): 18
- Trend: INCREASING (25 events last 12h vs 16 previous 12h)

Magnitude: (7.8/9) × 40 = 34.7%
Activity: (18/30) × 40 = 24.0%
Trend: INCREASING = +20%
Base: 20%
─────────────────────────
Total: 34.7 + 24.0 + 20 + 20 = 98.7%
Capped at 95% = 95% FORECAST
```

---

## Risk Level Classifications

### Risk Index Levels:
- **75-100:** 🔴 CRITICAL - Immediate risk, closely monitor
- **50-74:** 🟠 HIGH - Significant risk, stay alert
- **25-49:** 🟡 MODERATE - Noticeable activity, maintain awareness
- **0-24:** 🟢 LOW - Minimal risk, routine monitoring

### Forecast Probability:
- **75-95%:** 🔴 VERY HIGH - 7-day earthquake highly likely
- **50-74%:** 🟠 HIGH - 7-day earthquake probable
- **25-49%:** 🟡 MODERATE - 7-day earthquake possible
- **0-24%:** 🟢 LOW - 7-day earthquake unlikely

---

## Data Sources

- **Real-time Data:** USGS Earthquake Hazards Program (updated ~2 minutes)
- **24-hour Window:** Current time - 24 hours
- **Geographic Resolution:** By region/country
- **Magnitude Range:** M3.0 and above

---

## Understanding Why Percentages May Seem High

### Important Notes:

1. **7-Day Window is Long**
   - Seismic regions see activity frequently
   - A 75% forecast means "high probability" within 7 days, not imminent

2. **Multiple Magnitude Scales**
   - The forecast includes M3.0+ earthquakes
   - These occur regularly (thousands per year globally)

3. **Active Zones**
   - Ring of Fire, Mid-Ocean Ridges see daily activity
   - Higher percentages are realistic for these areas

4. **Trend Matters**
   - Increasing activity adds confidence to forecast
   - Foreshock sequences have higher probabilities

---

## Verification Methods

### Check 1: Compare with Recent Activity
- Click a region and note the event count (24h)
- Cross-check: More events = higher forecast expected ✓

### Check 2: Verify Component Scores
- Open console (F12 → Console)
- Look for the breakdown showing each component
- Sum them manually to verify the total

### Check 3: Cross-Reference with USGS
- Visit: https://earthquake.usgs.gov
- Compare magnitudes and recent events
- Should match our calculations

### Check 4: Monitor Trends Over Time
- Note risk index now
- Refresh in 30 minutes
- If more events: risk should increase (or stay same)
- If fewer events: risk should decrease

---

## Technical Details

### Calculation Timing:
- **Updates:** Every 5 minutes
- **Data Fetch:** From `/api/earthquake-data/24hours`
- **Processing:** Client-side in browser
- **Caching:** No-store (always fresh data)

### Accuracy Factors:
- ✓ Uses USGS real-time data
- ✓ Multiple seismic parameters
- ✓ Trend analysis over time
- ✓ Geographic grouping
- ✓ Probabilistic methodology

### Limitations:
- ⚠ Cannot predict exact time/magnitude
- ⚠ Large earthquakes (M7+) are rare
- ⚠ Black swan events possible
- ⚠ Local geological factors may vary

---

## Troubleshooting

### High percentages everywhere?
→ Global seismic activity is high (normal) → Check specific region trends

### Percentages not updating?
→ Click "Refresh" button → Check console for errors (F12)

### Zero forecast percentage?
→ Insufficient data for that region → Need more events or higher magnitudes

### Different from other sources?
→ Different methodologies, time windows, magnitude thresholds → Always cross-reference

---

## Questions?

For detailed scientific background, refer to:
- USGS Earthquake Hazards Program
- Probabilistic Seismic Hazard Analysis (PSHA)
- Gutenberg-Richter Frequency-Magnitude Relation
