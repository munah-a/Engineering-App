# Understanding Design Water Level Inputs

## Why do we need "Mean Sea Level" AND "Tidal Range"?

To calculate the **Design Water Level (DWL)**—the critical water level for structure height—we need to know how high the tide gets relative to your survey datum.

The formula used is:
$$DWL = \text{High Tide} + \text{Sea Level Rise} + \text{Wave Setup}$$

Where **High Tide** is approximated as:
$$\text{High Tide} = \text{MSL}_{datum} + \frac{\text{Tidal Range}}{2}$$

### 1. Mean Sea Level (MSL)
This input defines **reference level** of the sea relative to your chart or survey datum.

-   **Scenario A: Working in Chart Datum (CD)**
    -   If your bathymetry maps use Chart Datum (Lowest Astronomical Tide), MSL is typically higher than 0.
    -   *Example Loop:* Enter **~0.6m to 1.0m** (check local tide tables).
-   **Scenario B: Working in MSL**
    -   If your 0.0m is already defined as Mean Sea Level.
    -   *Example:* Enter **0**.

### 2. Tidal Range
This defines the **swing** of the tide (difference between High and Low water).
We use half of this range to estimate how far *above* MSL the High Tide reaches.

-   **Maldives Examples:**
    -   **Male:** ~0.70m
    -   **Hanimaadhoo:** ~0.80m

---

## Tooltip Updates ✅
I have updated the tooltips in the app to explain this clearly:

-   **Mean Sea Level (MSL)**: Explains how to set this based on your project datum (Chart Datum vs MSL).
-   **Tidal Range**: Explains that this is `MHHW - MLLW` and is used to calculate the High Tide level.

Please **refresh your page** to see the new tooltips!
