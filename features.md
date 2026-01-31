# Core Coastal Engineering Features

## Wave Predictor
- **Fetch-limited wave growth** for lagoons using SMB and JONSWAP
- **Depth-limited breaking wave height calculator** using Miche and Goda criteria
- **Design Water Level (DWL) tool** incorporating:
  - Tides
  - Wave Set-up
  - Sea Level Rise

## Armour Stability Suite (Rubble Mound Structures)
- **Hudson formula** for preliminary sizing
- **Van der Meer formulae** for detailed stability under plunging and surging waves
- **Material database** with customizable densities (e.g., Coral rock, Granite, Concrete)
- **Shallow water modification toggle** for reef-based structures
- **Structure-specific design logic** for:
  - Conventional rubble mound breakwaters
  - Berm breakwaters
  - Reef breakwaters
  - Low-crested structures

### Complete Rubble Mound Cross-Section Structure

A comprehensive layer-by-layer breakwater design system from crest to foundation, with all calculations and specifications:

---

#### 1. **Crest Structure**
The uppermost part of the breakwater providing final protection and access.

**Components:**
- **Crest Width (Gc)**
  - Minimum width: `Gc = 3 × Dn50(armour)` or 3m minimum for maintenance access
  - Typical range: 3-8m depending on functionality (road access, crane operations)
  - Calculate based on: `Gc = k × n × (M50/ρ)^(1/3)` where k=1.0-1.5, n=2-3 layers

- **Crest Elevation (Rc)**
  - Freeboard above Design Water Level (DWL)
  - Calculate to limit overtopping: `q = acceptable discharge (l/s/m)`
  - Using EurOtop: `q/√(g×Hm0³) = 0.2 × exp[-2.6 × Rc/(Hm0 × γf × ξ)]`
  - Typical Rc: 1.5-4.0m above DWL

- **Crest Armour**
  - Same or slightly lighter than slope armour
  - Mass: 0.8-1.0 × M50(slope)
  - Layer thickness: 2-3 stones thick
  - Crown wall option: Concrete cap for wave return and access

**Design Parameters Input:**
- [ ] Crest width (Gc) [m]
- [ ] Crest elevation above DWL (Rc) [m]
- [ ] Crest armour type (rock/concrete/crown wall)
- [ ] Crown wall dimensions if applicable [m]

---

#### 2. **Primary Armour Layer (Slope Protection)**
Main wave-resistant layer designed using Van der Meer or Hudson formulas.

**Seaward Slope (Weather Side):**
- **Armour Stone Mass (M50)**
  - Van der Meer (Plunging): `Hs/ΔDn50 = 6.2 × P^0.18 × (S/√N)^0.2 × ξm^(-0.5)`
  - Van der Meer (Surging): `Hs/ΔDn50 = 1.0 × P^(-0.13) × (S/√N)^0.2 × √(cotα) × ξm^P`
  - Hudson: `W = (ρr × g × H³)/(KD × (ρr/ρw - 1)³ × cotα)`
  - Where: Δ = (ρr/ρw - 1), Dn50 = (M50/ρr)^(1/3)

- **Layer Thickness**
  - Minimum: `t = 2 × Dn50` (2 layers)
  - Recommended: `t = 3 × Dn50` for durability
  - With safety: `t = n × kΔ × Dn50` where n=2-3, kΔ=1.0-1.15

- **Slope Angle (α)**
  - Common slopes: 1:1.5 (cotα=1.5), 1:2 (cotα=2.0), 1:3 (cotα=3.0)
  - Steeper slopes (cotα=1.5): Require heavier armour but less material volume
  - Gentler slopes (cotα=3.0): Lighter armour but wider structure

- **Grading Requirements**
  - Narrow grading: M85/M15 = 1.5-2.5 (uniform size)
  - Wide grading: M85/M15 = 3-5 (economy, better interlocking)
  - Check: M85 < 2.0 × M15 for stability

- **Placement Specifications**
  - Packing density: n = 1.15-1.25 stones/m²
  - Porosity: 35-45%
  - Individual placement for M50 > 1 tonne
  - Dumped placement for smaller stones with correction factors

**Leeward Slope (Harbor Side):**
- Reduced wave action allows lighter armour
- Mass: 0.5-0.7 × M50(seaward) typical
- Can use same slope or flatter (e.g., 1:1.5 seaward, 1:2 leeward)

**Armour Types:**
1. **Natural Rock Armour**
   - Quarry rock: ρ = 2600-2800 kg/m³
   - Coral rock: ρ = 2000-2200 kg/m³ (if available locally)
   - Granite, basalt, limestone depending on availability

2. **Concrete Armour Units**
   - Cubes: ρ = 2400 kg/m³, KD = 5.5-7.5
   - Tetrapods: KD = 7.0-12.0, single layer possible
   - Accropode: KD = 15-20, single layer, no reinforcement
   - Core-Loc, Xbloc, other proprietary units

**Design Parameters Input:**
- [ ] Slope angle seaward (cotα) [ratio]
- [ ] Slope angle leeward (cotα) [ratio]
- [ ] Armour type (rock/concrete unit type)
- [ ] Armour density (ρr) [kg/m³]
- [ ] Damage level (S) [typical: 2-3]
- [ ] Number of waves (N) [typical: 3000]
- [ ] Permeability coefficient (P) [0.1-0.6]
- [ ] Stability coefficient (KD) [depends on unit type]

**Calculated Outputs:**
- [ ] Required M50 [tonnes]
- [ ] Required M85 [tonnes]
- [ ] Required M15 [tonnes]
- [ ] Dn50 [m]
- [ ] Layer thickness [m]
- [ ] Number of armour units required [count]
- [ ] Volume of armour layer [m³]

---

#### 3. **Secondary Armour / Underlayer 1**
Transition layer between primary armour and filter layer.

**Purpose:**
- Prevent primary armour from penetrating into filter layer
- Provide stable bedding for armour units
- Contribute to overall structure weight and stability

**Sizing Criteria:**
- **Mass ratio**: `M50(underlayer) = M50(armour) / 10 to M50(armour) / 15`
- **Volume ratio**: Typically 10% of armour mass
- **Filter rule**: `D85(underlayer) / D15(armour) < 4.0` (prevent loss through voids)

**Layer Specifications:**
- **Thickness**: `t = 2 × Dn50(underlayer)` minimum
- **Grading**: M85/M15 ≤ 2.5
- **Typical mass range**: 50-500 kg per stone
- **Placement**: Dumped or light mechanical placement

**Design Parameters Input:**
- [ ] Underlayer mass ratio (1/10 to 1/15 of armour)
- [ ] Layer thickness multiplier [typically 2]
- [ ] Grading specification

**Calculated Outputs:**
- [ ] Underlayer M50 [tonnes or kg]
- [ ] Underlayer Dn50 [m]
- [ ] Layer thickness [m]
- [ ] Volume required [m³]

---

#### 4. **Filter Layer / Underlayer 2**
Critical layer preventing core material migration while maintaining drainage.

**Purpose:**
- Prevent fine core material from washing out through armour voids
- Maintain permeability for internal drainage
- Distribute loads from upper layers

**Filter Rules (Terzaghi Criteria):**
1. **Retention**: `D15(filter) / d85(core) < 5` (prevents core washout)
2. **Permeability**: `D15(filter) / d15(core) > 4` (maintains drainage)
3. **Grading**: `D60/D10 < 20` (well-graded material)

**Alternative Rock Manual Criteria:**
- `D50(filter) / D50(core) = 10 to 20`
- This simpler ratio often used for preliminary design

**Layer Specifications:**
- **Thickness**: Minimum 0.3m or `2 × D50(filter)`, whichever is greater
- **Minimum 2 layers** of filter stones
- **Typical stone size**: 10-200 kg
- **Gradation**: Relatively uniform to maintain permeability

**Design Parameters Input:**
- [ ] Core D85 size [mm or m]
- [ ] Filter rule ratio (D15/d85) [typically 3-5]
- [ ] Minimum layer thickness [m]
- [ ] Number of layers [typically 2]

**Calculated Outputs:**
- [ ] Filter D15 [mm]
- [ ] Filter D50 [mm]
- [ ] Filter D85 [mm]
- [ ] Layer thickness [m]
- [ ] Volume required [m³]
- [ ] Filter rule compliance check [Pass/Fail]

---

#### 5. **Core Layer**
The main structural body providing bulk, weight, and economy.

**Purpose:**
- Provide bulk volume economically
- Contribute to overall structure weight for stability
- Dissipate wave energy through permeability/impermeability
- Settlement control

**Core Types:**

**A. Permeable Core (High Permeability)**
- **Material**: Quarry run, 1-500 kg stones, wide grading
- **Advantages**: 
  - Reduces internal pressures
  - Lower wave reflection
  - Better energy dissipation
  - Cheaper (uses all quarry sizes)
- **Disadvantages**:
  - Requires more careful filter design
  - Potential for settlement
- **Typical use**: Conventional breakwaters

**B. Impermeable Core (Low Permeability)**
- **Material**: Select fill, graded gravel, or low-permeability rockfill
- **Advantages**:
  - Reduces flow through structure
  - Can reduce armour damage in some cases
  - Better for composite structures with vertical wall
- **Disadvantages**:
  - Higher internal pressures
  - More expensive
  - Increased wave reflection
- **Typical use**: Composite breakwaters, special cases

**C. Core with Impermeable Barrier**
- **Material**: Core + geomembrane or clay layer
- **Purpose**: Prevent seawater intrusion for special applications
- **Use case**: Lagoon creation, freshwater protection

**Design Specifications:**
- **Material gradation**: D85/D15 typically 5-50 (wide grading acceptable)
- **Porosity**: 35-40% typical
- **Settlement allowance**: 2-5% of core height
- **D50 range**: 25-300mm typical

**Design Parameters Input:**
- [ ] Core type (permeable/impermeable/barrier)
- [ ] Core material D50 [mm]
- [ ] Core material D85 [mm]
- [ ] Core density (ρcore) [kg/m³]
- [ ] Porosity [%]
- [ ] Settlement allowance [%]

**Calculated Outputs:**
- [ ] Core volume (solid) [m³]
- [ ] Core volume (in-situ with porosity) [m³]
- [ ] Core weight [tonnes]
- [ ] Expected settlement [m]

---

#### 6. **Bedding / Foundation Layer**
Transition between core and seabed, provides stable foundation.

**Purpose:**
- Distribute weight evenly on foundation soil
- Prevent core material loss into seabed
- Provide level platform for construction
- Control settlement

**Components:**

**A. Bedding Layer (Granular)**
- **Material**: Graded stone, 5-100 kg
- **Thickness**: 0.3-0.6m typical
- **Function**: Load distribution, scour protection
- **D50**: Designed using filter rules with respect to foundation soil

**B. Geotextile Foundation Layer**
- **Purpose**:
  - Separation between rock and soft soils
  - Prevent soil pumping through rock voids
  - Improve bearing capacity
  - Control settlement
- **Type**: 
  - Non-woven geotextile for separation and filtration
  - Woven geotextile for reinforcement
- **Properties**:
  - Apparent Opening Size (AOS): O95 < d85(soil) × 1.5
  - Permeability: Higher than foundation soil
  - Tensile strength: Varies with foundation conditions
- **Application**:
  - Required for soft clay or silt foundations
  - Optional for sand foundations but recommended
  - Essential for D50(bedding) > 50mm on fine soils

**Filter Rule for Bedding:**
- `D15(bedding) / d85(foundation) < 5`
- `D15(bedding) / d15(foundation) > 4`

**Design Parameters Input:**
- [ ] Foundation soil type (clay/silt/sand/rock)
- [ ] Foundation soil d85 [mm]
- [ ] Foundation bearing capacity [kPa]
- [ ] Bedding layer thickness [m]
- [ ] Geotextile required [Yes/No]
- [ ] Geotextile AOS [mm]

**Calculated Outputs:**
- [ ] Bedding D15 [mm]
- [ ] Bedding D50 [mm]
- [ ] Bedding thickness [m]
- [ ] Geotextile specifications
- [ ] Bearing pressure on foundation [kPa]
- [ ] Settlement prediction [m]

---

#### 7. **Toe Structure (Critical Component)**
Foundation-level protection at the base of the slope, preventing undermining.

**Toe Design Philosophy:**
The toe is one of the most critical elements - failure of the toe often leads to progressive failure of the entire structure.

**Toe Functions:**
1. **Structural Support**: Provides stability to overlying armour slope
2. **Scour Protection**: Prevents erosion of foundation material
3. **Load Distribution**: Transfers structure weight to foundation
4. **Wave Energy Dissipation**: First line of defense against wave attack

---

**TOE CONFIGURATION OPTIONS:**

**Option 1: Standard Toe Berm (Most Common)**

*Most widely used, suitable for firm foundations and moderate wave action.*

- **Toe Width (Btoe)**:
  - Empirical: `Btoe = 3-5 × Dn50(toe stones)`
  - Typical: 5-12m depending on water depth and wave height
  - Minimum: 3m for stability

- **Toe Height/Thickness (htoe)**:
  - `htoe = 2-3 × Dn50(toe)` (2-3 layers minimum)
  - Typical: 2-4m

- **Toe Stone Sizing**:
  - Generally: `M50(toe) = M50(armour) / 2 to M50(armour)` (same or half)
  - For shallow water (breaking waves): May require M50(toe) = M50(armour)
  - For deep water: M50(toe) = 0.5 × M50(armour) acceptable
  - Van der Meer toe formula:
    ```
    htoe/Dn50 = 3.0 to 4.0 (recommended)
    Btoe/Dn50 = 5.0 to 10.0
    ```
  - Hudson formula for toe:
    ```
    Wtoe = (ρr × g × H³) / (KD × (Sr-1)³ × cotα)
    where KD(toe) = 2.0-3.0 (conservative)
    ```

- **Embedment Depth Below Seabed (he)**:
  - **Scour calculation** (using Sumer & Fredsøe):
    ```
    S = 1.3 × Hs × (Tp/√(g×d))^0.5
    S = expected scour depth
    ```
  - **Embedment depth**:
    ```
    he = S + 0.5m (safety margin)
    he = 1.0-3.0m typical
    ```
  - **Absolute minimum**: 1.0m below natural seabed

- **Toe Crest Level**:
  - Below DWL: -1.0m to -3.0m typical
  - Adjust based on tidal range and wave rundown

**Design Parameters:**
- [ ] Toe width (Btoe) [m]
- [ ] Toe height (htoe) [m]
- [ ] Toe stone M50 [tonnes]
- [ ] Toe crest elevation [m MSL]
- [ ] Embedment depth (he) [m]
- [ ] Foundation soil type

---

**Option 2: Launched Toe (Dynamic Placement)**

*Allows stones to settle naturally, often used in deep water or difficult access.*

- **Concept**: Stones dumped from above, self-arrange on seabed
- **Advantages**:
  - Simpler construction (no diver placement)
  - Adapts to irregular seabed
  - Self-adjusting to scour
- **Disadvantages**:
  - Less precise geometry
  - Typically requires 20-40% extra material
  - Larger stones needed (1.25-1.5 × calculated M50)

- **Design Specifications**:
  - Launched stone mass: `M50(launched) = 1.5 × M50(designed)`
  - Drop height consideration: Additional energy requires heavier stones
  - Wider toe berm: `Btoe = 1.5 × standard width`

**Design Parameters:**
- [ ] Launched toe width [m]
- [ ] Launching method (barge/crane)
- [ ] Stone size multiplier [1.25-1.5]
- [ ] Overdumping allowance [%]

---

**Option 3: Sheet Pile Toe**

*Used when scour is excessive or foundation is very soft.*

- **Components**:
  - Steel or concrete sheet pile wall
  - Rock berm on seaward side for scour protection
  - Tie-backs or anchoring if needed

- **Advantages**:
  - Positive cutoff against scour
  - Suitable for very soft soils
  - Defines toe position precisely
  - Can extend deep for piling bearing

- **Disadvantages**:
  - Expensive
  - Requires specialized equipment
  - Corrosion issues with steel
  - Complex construction

- **Design Considerations**:
  - Sheet pile depth: To suitable bearing stratum or `d + 3-5m`
  - Sheet pile strength: Design for lateral earth/wave pressures
  - Toe rock protection: Standard berm on seaward side
  - Corrosion protection: Coating, cathodic protection, or concrete piles

**Design Parameters:**
- [ ] Sheet pile type (steel/concrete)
- [ ] Sheet pile length [m]
- [ ] Sheet pile section modulus [cm³]
- [ ] Toe rock berm width [m]
- [ ] Corrosion protection type

---

**Option 4: Rock-Filled Mattress Toe (Gabion Type)**

*Used for soft foundations or where settling is expected.*

- **Components**:
  - Geotextile or wire-mesh containers filled with rock
  - Flexible mat that conforms to seabed
  - Typically 1-3m thick

- **Advantages**:
  - Conforms to soft/irregular seabed
  - Distributes load over wide area
  - Flexible - tolerates settlement
  - Can be pre-fabricated

- **Disadvantages**:
  - Mesh durability concerns (corrosion, abrasion)
  - More expensive than standard toe
  - Limited life in aggressive wave climates

- **Design Specifications**:
  - Mattress thickness: 1.0-3.0m
  - Mattress width: 5-15m
  - Fill stone size: 100-500mm (must fit through mesh)
  - Mesh specification: Galvanized or PVC-coated, 80mm-150mm openings

**Design Parameters:**
- [ ] Mattress dimensions [L × W × H]
- [ ] Fill stone size [mm]
- [ ] Mesh type and coating
- [ ] Number of mattress units required

---

**Option 5: Combined Toe + Bund**

*Used in very deep water or on steep slopes.*

- **Configuration**:
  - Raised bund (pre-constructed mound) on seabed
  - Toe berm placed on top of bund
  - Reduces total stone requirements by raising foundation level

- **Advantages**:
  - Economy in deep water (reduces total height)
  - Can use smaller stones for bund core
  - Improves foundation bearing if soil is stratified

**Design Parameters:**
- [ ] Bund crest elevation [m MSL]
- [ ] Bund crest width [m]
- [ ] Bund slope (typically 1:3 to 1:5)
- [ ] Bund core material
- [ ] Toe berm on bund dimensions

---

**TOE DESIGN PROCEDURE:**

1. **Determine Design Water Depth at Toe** (dtoe)
   - `dtoe = DWL + wave setup - seabed elevation at toe`

2. **Calculate Design Wave Height at Toe**
   - Check for depth-limited breaking: `Hb,max = 0.78 × dtoe`
   - Use lesser of: Htoe = min(Hs, Hb,max)

3. **Assess Scour Potential**
   - Calculate expected scour depth using:
     ```
     S = 1.3 × Hs × (Tp/√(g×d))^0.5  [Sumer & Fredsøe]
     or
     S = 0.5 × Hs [Conservative estimate]
     ```
   - For non-cohesive soils (sand): Higher scour risk
   - For cohesive soils (clay): Lower scour risk but erosion possible
   - For rock foundation: Minimal scour

4. **Size Toe Stones**
   - Use Hudson formula with KD = 2.0-3.0 (conservative)
   - Or use: Mtoe = 0.5 to 1.0 × Marmour
   - Check Van der Meer stability for toe:
     ```
     Ns = Hs/(Δ×Dn50) ≤ 1.5-2.0 for toe berm
     ```

5. **Determine Toe Geometry**
   - Width: Btoe = 3-5 × Dn50,toe or 5-12m minimum
   - Height: htoe = 2-3 × Dn50,toe
   - Embedment: he = Scour depth + 0.5m minimum

6. **Select Toe Configuration**
   - Standard berm: Normal conditions, firm foundation
   - Launched toe: Deep water, access difficulties
   - Sheet pile: Excessive scour, very soft soils
   - Mattress: Soft soils with settlement concerns
   - Combined: Deep water economy

7. **Foundation Check**
   - Calculate bearing pressure: σ = Weight / Contact area
   - Compare with soil bearing capacity
   - Check settlement using soil mechanics principles

**Calculator Required Inputs:**
- [ ] Water depth at toe location (dtoe) [m]
- [ ] Design wave height (Hs) [m]
- [ ] Wave period (Tp) [s]
- [ ] Foundation soil type
- [ ] Foundation bearing capacity [kPa]
- [ ] Toe configuration preference
- [ ] Armour M50 (for reference) [tonnes]

**Calculator Outputs:**
- [ ] Recommended toe stone M50 [tonnes]
- [ ] Toe width (Btoe) [m]
- [ ] Toe height (htoe) [m]
- [ ] Toe crest elevation [m MSL]
- [ ] Embedment depth (he) [m]
- [ ] Expected scour depth [m]
- [ ] Toe volume [m³]
- [ ] Number of toe stones required
- [ ] Bearing pressure on foundation [kPa]
- [ ] Foundation adequacy check [Pass/Fail]
- [ ] Geotextile requirement [Yes/No]

---

#### 8. **Special Features and Accessories**

**A. Crown Wall / Superstructure**
- **Purpose**: Wave return, crest access, reduce overtopping
- **Types**:
  - Vertical concrete wall (most common)
  - Recurved wall (enhanced wave return)
  - Parapet with chambers
- **Dimensions**: Height 1-4m above crest armour
- **Design**: Must resist overtopping forces, uplift, sliding

**B. Wave Screens / Parapets**
- **Purpose**: Reduce overtopping discharge
- **Configuration**: Perforated or solid wall on crest
- **Height**: 1-2m typical
- **Effectiveness**: Can reduce overtopping by 50-70%

**C. Internal Drainage**
- **Purpose**: Prevent pore pressure buildup
- **Methods**:
  - Perforated pipes in core
  - Gravel drain layers
  - Weep holes in vertical elements
- **Critical for**: Impermeable cores, composite structures

**D. Access Features**
- **Roads**: Minimum 3m width on crest
- **Ramps**: 1:10 to 1:15 slope typical
- **Lighting**: For operational harbors
- **Mooring**: Dolphins, bollards, cleats

---

### Implementation in Cross-Section Designer

The designer should provide:

1. **Layer-by-Layer Input Mode**
   - Step through each layer from crest to toe
   - Intelligent defaults based on previous layers
   - Filter rule automatic checking

2. **Visual Cross-Section Builder**
   - Interactive canvas showing all layers
   - Real-time geometry updates
   - Color-coded layers for clarity
   - Dimension annotations

3. **Calculation Engine**
   - Automatic Van der Meer / Hudson calculations
   - Filter rule compliance checking
   - Volume and quantity calculations
   - Material cost estimation

4. **Template System**
   - Save complete cross-sections as templates
   - Load standard configurations:
     - Light duty (Hs < 2m)
     - Medium duty (Hs 2-4m)
     - Heavy duty (Hs > 4m)
     - Special (reef, berm, etc.)

5. **Output Reports**
   - Layer-by-layer specifications
   - Material quantities by layer
   - Construction drawings
   - Stability check results

## Vertical Structures
- **Goda formula (2000)** for wave pressure calculation:
  - Corrects for wave modifications due to rubble mound foundation.
  - Calculates $\alpha_2$ coefficient explicitly based on foundation geometry.
- **Sliding and overturning stability** analysis
- **Foundation bearing capacity** verification
- **Caisson design** with dimensions and weight optimization
- **Wave reflection coefficient** estimation
- **Structure-specific design logic** for:
  - Vertical wall breakwaters
  - Composite breakwaters (rubble mound foundation + vertical wall)
  - Caisson breakwaters
  - Sheet pile structures
  - Perforated caissons for reduced reflection

## Cross-Section Designer
- **Graphical and input-driven interface** for intuitive design
- **Template library** with pre-configured cross-sections:
  - Rubble mound variants (standard, berm, reef, low-crested)
  - Vertical wall types (solid, composite, perforated)
  - Revetment profiles (simple, complex multi-layer)
  - Custom template creation and saving
- **Interactive slope and crest configuration** with real-time visualization
- **Automated filter and underlayer sizing** based on the Rock Manual
- **Toe protection and scour depth estimator**
- **Structure-specific calculation engine**:
  - Each template follows its own design methodology
  - Automatic parameter validation for selected structure type
  - Context-aware recommendations based on site conditions

## Serviceability Analysis
- **EurOtop II (2018)-based mean overtopping discharge** ($q$):
  - Uses Weibull distribution (shape parameter `c=1.3`) for both breaking and non-breaking waves.
  - Implements Eq 5.10 (Breaking) and Eq 5.11 (Non-breaking).
- **Individual wave volume** ($V_{max}$) hazard assessment
- **Safety threshold indicators** for:
  - Pedestrians
  - Vehicles
  - Buildings

## User Interface Tooltips

### Label Tooltips
All form labels and section headers should include contextual tooltips that:
- **Define the engineering term** in clear, accessible language
- **Provide context** on why the parameter matters
- **Reference standards** when applicable (e.g., "as per CIRIA, CEM, or EurOtop guidelines")
- **Examples**:
  - **"Significant Wave Height (Hs)"**: "The average height of the highest one-third of waves in a sea state. Used as the primary design wave parameter in coastal engineering."
  - **"Design Water Level (DWL)"**: "The maximum expected water level including tide, surge, wave setup, and sea level rise. Critical for determining structure crest elevation."
  - **"Damage Level (S)"**: "Acceptable damage parameter for Van der Meer formula. S=2-3 for initial damage, S=8+ for severe reshaping."

### Input Parameter Tooltips
All input fields should display tooltips explaining:
- **Expected value range** (e.g., "Typical range: 1.0 - 5.0 m")
- **Units** and conversion notes (e.g., "Enter in meters; 1m = 3.28ft")
- **Impact on design** (e.g., "Lower values result in lighter armour units but higher risk")
- **Data source guidance** (e.g., "Obtain from wave hindcast studies or buoy measurements")
- **Examples**:
  - **"Wave Period (Tp)"**: "Peak wave period in seconds. Typical range: 4-15s. Longer periods increase wave forces and overtopping. Source: Wave measurement data or fetch calculations."
  - **"Armour Density (ρa)"**: "Mass density of armour material in kg/m³. Granite: ~2650, Concrete: ~2400, Coral rock: ~2100. Higher density = more stable units."
  - **"Structure Slope (cotα)"**: "Horizontal to vertical ratio (e.g., 1.5 = 3V:2H). Steeper slopes (lower values) require larger armour but use less material overall."

### Output Parameter Tooltips
All calculated results and outputs should include tooltips that:
- **Explain the significance** of the result
- **Provide interpretation guidelines** (e.g., "Values < 1.0 indicate instability")
- **Reference acceptance criteria** from design codes
- **Suggest next steps** based on the result
- **Examples**:
  - **"Required Armour Stone Mass (M50)"**: "Median mass of primary armour units in tonnes. Result indicates the 50-percentile weight needed for stability. Round up to available quarry sizes."
  - **"Stability Number (Ns)"**: "Dimensionless parameter indicating armour stability under wave attack. Ns > design limit means armour is too light; increase unit size."
  - **"Overtopping Discharge (q)"**: "Mean overtopping rate in l/s/m. Compare with allowable limits: q<0.1 for pedestrians, q<10 for vehicles, q<50 for property protection."
  - **"Factor of Safety (FoS)"**: "Ratio of resisting to driving forces. FoS > 1.5 for sliding, > 1.2 for overturning recommended. Values below indicate unsafe design."

### Tooltip Implementation Guidelines
- Display tooltips on **hover** (desktop) and **tap** (mobile/touch devices)
- Use an **info icon (ⓘ)** next to labels for discoverability
- Keep tooltip text **concise but informative** (2-4 sentences)
- Use **consistent formatting**: Definition → Context → Guidance/Range
- Include **mathematical notation** where helpful (e.g., Hs, Dn50, FoS)
- Ensure tooltips are **accessible** (screen reader compatible, keyboard navigable)
- Apply **subtle animation** (fade-in, 200ms delay) for better UX

---

## Global Parameter Management & Data Flow

### Shared Parameter System
- **Single Input, Multiple Use Principle**
  - Input parameters are entered once in a centralized location
  - All calculation modules can read and access these global parameters
  - Eliminates redundant data entry across different design modules
  - Ensures consistency across all calculations in a project session
  - Real-time synchronization when global parameters are updated

- **Global Parameter Categories**
  - **Site Conditions**:
    - Water depth (h)
    - Seabed slope
    - Soil characteristics
    - Environmental factors (temperature, salinity)
  - **Wave Parameters**:
    - Significant wave height (Hs)
    - Peak wave period (Tp)
    - Wave direction
    - Wave spectrum type (JONSWAP, Pierson-Moskowitz)
  - **Water Levels**:
    - Still water level (SWL)
    - High tide level
    - Storm surge
    - Sea level rise projection
  - **Material Properties**:
    - Armour stone density
    - Concrete density
    - Friction coefficients
    - Permeability characteristics
  - **Design Criteria**:
    - Target damage levels
    - Safety factors
    - Acceptable overtopping rates
    - Design life

### Local Override Capability
- **Module-Specific Adaptations**
  - Any calculation module can override global parameters for local calculations
  - Override creates an "adapted value" specific to that module's context
  - Original global parameter remains unchanged for other modules
  - Clear visual indication when a parameter is overridden (e.g., highlighted in different color)
  
- **Override Use Cases**:
  - **Depth-limited wave breaking**: Override Hs with depth-limited Hmax for shallow areas
  - **Local wave transformation**: Adjust wave period for shoaling/refraction effects
  - **Sensitivity analysis**: Test different safety factors in specific modules
  - **Design alternatives**: Compare different armour densities without changing global settings
  - **Staged construction**: Use different water levels for interim vs final conditions

- **Override Management Features**
  - **Visual indicators**: Badge or icon showing "Overridden" status next to parameter
  - **Tooltip information**: Display both global and local (overridden) values
  - **Reset to global**: One-click button to revert override and use global value
  - **Override tracking**: List all active overrides in a summary panel
  - **Warning system**: Alert if overridden value differs significantly from global value
  - **Documentation**: Automatically log override reasons in calculation reports

### Parameter Flow Architecture
1. **Input Phase**: User enters global parameters in Project Settings or Dashboard
2. **Distribution Phase**: All modules load global parameters by default
3. **Calculation Phase**: 
   - Module uses global value OR
   - User activates override mode and enters adapted value
   - Calculation proceeds with appropriate value
4. **Results Phase**: Report clearly distinguishes between global and overridden inputs
5. **Update Phase**: Changes to global parameters propagate to all non-overridden modules

### Implementation Benefits
- **Efficiency**: Reduce data entry time by 70-80%
- **Consistency**: Minimize human error from re-entering values
- **Flexibility**: Enable localized adjustments without compromising global settings
- **Transparency**: Clear audit trail of which values were adapted and why
- **Collaboration**: Team members can easily see project-wide assumptions
- **Validation**: Easier to verify that all modules use correct input values

## Project-Based Workflow

### Project Organization Structure
- **Hierarchical Data Model**
  - **Project Level** (Top-level container)
    - Project name, ID, and description
    - Client information and project location
    - Design date, engineer name, company details
    - Global parameters (site conditions, wave climate, water levels)
    - Project-wide settings and preferences
    - Design standards and codes applied
  
  - **Structure Level** (Multiple structures per project)
    - Each structure is a child of the parent project
    - Structure name, type, and unique identifier
    - Structure-specific parameters and calculations
    - Individual design status (draft, in-progress, approved, rejected)
    - Calculation results and stability checks
    - Cross-section geometry and visualization
    - Design notes and modification history

### Multi-Structure Projects
- **Structure Types Within a Project**
  - Mix different structure types in one project:
    - Main breakwater (rubble mound)
    - Secondary breakwater (vertical wall)
    - Revetments for shoreline protection
    - Groyne fields
    - Jetties and pier structures
  - Each structure uses project-wide global parameters by default
  - Each structure can override parameters as needed for local conditions
  - Structures can reference each other (e.g., sheltered zone behind breakwater)

- **Structure Management Features**
  - **Add new structure** to existing project
  - **Duplicate structure** within project for alternatives comparison
  - **Reorder structures** for logical organization
  - **Enable/disable structures** without deletion
  - **Link structures** to show dependencies (e.g., "Structure B protected by Structure A")
  - **Batch operations** across multiple structures
  - **Structure comparison view** for alternatives analysis

### Project Dashboard
- **Project Overview Panel**
  - Summary of all structures in the project
  - Overall project status (number of structures by status)
  - Project timeline and key milestones
  - Total quantities (armour tonnage, concrete volume, etc.)
  - Project-wide cost estimation summary
  
- **Quick Navigation**
  - Jump to any structure within the project
  - Filter structures by type or status
  - Recent activity log (last modified structures)
  - Calculation status indicators (completed, pending, failed)

### Report Export System

#### Individual Structure Reports
- **Single Structure Export**
  - Generate PDF report for one selected structure
  - Include only relevant calculations for that structure type
  - Detailed cross-section drawings and dimensions
  - Complete input parameters (global + any overrides)
  - Calculation methodology and formulas
  - Results summary with safety checks
  - Material specifications and quantities
  - Design recommendations
  
- **Report Customization**
  - Select which sections to include/exclude
  - Choose level of detail (executive summary vs detailed engineering)
  - Include/exclude calculation steps
  - Add custom cover page and headers
  - Append additional notes or sketches

#### Full Project Reports
- **Comprehensive Project Export**
  - Single PDF containing all structures in the project
  - Organized by structure with clear section breaks
  - Executive summary covering entire project
  - Project-wide parameters and assumptions
  - Individual structure reports consolidated
  - Comparative analysis section (if multiple alternatives)
  - Overall quantities and cost summary
  - Project-level conclusions and recommendations

- **Project Report Structure**
  1. **Cover Page**: Project name, client, engineer, date
  2. **Table of Contents**: Auto-generated with page numbers
  3. **Executive Summary**: High-level project overview
  4. **Project Parameters**: Site conditions, wave climate, design criteria
  5. **Structure Reports**: Individual report for each structure
     - Structure A (e.g., Main Breakwater)
     - Structure B (e.g., Secondary Breakwater)
     - Structure C (e.g., Revetment)
  6. **Comparative Analysis**: Side-by-side comparison tables
  7. **Quantities Summary**: Total materials across all structures
  8. **Appendices**: Detailed calculations, references, attachments

- **Export Options**
  - **Format**: PDF, Word (DOCX), HTML
  - **Quality**: Draft (fast), Standard, High-quality (publication-ready)
  - **Scope**: 
    - Current structure only
    - Selected structures (multi-select)
    - All structures in project
  - **Content filters**:
    - Include approved structures only
    - Include specific structure types only
    - Exclude archived/rejected alternatives
  
- **Batch Export**
  - Export multiple individual structure reports simultaneously
  - Generate comparison matrix for all structures
  - Create separate PDFs for each structure (bundled in ZIP)
  - Email-ready format with compressed file size

### Project Persistence & Sharing
- **Project Save/Load**
  - Save entire project (all structures + global parameters)
  - Auto-save with version timestamping
  - Manual save with custom version notes
  - Save as template for future similar projects

- **Project Export/Import**
  - Export project as single JSON file
  - Import projects from colleagues or previous work
  - Cloud sync capability (optional future feature)
  - Backup and restore functionality

- **Collaboration Features**
  - Export project for team review
  - Import reviewed project with comments
  - Track changes between versions
  - Multi-engineer workflow support

### Workflow Example
1. **Create Project**: "Marina Breakwater System - Port XYZ"
2. **Set Global Parameters**: Wave climate, water levels, site conditions
3. **Add Structure 1**: Main rubble mound breakwater
4. **Add Structure 2**: Secondary vertical wall breakwater
5. **Add Structure 3**: Inner harbour revetment
6. **Run Calculations**: All structures use global parameters with local overrides
7. **Export Options**:
   - Option A: Export "Structure 1" report only for preliminary review
   - Option B: Export "Structure 1 + Structure 2" for breakwater comparison
   - Option C: Export full project report for final submission

## Application Features

### Structure Library Management
- **Custom Structure Type Creation**
  - Design and save custom coastal structure configurations
  - Store complete cross-section details including:
    - Structure type (rubble mound, vertical wall, composite, revetment)
    - Dimensional parameters (crest width, slopes, heights, layers)
    - Material specifications (armour type, core, filter layers)
    - Design criteria (wave conditions, water levels, stability factors)
  - Template naming and categorization system
  - Add metadata (project name, location, design date, engineer notes)

- **Persistent Storage**
  - **Local browser storage** using IndexedDB for offline access
  - **Export/Import functionality**:
    - Export individual structures as JSON files
    - Export entire library for backup
    - Import structures from shared team libraries
  - **Version control** for structure modifications
  - **Auto-save** during design process to prevent data loss

- **Structure Library Browser**
  - **List view** displaying all saved structures with:
    - Thumbnail preview of cross-section
    - Structure name and type
    - Key dimensions (crest elevation, toe depth, width)
    - Date created/modified
    - Design status (draft, approved, archived)
  - **Search and filter capabilities**:
    - Filter by structure type
    - Search by name, project, or tags
    - Sort by date, name, or structure type
  - **Quick actions**:
    - Load structure for editing
    - Duplicate structure as new template
    - Delete or archive structures
    - Compare multiple structures side-by-side
  - **Batch operations** for library management
  - **Preview mode** showing detailed structure information without loading

- **Structure Reuse Workflow**
  1. Browse library to find suitable structure type
  2. Select and load structure into design workspace
  3. Modify parameters for new site conditions
  4. Run stability calculations with updated inputs
  5. Save as new structure or update existing one
  6. Generate report comparing original vs. modified design

### Unit Conversion
- **Multi-unit support** for all engineering parameters
- **Real-time conversion** between:
  - Metric and Imperial systems
  - Customizable unit preferences
  - SI units for international standards
- **Supported conversions**:
  - Length (m, ft, cm, mm)
  - Wave height and water depth
  - Density (kg/m³, lb/ft³)
  - Discharge rates (m³/s/m, l/s/m)
  - Volume (m³, ft³)

### Engineering Report PDF Export
- **Professional report generation** with customizable templates
- **Formula rendering** in correct mathematical notation using LaTeX/MathML
- **Auto-generated content**:
  - Project metadata and site information
  - Input parameters with units
  - Calculation steps with formulas
  - Results summary with visualizations
  - Design diagrams and cross-sections
- **Export features**:
  - Single or batch export for multiple scenarios
  - Include/exclude sections as needed
  - Company branding and custom headers/footers
  - Automatic table of contents and page numbering
