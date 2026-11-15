# CoastalEngineer Pro

A comprehensive coastal engineering web application for coastal structure design, offshore-to-toe wave transformation, stability analysis, EurOtop (2018) overtopping serviceability, multi-structure project workflows, and report generation.

## Features

### Core Coastal Engineering Features

#### Wave Predictor & Offshore-to-Toe Transformation
- Fetch-limited wave growth using **SMB** (USACE SPM/CEM) and **JONSWAP** methods
- **Fenton–McKee / Newton–Raphson** wave dispersion solver for deep, transitional, and shallow water
- Offshore-to-toe wave transformation including shoaling ($K_s$), Snell's law refraction ($K_r$), and **Goda (2010)** depth-limited wave breaking ($H_b$)
- Design Water Level (**DWL**) calculator combining Tide Stations / High Tide Level, Sea Level Rise (SLR), and breaking wave setup ($\eta$)

#### Structure Stability Suite (11 Templates)
- **Rubble Mound Structures:**
  - `rubble-standard` — Standard multi-layer breakwater (Hudson 1959 & Van der Meer 1988)
  - `rubble-bullnose` — Rubble mound with concrete crown wall / recurved bullnose wave return
  - `rubble-berm` — Reshaping / statically stable berm breakwater ($H_0$, $H_0 T_0$, recession)
  - `rubble-reef` — Submerged / emergent low-profile reef breakwater with wave transmission ($K_t$, $H_t$)
  - `rubble-low` — Low-crested breakwater with Van der Meer reduction, transmission, and overtopping
  - `rubble-revetment` — Shoreline armour revetment protecting reclamation fill with runup ($R_{u2\%}$) and overtopping
- **Vertical & Composite Structures:**
  - `vertical-wall` — Vertical gravity wall using **Goda (2010)** wave pressure, sliding, overturning, and bearing checks
  - `vertical-composite` — Rubble mound foundation + vertical superstructure wall
  - `vertical-caisson` — Multi-cell sand-ballasted caisson breakwater stability
  - `vertical-perforated` — Wave-dissipating perforated front-wall caisson ($K_r$ reflection & force reduction)
- **Custom Structure (`custom`):**
  - Configurable rubble-mound or vertical-gravity family analysis

#### Serviceability & Overtopping Analysis (EurOtop 2018)
- **EurOtop 2nd Edition (2018)** Eqs. 5.10 & 5.11 mean wave overtopping discharge ($q$) for breaking and non-breaking regimes
- Handles zero and negative crest freeboards ($R_c \le 0$) including submerged crest weir overflow
- Surface roughness selector ($\gamma_f$), crest width reduction factor ($C_r$), wall/bullnose factor ($\gamma_v$), and $2\%$ runup ($R_{u2\%}$)
- Individual maximum wave overtopping volume ($V_{\max}$) and threshold checks for pedestrians, vehicles, and buildings

### Application Platform Features
- **Interactive Cross-Section Canvas:** Live scaled rendering across all 11 templates, wheel zoom (`0.4x` to `3.0x`), click-and-drag pan, and reset view
- **Bidirectional Metric / Imperial Unit Conversion:** Live UI value and label conversion (`m`/`ft`, `m/s`/`mph`, `kg/m³`/`lb/ft³`, `l/s/m`/`cfs/ft`, preserving unitless slopes and angles in degrees `°`) while storing canonical SI values internally
- **Global & Per-Module Parameters:** Synchronized shared hydraulic/environment parameters with local override tracking and reset controls
- **Multi-Structure Project Wizard & IndexedDB Storage:** Step-by-step project setup (`#startProjectWizardBtn`), persistent projects (`projectsGrid`), and Structure Library (`#saveLibraryModal`, save/search/load/edit/delete)
- **Engineering Report Export:** Non-blocking HTML/PDF preview iframe with KaTeX formula rendering, printable view toolbar, wave transformation tables, all 11 structure summaries, and EurOtop (2018) equations

## Getting Started

### Quick Start

1. Serve the workspace using any local static HTTP server (recommended so ES/IndexedDB & print windows behave consistently):
   ```bash
   # Python 3
   python -m http.server 8000

   # Or Node.js
   npx http-server -p 8000
   ```
   Or on Windows, launch `start-server.bat`.
2. Open `http://localhost:8000` in Chrome, Edge, Firefox, or Safari.
3. Optional internet access loads Google Fonts & KaTeX from CDN for equation typesetting; all core calculations and visualizations run locally with zero build step.

### Publishing (GitHub Pages)

The workflow in `.github/workflows/deploy-pages.yml` automatically runs the `node --test` engineering and UI integration suites on pushes to `main` (or manual **Run workflow** dispatch in GitHub Actions) and publishes only the runtime static web bundle (`index.html`, `styles.css`, `scripts/`, and `.nojekyll`) to GitHub Pages.

## Running Automated Tests

Unit and integration test suites use the built-in Node.js test runner (`node:test`, Node 18+):

```bash
node --test
```

Individual suites:
```bash
node --test tests/engineering-calculations.test.js tests/app-integration.test.js
```

## Directory Structure

```text
Engineering App/
├── .github/workflows/deploy-pages.yml # Automated test & GitHub Pages deployment
├── index.html                  # Single-page application views & modals
├── styles.css                  # Material Design 3 light/dark styles & tokens
├── features.md                 # Feature specifications
├── README.md                   # Application overview & documentation
├── start-server.bat            # Windows local HTTP server launcher
├── scripts/
│   ├── main.js                 # AppState, routing, UnitConverter, template controls
│   ├── calculations.js         # Dispersion, SMB/JONSWAP, Hudson/VdM, EurOtop 2018
│   ├── wave-transformation.js  # Shoaling, refraction, Goda/Miche breaking
│   ├── structure-calculations.js # Goda walls, caissons, berm, reef, low-crested, bullnose
│   ├── structure-analysis.js   # UI orchestration for specialized & custom structures
│   ├── canvas.js               # Interactive zoom/pan Canvas visualizer (11 templates)
│   ├── global-parameters.js    # Shared GlobalParams & local override management
│   ├── enhanced-forms.js       # Override-aware form input helpers
│   ├── project-manager.js      # IndexedDB project persistence
│   ├── project-ui.js           # Dashboard project cards & search
│   ├── project-wizard.js       # 5-step multi-structure Project Wizard
│   ├── structure-library.js    # IndexedDB Structure Library model & notifications
│   ├── library-ui.js           # Structure Library cards & Designer save/load modal
│   ├── tooltip-system.js       # Engineering parameter tooltips
│   └── pdf-export.js           # HTML/KaTeX report generator & print preview
├── tests/
│   ├── engineering-calculations.test.js # Physics & formula unit tests
│   └── app-integration.test.js          # DOM/UI, units, globals, escaping & report tests
├── docs/                       # Historical development notes & implementation guides
└── references/                 # Engineering reference PDFs & extracted texts
```

## Engineering Notice

**Important:** This software is provided for coastal engineering analysis and design support. All calculated dimensions, forces, stability factors, and overtopping rates must be independently reviewed and verified by a qualified coastal engineer prior to construction use.
