# New Feature: Maldives Tide Station Integration 🌊

## Feature Overview
Integrated real-time tidal data from the University of Hawaii Sea Level Center (UHSLC) for the Maldives. Users can now select from three key stations or define their own values for Design Water Level (DWL) calculations.

## 📍 Supported Stations
The following stations have been added with their characteristic tidal ranges (MHHW - MLLW):

1.  **Male (Station 108)**
    -   Tidal Range: **0.70 m**
    -   *Source: UHSLC Datums*

2.  **Gan (Station 109)**
    -   Tidal Range: **0.78 m**
    -   *Source: UHSLC Datums*

3.  **Hanimaadhoo (Station 117)**
    -   Tidal Range: **0.80 m**
    -   *Source: UHSLC Datums*

## 🛠️ Functionality
- **Selection Dropdown**: A new "Tide Station" dropdown in the Wave Predictor module.
- **Auto-Fill**: Selecting a station automatically populates the "Tidal Range" field with the correct local value.
- **Manual Override**: Selecting "Manual / User Defined" (or simply editing the value) allows for custom input.
- **Tooltips**: Added detailed engineering tooltips for Tide Station, Tidal Range, and Sea Level Rise.

## 🔍 How to Test
1.  Navigate to **Wave Analysis**.
2.  Locate the **Design Water Level (DWL)** section.
3.  Click the **Tide Station** dropdown.
4.  Select **"Male (Stn 108)"**.
5.  Observe the **Tidal Range** automatically update to `0.70 m`.
6.  Select **"Hanimaadhoo (Stn 117)"**.
7.  Observe the value update to `0.80 m`.
8.  Type a custom value (e.g., `1.2`) to override.

## 📝 Usage Note
The default unit for Tide Stations is Meters (m). This integrates seamlessly with the calculation for Design Water Level:
$$DWL = MSL + \frac{\text{Tidal Range}}{2} + SLR + \eta$$
