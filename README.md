# CoastalEngineer Pro

A comprehensive coastal engineering web application for advanced breakwater design, wave analysis, and structural calculations.

## Features

### Core Coastal Engineering Features

#### 🌊 Wave Predictor
- Fetch-limited wave growth using SMB and JONSWAP methods
- Depth-limited breaking wave height calculator (Miche & Goda criteria)
- Design Water Level (DWL) tool with Tides, Wave Set-up, and Sea Level Rise

#### 🏔️ Armour Stability Suite (Rubble Mound Structures)
- Hudson formula for preliminary sizing
- Van der Meer formulae for detailed stability analysis
- Material database with customizable densities
- Multiple structure types: Standard, Berm, Reef, Low-Crested

#### 🏢 Vertical Structures
- Goda formula for wave pressure calculation
- Sliding and overturning stability analysis
- Foundation bearing capacity verification
- Caisson design and optimization
- Multiple types: Vertical Wall, Composite, Caisson, Perforated

#### 📐 Cross-Section Designer
- Graphical and input-driven interface
- Template library with pre-configured cross-sections
- Real-time visualization
- Interactive slope and crest configuration
- Automated filter and underlayer sizing
- Structure-specific calculation engine

#### ⚠️ Serviceability Analysis
- EurOtop-based mean overtopping discharge calculations
- Individual wave volume hazard assessment
- Safety threshold indicators for pedestrians, vehicles, and buildings

### Application Features

#### 🔄 Unit Conversion
- Multi-unit support for all engineering parameters
- Real-time conversion between Metric and Imperial systems
- Customizable unit preferences

#### 📄 Engineering Report PDF Export
- Professional report generation with customizable templates
- Formula rendering in correct mathematical notation using LaTeX
- Auto-generated content including:
  - Project metadata and site information
  - Input parameters with units
  - Calculation steps with formulas
  - Results summary with visualizations
  - Design diagrams and cross-sections

## Getting Started

### Quick Start

1. **Open the application**:
   - Simply open `index.html` in a modern web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```
   - Then navigate to `http://localhost:8000`

2. **No installation required** - this is a standalone web application

### Browser Requirements

- Modern browser with JavaScript enabled
- Chrome, Firefox, Edge, or Safari (latest versions recommended)
- Internet connection for loading fonts and KaTeX (for formula rendering)

## Usage Guide

### Dashboard
Start at the dashboard to access all features quickly. Each feature card provides direct navigation to the respective tool.

### Wave Analysis
1. Navigate to "Wave Analysis"
2. Enter wind speed, fetch length, and water depth
3. Select calculation method (SMB or JONSWAP)
4. Enter Design Water Level parameters
5. Click "Calculate Wave Parameters"
6. Review results and applied formulas

### Structure Design
1. Navigate to "Structure Design"
2. Select a template from the sidebar:
   - Rubble Mound: Standard, Berm, Reef, Low-Crested
   - Vertical: Wall, Composite, Caisson, Perforated
3. View the real-time canvas visualization
4. Adjust parameters in the design panel
5. Click "Analyze Structure" for stability calculations

### Serviceability Analysis
1. Navigate to "Serviceability"
2. Enter structure geometry (freeboard, slope, crest width)
3. Enter wave conditions
4. Click "Calculate Overtopping"
5. Review overtopping discharge and safety assessments

### PDF Report Generation
1. Navigate to "Reports"
2. Fill in project information
3. Select sections to include
4. Click "Generate PDF Report"
5. A print dialog will open for PDF export

## Technology Stack

- **HTML5** - Modern semantic markup
- **CSS3** - Custom design system with gradients and animations
- **Vanilla JavaScript** - No framework dependencies
- **KaTeX** - Mathematical formula rendering
- **Canvas API** - Real-time structure visualization

## Formulas & Methodologies

### Wave Analysis
- **SMB** (Shore Protection Manual)
- **JONSWAP** spectrum
- **Miche criterion** for breaking waves
- **Goda criterion** for depth-limited waves

### Stability Analysis
- **Hudson formula** - Preliminary armour sizing
- **Van der Meer** - Detailed stability (plunging & surging)
- **Goda formula** - Vertical wall wave pressure

### Serviceability
- **EurOtop guidelines** - Overtopping calculations
- Safety thresholds per European standards

## Material Database

Pre-loaded materials with densities:
- Granite: 2650 kg/m³
- Limestone: 2500 kg/m³
- Coral Rock: 2100 kg/m³
- Concrete: 2400 kg/m³
- Basalt: 2900 kg/m³
- Quarry Run: 2700 kg/m³

## File Structure

```
Engineering App/
│
├── index.html              # Main application file
├── styles.css              # Complete styling system
├── features.md             # Feature documentation
├── README.md               # This file
│
└── scripts/
    ├── main.js             # Core application logic
    ├── calculations.js     # Engineering formulas
    ├── canvas.js           # Structure visualization
    └── pdf-export.js       # Report generation
```

## Design Philosophy

This application prioritizes:
1. **Professional aesthetics** - Premium dark theme with ocean-inspired colors
2. **Ease of use** - Intuitive navigation and clear workflows
3. **Engineering accuracy** - Industry-standard formulas and methods
4. **Visual feedback** - Real-time canvas updates and formula rendering
5. **Comprehensive reporting** - Professional PDF output

## Safety Notice

⚠️ **Important**: This software is provided for engineering analysis purposes. All calculations should be verified by a qualified coastal engineer before use in actual construction projects. The developers assume no liability for designs created using this tool.

## Credits

**CoastalEngineer Pro** - Advanced Coastal Structure Design Platform

Developed with modern web technologies and coastal engineering best practices.

---

*For support or questions, refer to the documentation within the application.*
