# Quick Start Guide - Refactored Features

## 1. Tooltip System

### Add a tooltip to any label:
```html
<label data-tooltip-key="significantWaveHeight">Wave Height (Hs)</label>
```

### Or via JavaScript:
```javascript
window.tooltipManager.attachTooltip(element, 'significantWaveHeight');
```

### Available tooltip keys:
- `windSpeed`, `fetchLength`, `waterDepth`
- `significantWaveHeight`, `peakPeriod`, `meanPeriod`
- `designWaterLevel`, `armourDensity`, `structureSlope`
- `crestFreeboard`, `damageLevel`
- `requiredMass`, `stabilityNumber`, `overtoppingDischarge`
- `factorOfSafety`, `breakingWaveHeight`
- And many more in `TooltipDefinitions`!

---

## 2. Global Parameters

### Get a parameter value:
```javascript
const hs = window.globalParamManager.getParameter(
    'waveConditions',          // category
    'significantWaveHeight',   // parameter name
    'myModuleId'              // optional module ID for overrides
);

console.log(hs.value);        // e.g., 2.5
console.log(hs.unit);         // 'm'
console.log(hs.isOverridden); // true/false
```

### Set a global parameter:
```javascript
window.globalParamManager.setGlobalParameter(
    'waveConditions',
    'significantWaveHeight',
    3.5
);
```

### Set a local override for a specific module:
```javascript
window.globalParamManager.setLocalOverride(
    'myModuleId',              // unique module identifier
    'waveConditions',
    'significantWaveHeight',
    2.8                        // local value for this module
);
```

### Remove an override:
```javascript
window.globalParamManager.removeLocalOverride(
    'myModuleId',
    'waveConditions',
    'significantWaveHeight'
);
```

### Listen for parameter changes:
```javascript
window.globalParamManager.addChangeListener((event) => {
    console.log(`${event.paramName} changed from ${event.oldValue} to ${event.newValue}`);
    // Update your UI, recalculate, etc.
});
```

---

## 3. Project Management

### Create a new project:
```javascript
const project = await window.projectManager.createProject({
    name: 'Marina Breakwater System',
    client: 'Port Authority',
    location: 'Harbor Bay',
    engineerName: 'John Doe',
    companyName: 'Coastal Engineering Inc.'
});
```

### Add a structure to the current project:
```javascript
await window.projectManager.addStructureToCurrentProject({
    name: 'Main Breakwater',
    type: 'rubble-standard',
    description: 'Primary wave protection structure'
});
```

### Save the current project:
```javascript
await window.projectManager.saveCurrentProject();
```

### Load an existing project:
```javascript
await window.projectManager.loadProject(projectId);
```

### Get all projects:
```javascript
const projects = await window.projectManager.getAllProjects();
projects.forEach(p => console.log(p.name));
```

### Export project to JSON:
```javascript
const project = window.projectManager.getCurrentProject();
window.projectManager.exportProjectAsJSON(project);
```

### Get project summary:
```javascript
const project = window.projectManager.getCurrentProject();
const summary = project.getSummary();

console.log(summary.totalStructures);
console.log(summary.byType);           // { 'rubble-standard': 2, ... }
console.log(summary.byStatus);          // { 'draft': 1, 'approved': 2 }
console.log(summary.totalQuantities);   // { armourTonnage, concreteVolume, ... }
```

---

## 4. Enhanced Form Builder

### Create a form with parameter binding:
```javascript
// Create form builder
const formBuilder = new EnhancedForm Builder('inputPanelId', 'myModuleId');

// Add a section header
formBuilder.addSection('Wave Conditions', 'Input design wave parameters');

// Add parameter inputs with tooltips and overrides
formBuilder.addParameterInput('waveConditions', 'significantWaveHeight', {
    label: 'Significant Wave Height (Hs)',
    tooltipKey: 'significantWaveHeight',
    allowOverride: true,        // Show override controls
    localOverride: false        // false = use global, true = local by default
});

formBuilder.addParameterInput('waveConditions', 'peakWavePeriod', {
    label: 'Peak Wave Period (Tp)',
    tooltipKey: 'peakPeriod',
    allowOverride: true
});

// Add a dropdown
const methodSelect = formBuilder.addSelect(
    'Calculation Method',
    [
        { value: 'smb', label: 'SMB (Shore Protection Manual)' },
        { value: 'jonswap', label: 'JONSWAP' }
    ],
    'smb'  // selected value
);

// Add a button
formBuilder.addButton('Calculate', 'btn-primary btn-large', async () => {
    const data = formBuilder.getData();
    console.log(data);
    // Perform calculations...
});

// Listen for parameter changes
formBuilder.container.addEventListener('parameterChanged', (e) => {
    console.log(`${e.detail.paramName} changed to ${e.detail.value}`);
});
```

### Display results:
```javascript
const resultDisplay = new ResultDisplayBuilder('resultPanelId');

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
        highlight: true,            // Yellow highlight
        tooltipKey: 'breakingWaveHeight'
    }
]);
```

---

## Common Patterns

### Pattern 1: Module with Global Parameters
```javascript
class MyCalculationModule {
    constructor(moduleId) {
        this.moduleId = moduleId;
    }
    
    getInputs() {
        // Get parameters with potential overrides
        const hs = window.globalParamManager.getParameter(
            'waveConditions',
            'significantWaveHeight',
            this.moduleId
        );
        
        const tp = window.globalParamManager.getParameter(
            'waveConditions',
            'peakWavePeriod',
            this.moduleId
        );
        
        return { hs: hs.value, tp: tp.value };
    }
    
    calculate() {
        const { hs, tp } = this.getInputs();
        // Perform calculations...
    }
}
```

### Pattern 2: Form with Override Capability
```javascript
const formBuilder = new EnhancedFormBuilder('inputPanel', 'depthLimitedModule');

// Add inputs that can be overridden
formBuilder.addParameterInput('waveConditions', 'significantWaveHeight', {
    label: 'Significant Wave Height (Hs)',
    tooltipKey: 'significantWaveHeight',
    allowOverride: true,
    helpText: 'Will be limited by depth-limited breaking'
});

// Calculate depth-limited height and set as override
document.getElementById('calculateBtn').addEventListener('click', () => {
    const d = parseFloat(document.getElementById('depth').value);
    const Hb = 0.78 * d;  // Simple breaking criteria
    
    // Set as local override
    window.globalParamManager.setLocalOverride(
        'depthLimitedModule',
        'waveConditions',
        'significantWaveHeight',
        Hb
    );
    
    // Form will automatically update with override badge
});
```

---

## Parameter Categories and Names

### Wave Conditions
- `significantWaveHeight`
- `peakWavePeriod`
- `meanWavePeriod`
- `waveDirection`
- `spectrumType`
- `waveLength`

### Site Conditions
- `waterDepth`
- `seabedSlope`
- `soilType`
- `temperature`
- `salinity`

### Water Levels
- `stillWaterLevel`
- `highTideLevel`
- `stormSurge`
- `seaLevelRise`
- `waveSetup`
- `designWaterLevel`

### Material Properties
- `armourDensity`
- `concreteDensity`
- `waterDensity`
- `frictionCoefficient`
- `corePermeability`

### Design Criteria
- `damageLevel`
- `slidingSafetyFactor`
- `overturningSafetyFactor`
- `maxOvertoppingDischarge`
- `designLife`
- `numberOfWaves`

---

## Debugging Tips

### Check if managers are initialized:
```javascript
console.log('Tooltip Manager:', window.tooltipManager);
console.log('Global Param Manager:', window.globalParamManager);
console.log('Project Manager:', window.projectManager);
```

### View all global parameters:
```javascript
const allParams = window.globalParamManager.getAllParameters();
console.log(allParams);
```

### Check for overrides in a module:
```javascript
const overrides = window.globalParamManager.getModuleOverrides('myModuleId');
console.log('Active overrides:', overrides);
```

### View current project:
```javascript
const project = window.projectManager.getCurrentProject();
console.log(project);
console.log(project.structures);
```

---

For complete documentation, see `REFACTORING.md`
