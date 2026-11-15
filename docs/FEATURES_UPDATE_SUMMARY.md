# Features Update Summary

## Comprehensive Rubble Mound Cross-Section Structure

**Date**: 2026-01-31  
**Update**: Added complete layer-by-layer breakwater design specifications to `features.md`

---

## What Was Added

The `features.md` file has been significantly expanded with a comprehensive, engineering-grade specification for complete rubble mound breakwater cross-sections. The update includes 8 major components with detailed design procedures, calculations, and implementation guidelines.

---

## Detailed Components Added

### 1. **Crest Structure** ✅
- Crest width calculations (Gc)
- Crest elevation determination (Rc) based on freeboard requirements
- Crest armour specifications
- Crown wall options for wave return and access
- EurOtop formulas for overtopping-based design

**Key Formulas:**
- `Gc = 3 × Dn50(armour)` or 3m minimum
- `q/√(g×Hm0³) = 0.2 × exp[-2.6 × Rc/(Hm0 × γf × ξ)]`

---

### 2. **Primary Armour Layer** ✅
Comprehensive specifications for the main wave-resistant layer:

**Seaward and Leeward Slopes:**
- Van der Meer formulas (plunging and surging conditions)
- Hudson formula as alternative
- Layer thickness requirements (2-3 × Dn50)
- Slope angle options (cotα = 1.5, 2.0, 3.0)
- Grading requirements (M85/M15 ratios)
- Placement specifications and porosity

**Armour Types:**
1. Natural Rock (granite, basalt, limestone, coral)
2. Concrete Units (cubes, tetrapods, Accropode, Core-Loc, Xbloc)

**Outputs:**
- M50, M85, M15 masses
- Layer thickness
- Volume calculations
- Number of units required

---

### 3. **Secondary Armour / Underlayer 1** ✅
Transition layer specifications:
- Mass ratio: M50(underlayer) = M50(armour) / 10 to /15
- Filter rule compliance: D85(underlayer) / D15(armour) < 4.0
- Thickness: 2 × Dn50(underlayer) minimum
- Typical mass range: 50-500 kg per stone

---

### 4. **Filter Layer / Underlayer 2** ✅
Critical filtration layer with comprehensive design rules:

**Terzaghi Filter Criteria:**
1. Retention: `D15(filter) / d85(core) < 5`
2. Permeability: `D15(filter) / d15(core) > 4`
3. Grading: `D60/D10 < 20`

**Rock Manual Alternative:**
- `D50(filter) / D50(core) = 10 to 20`

**Specifications:**
- Minimum thickness: 0.3m or 2 × D50(filter)
- Minimum 2 layers requirement
- Filter rule compliance checking
- Automatic calculations for D15, D50, D85

---

### 5. **Core Layer** ✅
Main structural body with three type options:

**A. Permeable Core**
- Quarry run, wide grading (1-500 kg stones)
- Benefits: Lower pressures, reduced reflection, economical
- Use: Conventional breakwaters

**B. Impermeable Core**
- Select fill, graded gravel
- Benefits: Reduced flow, better for composite structures
- Drawbacks: Higher pressures, more expensive

**C. Core with Impermeable Barrier**
- Geomembrane or clay layer
- Special applications: Lagoon creation, freshwater protection

**Design Parameters:**
- Gradation: D85/D15 = 5-50
- Porosity: 35-40%
- Settlement allowance: 2-5% of height
- D50 range: 25-300mm

---

### 6. **Bedding / Foundation Layer** ✅
Transition between structure and seabed:

**A. Bedding Layer**
- Graded stone (5-100 kg)
- Thickness: 0.3-0.6m
- Filter rules with foundation soil
- Load distribution function

**B. Geotextile Foundation Layer**
- Separation and filtration functions
- Non-woven for filtration, woven for reinforcement
- AOS criteria: O95 < d85(soil) × 1.5
- Required for soft foundations

**Includes:**
- Bearing capacity checks
- Settlement predictions
- Foundation soil compatibility

---

### 7. **Toe Structure (Most Detailed Component)** ✅

This is the most comprehensive addition, with **5 different toe configuration options**:

#### **Option 1: Standard Toe Berm** (Most Common)
- Complete design procedure with formulas
- Toe width: Btoe = 3-5 × Dn50(toe), typical 5-12m
- Toe height: htoe = 2-3 × Dn50(toe)
- Toe stone sizing: M50(toe) = 0.5-1.0 × M50(armour)
- **Scour calculation**: `S = 1.3 × Hs × (Tp/√(g×d))^0.5` (Sumer & Fredsøe)
- **Embedment depth**: he = S + 0.5m safety margin
- Hudson and Van der Meer formulas adapted for toe

#### **Option 2: Launched Toe**
- Dynamic placement for deep water
- Self-arranging stones
- Stone size multiplier: 1.25-1.5 × designed M50
- Overdumping allowance: 20-40%

#### **Option 3: Sheet Pile Toe**
- For excessive scour or very soft soils
- Steel or concrete sheet pile walls
- Depth to bearing stratum
- Corrosion protection specifications
- Toe rock berm on seaward side

#### **Option 4: Rock-Filled Mattress Toe (Gabion)**
- Flexible mat for soft/irregular seabeds
- Geotextile or wire-mesh containers
- Thickness: 1-3m
- Fill stone: 100-500mm
- Mesh specifications (galvanized, PVC-coated)

#### **Option 5: Combined Toe + Bund**
- For very deep water
- Raised bund reduces total structure height
- Economy through reduced material volume
- Stratified foundation utilization

**Complete Toe Design Procedure** (7 Steps):
1. Determine design water depth at toe
2. Calculate design wave height (depth-limited breaking check)
3. Assess scour potential based on soil type
4. Size toe stones using Hudson or Van der Meer
5. Determine toe geometry (width, height, embedment)
6. Select appropriate toe configuration
7. Foundation bearing capacity and settlement check

**Toe Calculator Specifications:**
- 7 required inputs
- 11 calculated outputs
- Pass/fail checks for stability and foundation

---

### 8. **Special Features and Accessories** ✅

**A. Crown Wall / Superstructure**
- Wave return walls
- Recurved designs for enhanced performance
- Height: 1-4m above crest armour

**B. Wave Screens / Parapets**
- Overtopping reduction: 50-70%
- Perforated or solid configurations
- Height: 1-2m typical

**C. Internal Drainage**
- Pore pressure control
- Perforated pipes, gravel drains, weep holes
- Critical for impermeable cores

**D. Access Features**
- Road specifications (3m minimum width)
- Ramps (1:10 to 1:15 slope)
- Lighting and mooring facilities

---

## Implementation Requirements for Cross-Section Designer

The specification includes detailed requirements for implementing this in the application:

### 1. **Layer-by-Layer Input Mode**
- Sequential input from crest to toe
- Intelligent defaults propagating from previous layers
- Automatic filter rule checking
- Real-time compliance verification

### 2. **Visual Cross-Section Builder**
- Interactive canvas with all layers displayed
- Real-time geometry updates as parameters change
- Color-coded layers for visual clarity
- Dimension annotations and labeling

### 3. **Calculation Engine**
Required calculations:
- Van der Meer stability (plunging and surging)
- Hudson formula (alternative/verification)
- Filter rule compliance (Terzaghi criteria)
- Volume and quantity take-offs
- Material cost estimation
- Scour depth prediction
- Bearing capacity verification
- Settlement analysis

### 4. **Template System**
Pre-configured templates:
- Light duty (Hs < 2m)
- Medium duty (Hs 2-4m)
- Heavy duty (Hs > 4m)
- Special configurations (reef, berm, low-crested)
- User-defined custom templates

### 5. **Output Reports**
- Layer-by-layer material specifications
- Quantity take-offs by layer
- Construction drawings with dimensions
- Stability check results with pass/fail criteria
- Filter rule compliance documentation

---

## Key Engineering Formulas Added

### Van der Meer Formulas:
```
Plunging: Hs/ΔDn50 = 6.2 × P^0.18 × (S/√N)^0.2 × ξm^(-0.5)
Surging: Hs/ΔDn50 = 1.0 × P^(-0.13) × (S/√N)^0.2 × √(cotα) × ξm^P
```

### Hudson Formula:
```
W = (ρr × g × H³)/(KD × (ρr/ρw - 1)³ × cotα)
```

### Filter Rules (Terzaghi):
```
Retention: D15(filter) / d85(core) < 5
Permeability: D15(filter) / d15(core) > 4
Grading: D60/D10 < 20
```

### Scour Calculation (Sumer & Fredsøe):
```
S = 1.3 × Hs × (Tp/√(g×d))^0.5
```

### Toe Geometry:
```
Btoe = 3-5 × Dn50(toe)
htoe = 2-3 × Dn50(toe)
he = S + 0.5m (embedment depth)
```

### EurOtop Overtopping:
```
q/√(g×Hm0³) = 0.2 × exp[-2.6 × Rc/(Hm0 × γf × ξ)]
```

---

## Design Parameters Summary

### Total Input Parameters: ~50+
Organized by layer:
- Crest: 4 parameters
- Primary Armour: 8 parameters
- Underlayer 1: 3 parameters
- Filter Layer: 4 parameters
- Core: 6 parameters
- Bedding/Foundation: 6 parameters
- Toe: 7-15 parameters (depending on configuration)
- Special Features: Variable

### Total Output Parameters: ~40+
Including:
- Mass calculations (M50, M85, M15)
- Dimensional results (thickness, width, height)
- Volume calculations (m³)
- Count/quantity (number of stones/units)
- Compliance checks (pass/fail)
- Performance predictions (scour, settlement)

---

## Benefits of This Update

### For Engineers:
1. **Comprehensive Design Coverage**: Complete specification from crest to foundation
2. **Multiple Options**: 5 different toe configurations for various conditions
3. **Rule Compliance**: Automatic filter rule checking (Terzaghi criteria)
4. **Engineering Standards**: Based on Rock Manual, CEM, EurOtop guidelines
5. **Flexibility**: Permeable/impermeable core options, multiple armour types

### For Implementation:
1. **Clear Specifications**: Unambiguous requirements for each layer
2. **Calculation Formulas**: All necessary equations provided
3. **Input/Output Structure**: Well-defined parameters for UI development
4. **Validation Criteria**: Pass/fail checks for design adequacy
5. **Template Framework**: Foundation for standard configurations

### For Users:
1. **Step-by-Step Workflow**: Layer-by-layer design process
2. **Visual Feedback**: Interactive cross-section builder
3. **Professional Output**: Construction-ready specifications
4. **Cost Estimation**: Quantity take-offs for all materials
5. **Design Confidence**: Multiple stability checks and validations

---

## File Statistics

**Lines Added**: ~600 lines  
**Sections Added**: 8 major components  
**Formulas Added**: 15+ engineering formulas  
**Configuration Options**: 5 toe configurations + 3 core types  
**Total Parameters**: ~90+ (inputs and outputs)

---

## Next Implementation Steps

1. **Create Cross-Section Designer UI**
   - Layer input forms with the specified parameters
   - Interactive visual canvas
   - Real-time calculation integration

2. **Implement Calculation Module**
   - Van der Meer calculator
   - Filter rule checker
   - Scour prediction
   - Volume calculations
   - Bearing capacity analysis

3. **Build Template System**
   - Pre-configured cross-sections
   - Template save/load functionality
   - Template sharing/export

4. **Visual Designer**
   - Color-coded layer visualization
   - Dimension annotations
   - Interactive editing
   - Cross-section export (PDF/DWG)

5. **Integration with Global Parameters**
   - Wave parameters
   - Material properties
   - Site conditions
   - Design criteria

---

## References

This specification is based on:
- **CIRIA Rock Manual** (2007)
- **USACE Coastal Engineering Manual (CEM)**
- **EurOtop Manual** (2018)
- **Van der Meer** stability formulas (1988)
- **Sumer & Fredsøe** scour prediction (2002)
- **Terzaghi** filter criteria (classic)

---

## Alignment with PDF

While I couldn't directly read the "HDh Nolhivaran Harbour calculations.pdf", this specification follows standard coastal engineering practice for comprehensive breakwater design, including:

✅ Complete layer structure from crest to toe  
✅ Multiple toe configuration options  
✅ Filter layer specifications with compliance checking  
✅ Bedding and foundation considerations  
✅ Scour protection and embedment calculations  
✅ Geotextile requirements  
✅ Material quantity calculations  

This provides a professional, engineering-grade specification suitable for real-world breakwater design projects.
