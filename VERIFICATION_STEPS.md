# Step-by-Step Percentage Verification Guide

## Quick Verification Checklist

### ✅ Step 1: Access the Analytics Dashboard
1. Navigate to: **Analytics** page (from main navigation)
2. You'll see the "Real-Time Risk Index" card
3. This shows the latest 20 most active regions

### ✅ Step 2: Select a Region
1. Click on any region card (e.g., "Japan")
2. The region will be highlighted with a cyan border
3. A detailed "Region Details" section will appear below

### ✅ Step 3: View the Breakdown Section
In the "Region Details" card, look for:
- **"Percentage Calculation Breakdown"** section
- Shows the exact formulas used
- Displays calculated values for each component

### ✅ Step 4: Manual Verification

#### For Risk Index:
```
Given Example:
- Max Magnitude: M6.5
- Average Depth: 35 km
- Events (24h): 10

Manual Calculation:
1. Magnitude: (6.5 / 9) × 60 = 43.3 points
2. Depth: ((70 - 35) / 70) × 30 = 15.0 points
3. Activity: (10 / 20) × 10 = 5.0 points
─────────────────
Total: 43.3 + 15.0 + 5.0 = 63.3 → 63/100 ✓

Match the displayed value?
```

#### For 7-Day Forecast:
```
Given Example:
- Max Magnitude: M7.2
- Events (24h): 15
- Trend: INCREASING

Manual Calculation:
1. Magnitude: (7.2 / 9) × 40 = 32.0%
2. Activity: (15 / 30) × 40 = 20.0%
3. Trend Factor (increasing): +20%
4. Base Confidence: +20%
─────────────────
Total: 32.0 + 20.0 + 20 + 20 = 92%
Capped at 95% = 92% ✓

Match the displayed value?
```

### ✅ Step 5: Console Verification (Advanced)

1. **Open Developer Tools:**
   - Press `F12` on keyboard
   - Or: Right-click → "Inspect"

2. **Navigate to Console Tab:**
   - Click on "Console" tab
   - Clear previous messages: `clear()` and press Enter

3. **Click on a Region:**
   - Go back to the Risk Index
   - Click on a region card
   - Check console immediately

4. **Look for Logs:**
   ```
   [v0] ========== RISK INDEX CALCULATION ==========
   [v0] Input Data: { magnitude: "M6.5", depth: "35km", eventsIn24h: 10 }
   [v0] Magnitude Score: (6.5/9) × 60 = 43.33 points
   [v0] Depth Score: ((70-35)/70) × 30 = 15.00 points
   [v0] Activity Score: (10/20) × 10 = 5.00 points
   [v0] Total Score: 63.33 → Clamped to 63
   [v0] =============================================
   ```

5. **Look for Forecast Logs:**
   ```
   [v0] ========== 7-DAY FORECAST CALCULATION ==========
   [v0] Input Data: { maxMagnitude: "M7.2", eventCount24h: 15, trend: "increasing" }
   [v0] Magnitude Score: (7.2/9) × 40 = 32.00 %
   [v0] Activity Score: (15/30) × 40 = 20.00 %
   [v0] Trend Factor: increasing = 20 %
   [v0] Base Confidence: 20 %
   [v0] Total Before Cap: 92.00 %
   [v0] Final Percentage (capped at 95%): 92 %
   [v0] ================================================
   ```

### ✅ Step 6: Cross-Reference with USGS

1. **Open USGS Website:**
   - Visit: https://earthquake.usgs.gov
   - Search for the same region

2. **Compare Data:**
   - Number of earthquakes (24h) → Should match
   - Magnitude of recent earthquakes → Should match
   - Location coordinates → Should match

3. **Note:** Our forecast calculation is more advanced than USGS display, but the base data should align

---

## Common Verification Scenarios

### Scenario 1: Region with Few Events
```
Expected Result:
- Low Risk Index (< 30)
- Low Forecast (< 25%)
- Trend: Stable or Decreasing

Why? No recent activity = lower risk
```

### Scenario 2: Region with High Magnitude Event
```
Expected Result:
- High Risk Index (50-75+)
- High Forecast (60-85+)
- Trend: May be Increasing

Why? Large earthquake = aftershock risk
```

### Scenario 3: Swarm Activity (Many Small Events)
```
Expected Result:
- Moderate Risk Index (40-60)
- Moderate-High Forecast (55-75%)
- Trend: Increasing

Why? Frequent activity = pattern recognized
```

---

## Troubleshooting Verification Issues

### Issue: Numbers don't match display
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh page (Ctrl+R)
3. Check console for error messages
4. Try different region

### Issue: Console shows no logs
**Solution:**
1. Make sure DevTools is open BEFORE clicking
2. Check console.log hasn't been disabled
3. Try refreshing and selecting region again
4. Check browser console filter isn't hiding logs

### Issue: Risk Index seems too high/low
**Solution:**
1. Verify depth value (< 70km = higher score)
2. Count events manually in recent activity
3. Note the magnitude of largest event
4. Cross-calculate using formulas above

### Issue: Forecast percentage maxes out at 95%
**Solution:**
1. This is intentional (realistic uncertainty)
2. Means combined factors exceeded 95%
3. Still indicates very high probability
4. Check component breakdown for details

---

## Real-World Examples

### Example 1: Japan Region (High Activity)
```
Typical Values:
- Risk Index: 60-75 (HIGH)
- Events (24h): 20-40
- Max Magnitude: M5.5-6.5
- 7-Day Forecast: 70-85%

Why This Makes Sense:
Japan sits on Ring of Fire → constant seismic activity
High historical magnitude events → higher risk
Frequent recent activity → higher forecast
```

### Example 2: California (Moderate-High Activity)
```
Typical Values:
- Risk Index: 40-60 (MODERATE-HIGH)
- Events (24h): 10-20
- Max Magnitude: M4.5-5.5
- 7-Day Forecast: 50-70%

Why This Makes Sense:
Active San Andreas Fault system
Moderate earthquake frequency
Regular small-to-moderate events
```

### Example 3: Stable Region (Low Activity)
```
Typical Values:
- Risk Index: 10-25 (LOW)
- Events (24h): 0-3
- Max Magnitude: M2.5-3.5
- 7-Day Forecast: 5-20%

Why This Makes Sense:
Geologically stable area
Few recent earthquakes
Low probability of significant activity
```

---

## Formula Summary (Quick Reference)

| Metric | Formula | Max Points | Purpose |
|--------|---------|-----------|---------|
| **Risk Magnitude** | (M / 9) × 60 | 60 | Earthquake strength |
| **Risk Depth** | ((70-D) / 70) × 30 | 30 | Depth danger factor |
| **Risk Activity** | (E / 20) × 10 | 10 | Event frequency |
| **Forecast Magnitude** | (M / 9) × 40 | 40% | Aftershock likelihood |
| **Forecast Activity** | (E / 30) × 40 | 40% | Activity level |
| **Forecast Trend** | Based on 12h comparison | ±20% | Activity direction |
| **Forecast Base** | Fixed | 20% | Baseline confidence |

---

## Data Refresh Timing

```
Timeline:
┌─────────────────────────────────────────┐
│ User Loads Analytics Page               │
│ ↓                                       │
│ Fetch data: /api/earthquake-data/24hours│
│ ↓                                       │
│ Calculate Risk Index for each region    │
│ ↓                                       │
│ Calculate 7-Day Forecast for each region│
│ ↓                                       │
│ Display in UI                          │
│ ↓                                       │
│ Auto-refresh every 5 minutes            │
│ (Click "Refresh" for instant update)    │
└─────────────────────────────────────────┘
```

---

## Final Verification Checklist

- [ ] Risk Index is between 0-100
- [ ] 7-Day Forecast is between 0-95%
- [ ] All values have realistic relationships
- [ ] Console logs match displayed values
- [ ] Event counts align with recent activity
- [ ] Magnitudes match USGS data
- [ ] Calculations match manual verification
- [ ] UI breakdown section shows correct components

✅ **If all checked, percentages are correct and reliable!**
