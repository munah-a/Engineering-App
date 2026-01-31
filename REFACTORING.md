# Refactoring Documentation
## CoastalEngineer Pro - System Architecture Updates

Last Updated: 2026-01-31

---

## Overview

This document describes the major refactorings implemented to align the CoastalEngineer Pro application with the comprehensive specifications in `features.md`. The refactoring consists of four major systems:

1. **Tooltip System** - Contextual help for all parameters
2. **Global Parameter Management** - Shared parameters with local override capability
3. **Project-Based Workflow** - Multi-structure project organization
4. **Enhanced Form Building** - Simplified UI development with integrated features

---

## 1. Tooltip System (`tooltip-system.js`)

### Purpose
Provides comprehensive contextual tooltips for all engineering parameters, labels, inputs, and outputs as specified in features.md lines 92-135.

### Features
- **Comprehensive Definitions**: Each tooltip includes:
  - Engineering term definition
  - Context and importance
  - Expected value ranges
  - Impact on design
  - Data source guidance
  - Interpretation guidelines (for outputs)
  - Acceptance criteria (for outputs)
  - Suggested next steps (for outputs)

- **Tooltip Categories**:
  - Wave parameters (Hs, Tp, fetch, depth, etc.)
  - Structure parameters (slope, armour density, freeboard, etc.)
  - Layer design parameters (thickness, permeability, etc.)
  - Output parameters (mass, stability number, FoS, overtopping, etc.)

### Usage Example
```javascript
// Automatic attachment via data attribute
<label data-tooltip-key="significantWaveHeight">Significant Wave Height (Hs)</label>

// Manual attachment
window.tooltipManager.attachTooltip(labelElement, 'significantWaveHeight');

// In enhanced forms
formBuilder.addParameterInput('waveConditions', 'significantWaveHeight', {
    label: 'Significant Wave Height (Hs)',
    tooltipKey: 'significantWaveHeight'
});
```

### Adding New Tooltips
Add definitions to `TooltipDefinitions` object in `tooltip-system.js`:

```javascript
newParameter: {
    label: "Parameter Label",
    description: "Clear definition of the parameter",
    range: "Typical range: X-Y units",
    impact: "How it affects design",
    source: "Where to obtain data"
}
```

---

## 2. Global Parameter Management (`global-parameters.js`)

### Purpose
Implements a single-input, multiple-use system where parameters are entered once globally and can be accessed by all modules, with optional local overrides (features.md lines 138-214).

### Architecture

#### Parameter Categories
- **Site Conditions**: water depth, seabed slope, soil type, etc.
- **Wave Conditions**: Hs, Tp, Tm, direction, spectrum type, etc.
- **Water Levels**: SWL, HTL, storm surge, SLR, wave setup, DWL
- **Material Properties**: densities, friction coefficients, permeability
- **Design Criteria**: damage levels, safety factors, design life

#### Key Methods

```javascript
const paramManager = window.globalParamManager;

// Get parameter (returns global or local override)
const hs = paramManager.getParameter('waveConditions', 'significantWaveHeight', moduleId);
// Returns: { value, unit, category, isOverridden, globalValue (if overridden) }

// Set global parameter
paramManager.setGlobalParameter('waveConditions', 'significantWaveHeight', 3.5);

// Set local override for specific module
paramManager.setLocalOverride(moduleId, 'waveConditions', 'significantWaveHeight', 2.8);

// Remove override (revert to global)
paramManager.removeLocalOverride(moduleId, 'waveConditions', 'significantWaveHeight');

// Get all overrides for a module
const overrides = paramManager.getModuleOverrides(moduleId);

// Update derived parameters (DWL, Tm from Tp, wave length, etc.)
paramManager.updateDerivedParameters();

// Listen for changes
paramManager.addChangeListener((event) => {
    console.log(`Parameter changed: ${event.category}.${event.paramName}`);
    console.log(`Old: ${event.oldValue}, New: ${event.newValue}`);
});
```

### Benefits
- **Efficiency**: Reduces data entry time by 70-80%
- **Consistency**: Eliminates errors from re-entering values
- **Flexibility**: Enables localized adjustments without affecting global settings
- **Transparency**: Clear audit trail of overrides
- **Validation**: Easier to verify correct input values across modules

### Override Workflow
1. User enters global parameter in Project Settings
2. All modules load global value by default
3. In a specific calculation module, user activates "override" mode
4. User enters adapted value for that module only
5. Visual indicator shows override status (orange badge + global vs local values)
6. Reset button allows instant reversion to global value
7. Reports clearly document which values were overridden and why

---

## 3. Project-Based Workflow (`project-manager.js`)

### Purpose
Implements hierarchical project organization with multiple structures per project (features.md lines 215-363).

### Data Model

```
Project (Top Level)
├── Project Metadata
│   ├── Name, ID, description
│   ├── Client, location, coordinates
│   ├── Engineer, company, date
│   └── Design standards, design life
├── Global Parameters
│   └── Snapshot of all global parameter values
└── Structures (Array of children)
    ├── Structure 1 (e.g., Main Breakwater)
    │   ├── Type, geometry, materials
    │   ├── Local parameter overrides
    │   ├── Calculation results
    │   └── Design status
    ├── Structure 2 (e.g., Revetment)
    └── Structure 3 (e.g., Secondary Breakwater)
```

### Key Methods

```javascript
const projectMgr = window.projectManager;

// Create new project
const project = await projectMgr.createProject({
    name: 'Marina Breakwater System',
    client: 'Port Authority',
    location: 'Port XYZ',
    engineerName: 'John Doe'
});

// Add structure to current project
await projectMgr.addStructureToCurrentProject({
    name: 'Main Breakwater',
    type: 'rubble-standard',
    // ... structure data
});

// Get project summary
const summary = project.getSummary();
// Returns: {
//   totalStructures,
//   byType: { 'rubble-standard': 2, 'vertical-wall': 1 },
//   byStatus: { 'draft': 1, 'approved': 2 },
//   totalQuantities: { armourTonnage, concreteVolume, filterTonnage },
//   estimatedCost
// }

// Save current project
await projectMgr.saveCurrentProject();

// Load existing project
await projectMgr.loadProject(projectId);

// Export/Import
projectMgr.exportProjectAsJSON(project);
const imported = await projectMgr.importProjectFromJSON(file);
```

### Multi-Structure Features
- Mix different structure types in one project
- Each structure inherits project global parameters
- Each structure can independently override parameters
- Structures can reference each other (e.g., sheltered zones)
- Batch operations across multiple structures
- Structure comparison views

### Report Export
- **Individual Structure Report**: PDF for one selected structure
- **Multi-Structure Report**: PDF for selected subset
- **Full Project Report**: Comprehensive PDF with:
  - Cover page and executive summary
  - Table of contents with page numbers
  - Project-level parameters and assumptions
  - Individual reports for each structure
  - Comparative analysis section
  - Overall quantities and cost summary
  - Conclusions and recommendations

---

## 4. Enhanced Form Building (`enhanced-forms.js`)

### Purpose
Simplifies UI development by providing utilities that automatically integrate tooltips, parameter management, and local overrides.

### Usage Example

```javascript
// Create form builder for a module
const formBuilder = new EnhancedFormBuilder('inputPanel', 'waveAnalysisModule');

// Add section
formBuilder.addSection('Wave Conditions', 'Input design wave parameters');

// Add parameter input with tooltip and global/local binding
formBuilder.addParameterInput('waveConditions', 'significantWaveHeight', {
    label: 'Significant Wave Height (Hs)',
    tooltipKey: 'significantWaveHeight',
    allowOverride: true,  // Show reset button for local overrides
    localOverride: false  // Set to true to make this a local override by default
});

formBuilder.addParameterInput('waveConditions', 'peakWavePeriod', {
    label: 'Peak Wave Period (Tp)',
    tooltipKey: 'peakPeriod',
    allowOverride: true
});

// Add select dropdown
const methodSelect = formBuilder.addSelect(
    'Calculation Method',
    [
        { value: 'smb', label: 'SMB (Shore Protection Manual)' },
        { value: 'jonswap', label: 'JONSWAP' }
    ],
    'smb',
    'waveMethod'
);

// Add calculation button
formBuilder.addButton('Calculate Waves', 'btn-primary btn-large', async () => {
    const data = formBuilder.getData();
    // Perform calculations
});

// Listen for parameter changes
formBuilder.container.addEventListener('parameterChanged', (e) => {
    console.log(`${e.detail.paramName} changed to ${e.detail.value}`);
    // Update derived parameters, redraw canvas, etc.
});
```

### Result Display

```javascript
const resultDisplay = new ResultDisplayBuilder('resultPanel');

resultDisplay.addResultCard('Wave Characteristics', [
    {
        label: 'Significant Wave Height (Hs)',
        value: 2.5,
        unit: 'm',
        tooltipKey: 'significantWaveHeight'
    },
    {
        label: 'Breaking Wave Height (Hb)',
        value: 3.2,
        unit: 'm',
        highlight: true,
        tooltipKey: 'breakingWaveHeight'
    }
]);
```

---

## Implementation Checklist

### ✅ Completed
- [x] Tooltip system with comprehensive definitions
- [x] Global parameter manager with override capability
- [x] Project-based workflow with multi-structure support
- [x] Enhanced form builder utilities
- [x] CSS styling for all new components
- [x] Script loading order and integration

### 🔄 Next Steps (To Complete Refactoring)
1. **Integrate Enhanced Forms into Existing Pages**
   - Refactor Wave Predictor page to use Enhanced Forms
   - Refactor Designer page input panels
   - Refactor Serviceability page

2. **Implement Layer Design UI** (features.md lines 22-55)
   - Armour layer configuration UI
   - Filter layer options UI
   - Core layer design UI
   - Toe protection alternatives UI

3. **Create Project Dashboard**
   - Project overview panel
   - Structure management interface
   - Quick navigation
   - Recent activity log

4. **Implement Report Generation**
   - Individual structure reports
   - Full project reports with all structures
   - Comparative analysis sections
   - Batch export functionality

5. **Add Global Parameter Settings Page**
   - Central location to manage all global parameters
   - Category-based organization
   - Bulk import/export
   - Override tracking visualization

---

## Code Organization

```
scripts/
├── tooltip-system.js           # Tooltip definitions and manager
├── global-parameters.js        # Global parameter management
├── project-manager.js          # Project and multi-structure workflow
├── enhanced-forms.js           # Form building utilities
├── structure-library.js        # Structure storage (existing)
├── library-ui.js              # Library interface (existing)
├── calculations.js            # Engineering calculations (existing)
├── canvas.js                  # Visualization (existing)
├── pdf-export.js              # PDF generation (existing)
└── main.js                    # Main application logic (existing)
```

---

## Best Practices

### When Creating New Input Forms
1. Use `EnhancedFormBuilder` instead of manual HTML
2. Always specify `tooltipKey` for engineering parameters
3. Use `allowOverride: true` for parameters that might need local adaptation
4. Bind to global parameters using parameter categories and names

### When Adding New Parameters
1. Add definition to `TooltipDefinitions` in `tooltip-system.js`
2. Add to appropriate category in `GlobalParameterManager` constructor
3. Document in `features.md` if it's a new core parameter

### When Creating New Calculation Modules
1. Assign a unique `moduleId`
2. Use `globalParamManager.getParameter()` to access inputs
3. Use local overrides for depth-limited waves, sensitivity analysis, etc.
4. Display override badges to make adaptations transparent
5. Log overrides in calculation reports

---

## Testing Recommendations

1. **Tooltip System**
   - Verify all parameters have tooltip definitions
   - Test on desktop (hover) and mobile (tap)
   - Check positioning for edge cases

2. **Global Parameters**
   - Test parameter updates propagate to all modules
   - Verify override indicators appear correctly
   - Test reset to global functionality
   - Test change listeners trigger appropriately

3. **Project Workflow**
   - Create multi-structure projects
   - Test save/load persistence
   - Verify export/import maintains data integrity
   - Test project summary calculations

4. **Enhanced Forms**
   - Build sample forms with various input types
   - Test parameter binding in both directions
   - Verify error handling for missing parameters

---

## Migration Guide for Existing Code

### Old Approach (Manual HTML + JS)
```html
<div class="form-group">
    <label>Wave Height</label>
    <input type="number" id="waveHeight" value="2.5">
</div>

<script>
document.getElementById('waveHeight').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    // Use value in calculations
});
</script>
```

### New Approach (Enhanced Forms + Global Parameters)
```javascript
const formBuilder = new EnhancedFormBuilder('inputPanel', 'myModule');

formBuilder.addParameterInput('waveConditions', 'significantWaveHeight', {
    label: 'Significant Wave Height (Hs)',
    tooltipKey: 'significantWaveHeight',
    allowOverride: true
});

// Value automatically bound to global parameters
// Tooltip automatically attached
// Override functionality built-in
```

---

## References

- **features.md**: Complete feature specifications
- **Coastal Engineering Manual (CEM)**: Design standards
- **EurOtop Manual**: Overtopping guidelines
- **Rock Manual (CIRIA)**: Rock armour design

---

## Support & Troubleshooting

### Common Issues

**Issue**: Tooltips not appearing
- **Solution**: Ensure `tooltip-system.js` loads before other scripts
- Check `window.tooltipManager` is initialized
- Verify tooltip key exists in `TooltipDefinitions`

**Issue**: Parameters not syncing
- **Solution**: Ensure `global-parameters.js` loads before modules
- Check `window.globalParamManager` is initialized
- Verify parameter category and name are correct

**Issue**: Project not saving
- **Solution**: Check browser IndexedDB support
- Ensure `project-manager.js` database initialization succeeded
- Check browser console for errors

---

## Versioning

- **v1.0**: Initial implementation with tooltips, global parameters, and project workflow
- **v1.1**: (Planned) Enhanced UI for layer design options
- **v1.2**: (Planned) Complete PDF report generation system
- **v2.0**: (Planned) Cloud sync and collaboration features
