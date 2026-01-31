// ==========================================
// GLOBAL STATE MANAGEMENT
// ==========================================
const AppState = {
    currentPage: 'dashboard',
    unitSystem: 'metric', // 'metric' or 'imperial'
    projectData: {
        name: '',
        location: '',
        engineer: '',
        company: ''
    },
    waveData: {},
    structureData: {},
    serviceabilityData: {},
    selectedTemplate: 'rubble-standard'
};

// ==========================================
// PAGE NAVIGATION
// ==========================================
function navigateToPage(pageName) {
    // Update navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = pageName;

        // Initialize canvas when designer page is shown
        if (pageName === 'designer') {
            setTimeout(() => {
                if (typeof initCanvas === 'function') {
                    initCanvas();
                }
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(AppState.selectedTemplate);
                }
            }, 100);
        }
    }
}

// ==========================================
// UNIT CONVERSION
// ==========================================
const UnitConverter = {
    length: {
        metric: { m: 1, cm: 100, mm: 1000 },
        imperial: { ft: 3.28084, in: 39.3701, yd: 1.09361 }
    },
    density: {
        metric: { 'kg/m³': 1 },
        imperial: { 'lb/ft³': 0.062428 }
    },
    discharge: {
        metric: { 'l/s/m': 1, 'm³/s/m': 0.001 },
        imperial: { 'gal/s/ft': 0.198 }
    }
};

function convertUnit(value, fromSystem, toSystem, type) {
    if (fromSystem === toSystem) return value;

    // Convert to base metric unit
    const baseValue = value;

    // Convert from base to target
    // Simple implementation - extend as needed
    return baseValue;
}

function updateUnitsDisplay() {
    const system = AppState.unitSystem;
    const unitIndicator = document.querySelector('.unit-indicator');

    if (unitIndicator) {
        unitIndicator.textContent = system === 'metric' ? 'Metric' : 'Imperial';
    }

    // Update all unit displays
    document.querySelectorAll('.unit').forEach(el => {
        const type = el.dataset.unitType || 'length';
        if (system === 'imperial') {
            switch (type) {
                case 'length':
                    el.textContent = 'ft';
                    break;
                case 'density':
                    el.textContent = 'lb/ft³';
                    break;
                case 'discharge':
                    el.textContent = 'gal/s/ft';
                    break;
            }
        } else {
            switch (type) {
                case 'length':
                    el.textContent = 'm';
                    break;
                case 'density':
                    el.textContent = 'kg/m³';
                    break;
                case 'discharge':
                    el.textContent = 'l/s/m';
                    break;
            }
        }
    });
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==========================================
// PARAMETER BINDINGS
// ==========================================
const ParameterBindings = [
    // Wave Analysis Page
    { id: 'windSpeed', key: 'windSpeed' },
    { id: 'fetchLength', key: 'fetchLength' },
    { id: 'waterDepth', key: 'deepWaterDepth' }, // Deep water depth for wave generation
    { id: 'msl', key: 'msl' },
    { id: 'tidalRange', key: 'tidalRange' },
    { id: 'slr', key: 'slr' },

    // Serviceability & Structure Page
    { id: 'waveHeight', key: 'waveHeight' },
    { id: 'wavePeriod', key: 'wavePeriod' },
    { id: 'toeDepth', key: 'toeDepth' }    // Toe depth for structure design
];


function initializeParameterBindings() {
    if (!window.GlobalParams) return;

    // 1. Initialize globals with default values if not set
    const defaults = {
        deepWaterDepth: 30.0,
        toeDepth: 2.0,
        windSpeed: 20,
        fetchLength: 20000,
        msl: 0.0,
        tidalRange: 0.7,
        slr: 0.5,
        waveHeight: 1.0,
        wavePeriod: 10.0
    };

    Object.entries(defaults).forEach(([key, value]) => {
        // Only set if not already set (reloads)
        // For now, simple set
        window.GlobalParams.setGlobal(key, value, 'init');
    });

    // 2. Bind static inputs
    ParameterBindings.forEach(binding => {
        const input = document.getElementById(binding.id);
        if (input) {
            bindInputToGlobal(input, binding.key);
        }
    });

    // 3. Subscribe to changes to update UI
    window.GlobalParams.subscribe((key, type, value) => {
        // Update all inputs bound to this key
        const boundInputs = ParameterBindings.filter(b => b.key === key);
        boundInputs.forEach(binding => {
            const input = document.getElementById(binding.id);
            if (input && document.activeElement !== input) {
                input.value = value;
            }
        });

        // Also update dynamic inputs if they match
        // (This is handled by local subscription in loadTemplate usually, 
        // but we can do a global query selector for data-param-key if we implemented that)
        document.querySelectorAll(`[data-global-key="${key}"]`).forEach(input => {
            if (document.activeElement !== input) {
                input.value = value;
            }
        });
    });
}

function bindInputToGlobal(input, key) {
    if (!input || !window.GlobalParams) return;

    // Set initial value from global
    const globalValue = window.GlobalParams.getEffectiveValue(null, key);
    if (globalValue !== null && globalValue !== undefined) {
        input.value = globalValue;
    }

    // Add change listener
    input.addEventListener('change', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            window.GlobalParams.setGlobal(key, value, 'user-input');
        }
    });

    // Mark as bound
    input.dataset.globalKey = key;

    // Add visual indicator (Globe icon)
    const wrapper = input.parentElement;
    if (wrapper && wrapper.classList.contains('input-with-unit')) {
        wrapper.classList.add('global-param');

        // Add globe icon if not present
        if (!wrapper.querySelector('.global-icon')) {
            const icon = document.createElement('span');
            icon.className = 'global-icon';
            icon.innerHTML = '🌐';
            icon.title = 'Global Parameter';
            wrapper.appendChild(icon);
        }
    }

}

function initializeTideStationLogic() {
    const selector = document.getElementById('tideStation');
    const rangeInput = document.getElementById('tidalRange');

    if (!selector || !rangeInput) return;

    // Station Data (Tidal Range in meters)
    // Derived from UHSLC Datums (MHHW - MLLW approx or MHHW - MSL * 2)
    const stations = {
        'male': 0.70,       // UHSLC Stn 108
        'gan': 0.78,        // UHSLC Stn 109
        'hanimaadhoo': 0.80 // UHSLC Stn 117
    };

    const updateStationState = () => {
        const station = selector.value;

        if (station === 'manual') {
            rangeInput.disabled = false;
            rangeInput.title = "Enter a custom value";
            return;
        }

        // Lock input for specific stations
        rangeInput.disabled = true;
        rangeInput.title = `Fixed value for ${selector.options[selector.selectedIndex].text}`;

        const range = stations[station];
        if (range) {
            rangeInput.value = range;
            // Trigger change event to update GlobalParams if bound
            rangeInput.dispatchEvent(new Event('change'));

            // Visual feedback
            const wrapper = rangeInput.parentElement;
            if (wrapper) {
                const originalBg = wrapper.style.backgroundColor;
                wrapper.style.transition = 'background-color 0.3s';
                wrapper.style.backgroundColor = 'rgba(10, 132, 255, 0.2)';
                setTimeout(() => {
                    wrapper.style.backgroundColor = originalBg;
                }, 800);
            }
        }
    };

    selector.addEventListener('change', updateStationState);

    // Run once on load to set initial state
    updateStationState();
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('CoastalEngineer Pro - Initializing...');

    // Initialize parameter bindings
    initializeParameterBindings();

    // Initialize tide station logic
    initializeTideStationLogic();


    // Navigation event listeners
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            if (page) {
                navigateToPage(page);
            }
        });
    });

    // Dashboard feature card navigation
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.navigate;
            if (page) {
                navigateToPage(page);
            }
        });
    });

    // Unit toggle button
    const unitToggle = document.getElementById('unitToggle');
    if (unitToggle) {
        unitToggle.addEventListener('click', () => {
            openModal('unitModal');
        });
    }

    // Unit modal close
    const closeUnitModal = document.getElementById('closeUnitModal');
    if (closeUnitModal) {
        closeUnitModal.addEventListener('click', () => {
            closeModal('unitModal');
        });
    }

    // Unit system radio buttons
    document.querySelectorAll('input[name="unitSystem"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            AppState.unitSystem = e.target.value;
            updateUnitsDisplay();
            closeModal('unitModal');
        });
    });

    // Template selection
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.currentTarget.classList.add('active');

            const template = e.currentTarget.dataset.template;
            AppState.selectedTemplate = template;
            loadTemplate(template);
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            const parent = e.currentTarget.closest('.design-results') || e.currentTarget.parentElement.parentElement;

            // Update buttons
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Update content
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const targetContent = parent.querySelector(`#${tabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Wave calculator
    const calculateWaves = document.getElementById('calculateWaves');
    if (calculateWaves) {
        calculateWaves.addEventListener('click', performWaveCalculations);
    }

    // Serviceability calculator
    const calculateOvertopping = document.getElementById('calculateOvertopping');
    if (calculateOvertopping) {
        calculateOvertopping.addEventListener('click', performOvertoppingCalculations);
    }

    // Structure analysis
    const analyzeStructure = document.getElementById('analyzeStructure');
    if (analyzeStructure) {
        analyzeStructure.addEventListener('click', performStructureAnalysis);
    }

    // Template selection dropdown
    const templateSelect = document.getElementById('structureTemplateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function () {
            const templateName = this.value;
            if (templateName) {
                AppState.selectedTemplate = templateName;
                loadTemplate(templateName);

                // Show the parameter panel (it's hidden by default)
                const parameterPanel = document.querySelector('.design-parameters');
                if (parameterPanel) {
                    parameterPanel.style.display = 'block';
                }
            }
        });
    }

    // Hide parameters initially until a template is selected
    const parameterPanel = document.querySelector('.design-parameters');
    if (parameterPanel) {
        parameterPanel.style.display = 'none';
    }

    // PDF Export
    const exportPDF = document.getElementById('exportPDF');
    const generateReport = document.getElementById('generateReport');

    if (exportPDF) {
        exportPDF.addEventListener('click', () => {
            navigateToPage('reports');
        });
    }

    if (generateReport) {
        generateReport.addEventListener('click', generatePDFReport);
    }

    // Canvas controls
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetView = document.getElementById('resetView');

    if (zoomIn) zoomIn.addEventListener('click', () => canvasZoom(1.2));
    if (zoomOut) zoomOut.addEventListener('click', () => canvasZoom(0.8));
    const resetCanvasViewLocal = () => {
        // Redraw structure which resets any zoom contexts?
        // Actually zoom is likely handled in canvas.js vars.
        // Assuming canvasZoom resets if needed or just re-draws.
        // If canvas.js exposes a reset function, call it.
        // If not, simply redrawing usually fits the view.
        if (typeof drawStructureOnCanvas === 'function') {
            drawStructureOnCanvas();
        }
    };
    if (resetView) resetView.addEventListener('click', resetCanvasViewLocal);

    // Save to Library button
    const saveToLibrary = document.getElementById('saveToLibrary');
    if (saveToLibrary) {
        saveToLibrary.addEventListener('click', () => {
            if (typeof saveCurrentStructureToLibrary === 'function') {
                saveCurrentStructureToLibrary();
            }
        });
    }

    // Add event listeners for all buttons with data-navigate attribute
    document.addEventListener('click', (e) => {
        const navButton = e.target.closest('[data-navigate]');
        if (navButton) {
            const page = navButton.dataset.navigate;
            if (page) {
                navigateToPage(page);
            }
        }
    });

    // Load recent projects on dashboard
    loadRecentProjects();

    // Initialize default template
    loadTemplate('rubble-standard');

    // Render formulas if KaTeX is available
    if (typeof renderMathInElement !== 'undefined') {
        setTimeout(() => {
            document.querySelectorAll('.formula').forEach(el => {
                renderMathInElement(el, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ]
                });
            });
        }, 500);
    }

    console.log('CoastalEngineer Pro - Ready!');
});

// ==========================================
// PROJECT WIZARD LAUNCHER
// ==========================================
function launchProjectWizard() {
    console.log('launchProjectWizard called');
    console.log('projectWizard available:', window.projectWizard);

    if (window.projectWizard) {
        console.log('Starting wizard...');
        window.projectWizard.start();

        // Wire up navigation buttons
        const nextBtn = document.getElementById('wizardNextBtn');
        const prevBtn = document.getElementById('wizardPrevBtn');
        const closeBtn = document.getElementById('closeWizardModal');

        if (nextBtn) nextBtn.onclick = () => window.projectWizard.nextStep();
        if (prevBtn) prevBtn.onclick = () => window.projectWizard.previousStep();
        if (closeBtn) closeBtn.onclick = () => window.projectWizard.hideWizardModal();
    } else {
        console.error('Project wizard not initialized!');
        alert('Project wizard is not ready. Please refresh the page.');
    }
}

// Make it globally accessible
window.launchProjectWizard = launchProjectWizard;

// ==========================================
// TEMPLATE LOADING
// ==========================================
function loadTemplate(templateName) {
    const parameterInputs = document.getElementById('parameterInputs');
    if (!parameterInputs) return;

    // Clear existing inputs
    parameterInputs.innerHTML = '';

    // Prepare Armour Options (used by multiple structure types)
    let armourOptions = [];
    if (window.ArmourTypes) {
        armourOptions = Object.keys(window.ArmourTypes).map(k => ({ value: k, label: window.ArmourTypes[k].name }));
    } else {
        armourOptions = [{ value: 'rock_angular', label: 'Default Rock' }];
    }

    // Define parameters based on template
    let parameters = [];

    switch (templateName) {
        case 'rubble-standard':

            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Number of Layers', id: 'layerCount', value: 3, type: 'select', options: [1, 2, 3], tooltipKey: 'layer-count' },
                { label: 'Left Slope (cotα)', id: 'slopeLeft', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Right Slope (cotα)', id: 'slopeRight', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Crest Height', unit: 'm', id: 'crestHeight', value: 2.8, tooltipKey: 'crest-elevation' },
                { label: 'Water Depth at Toe (d_toe)', unit: 'm', id: 'depth', value: 3.5, tooltipKey: 'water-depth' },

                // === ARMOUR LAYER (includes Crest) ===
                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.2, tooltipKey: 'armour-dn50' },
                { label: 'Armour Layer Count (n)', id: 'armourLayers', value: 2, type: 'select', options: [1, 2, 3, 4, 5], tooltipKey: 'armour-layers' },
                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 4.0, tooltipKey: 'stability-coefficient' },
                { label: 'Porosity (n)', id: 'matPorosity', value: 0.37, tooltipKey: 'porosity' },
                { label: 'Notional Permeability (P)', id: 'permeability', value: 0.4, tooltipKey: 'permeability-coefficient' },
                { label: 'Damage Level (S)', id: 'damageLevel', value: 2.0, tooltipKey: 'damage-level' },
                { label: 'Number of Waves (N)', id: 'stormWaves', value: 3000, tooltipKey: 'number-of-waves' },
                { label: 'Crest Width Multiplier', id: 'crestWidthMultiplier', value: 3, type: 'select', options: [2, 3, 4, 5], tooltipKey: 'crest-width-multiplier' },
                { label: 'Crest Width (Calculated)', unit: 'm', id: 'crestWidthDisplay', value: 3.6, type: 'readonly', tooltipKey: 'crest-width' },

                // === FILTER LAYER ===
                { type: 'group', label: 'Filter Layer' },
                { label: 'Filter Material Type', id: 'filterType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'filter-type' },
                {
                    label: 'Filter Weight Ratio (W_f/W_a)', id: 'filterWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'filter-weight-ratio',
                    placeholder: 'e.g., 10 for 1/10',
                    datalist: [5, 10, 15]
                },
                { label: 'Filter Dn50 (Calculated)', unit: 'm', id: 'filterDn50Display', value: 0.56, type: 'readonly', tooltipKey: 'filter-dn50' },
                { label: 'Filter Layer Count (n)', id: 'filterLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'filter-layers' },

                // === CORE ===
                { type: 'group', label: 'Core' },
                {
                    label: 'Core Weight Ratio (W_c/W_a)', id: 'coreWeightRatio', value: 200, step: 10, min: 1,
                    tooltipKey: 'core-weight-ratio',
                    placeholder: 'e.g., 200 for 1/200',
                    datalist: [100, 200, 500]
                },
                { label: 'Core Dn50 (Calculated)', unit: 'm', id: 'coreDn50Display', value: 0.20, type: 'readonly', tooltipKey: 'core-dn50' },

                // === TOE ===
                { type: 'group', label: 'Toe' },
                { label: 'Enable Left Toe', id: 'hasLeftToe', value: true, type: 'checkbox', tooltipKey: 'toe-width' },
                { label: 'Enable Right Toe', id: 'hasRightToe', value: true, type: 'checkbox', tooltipKey: 'toe-width' },
                { label: 'Toe Material Type', id: 'toeType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'toe-type' },
                {
                    label: 'Toe Weight Ratio (W_t/W_a)', id: 'toeWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'toe-weight-ratio',
                    placeholder: 'e.g., 10 for 1/10',
                    datalist: [5, 10, 15]
                },
                { label: 'Toe Dn50 (Calculated)', unit: 'm', id: 'toeDn50Display', value: 0.56, type: 'readonly', tooltipKey: 'toe-dn50' },
                { label: 'Toe Layer Count (n)', id: 'toeLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'toe-layers' },
                { label: 'Toe Width Multiplier', id: 'toeWidthMultiplier', value: 4, type: 'select', options: [3, 4, 5, 6], tooltipKey: 'toe-width-multiplier' },
                { label: 'Left Toe Width (Calculated)', unit: 'm', id: 'toeLeftWidthDisplay', value: 2.2, type: 'readonly', tooltipKey: 'toe-width' },
                { label: 'Right Toe Width (Calculated)', unit: 'm', id: 'toeRightWidthDisplay', value: 2.2, type: 'readonly', tooltipKey: 'toe-width' },
                { label: 'Left Toe Slope', id: 'toeSlopeLeft', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Right Toe Slope', id: 'toeSlopeRight', value: 1.5, tooltipKey: 'structure-slope' }
            ];
            break;

        case 'rubble-bullnose':
            // Rubble Mound with Bullnose / Superstructure
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Number of Layers', id: 'layerCount', value: 3, type: 'select', options: [1, 2, 3], tooltipKey: 'layer-count' },
                { label: 'Left Slope (cotα)', id: 'slopeLeft', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Right Slope (cotα)', id: 'slopeRight', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Crest Height', unit: 'm', id: 'crestHeight', value: 2.8, tooltipKey: 'crest-elevation' },
                { label: 'Water Depth at Toe (d_toe)', unit: 'm', id: 'depth', value: 3.5, tooltipKey: 'water-depth' },

                // === BULLNOSE / WAVE WALL ===
                { type: 'group', label: 'Superstructure / Bullnose' },
                { label: 'Has Bullnose/Parapet', id: 'hasBullnose', value: true, type: 'checkbox', tooltipKey: 'bullnose-check' },
                { label: 'Bullnose Width', unit: 'm', id: 'bullnoseWidth', value: 1.0, step: 0.1, tooltipKey: 'bullnose-width' },
                { label: 'Bullnose Height', unit: 'm', id: 'bullnoseHeight', value: 1.2, step: 0.1, tooltipKey: 'bullnose-height' },
                { label: 'Bullnose Factor (γ_bn)', id: 'bullnoseFactor', value: 0.7, step: 0.05, min: 0.1, max: 1.0, tooltipKey: 'bullnose-factor' },

                // === ARMOUR LAYER (includes Crest) ===
                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.2, tooltipKey: 'armour-dn50' },
                { label: 'Armour Layer Count (n)', id: 'armourLayers', value: 2, type: 'select', options: [1, 2, 3, 4, 5], tooltipKey: 'armour-layers' },
                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 4.0, tooltipKey: 'stability-coefficient' },
                { label: 'Porosity (n)', id: 'matPorosity', value: 0.37, tooltipKey: 'porosity' },
                { label: 'Notional Permeability (P)', id: 'permeability', value: 0.4, tooltipKey: 'permeability-coefficient' },
                { label: 'Damage Level (S)', id: 'damageLevel', value: 2.0, tooltipKey: 'damage-level' },
                { label: 'Number of Waves (N)', id: 'stormWaves', value: 3000, tooltipKey: 'number-of-waves' },
                { label: 'Crest Width Multiplier', id: 'crestWidthMultiplier', value: 3, type: 'select', options: [2, 3, 4, 5], tooltipKey: 'crest-width-multiplier' },
                { label: 'Crest Width (Calculated)', unit: 'm', id: 'crestWidthDisplay', value: 3.6, type: 'readonly', tooltipKey: 'crest-width' },

                // === FILTER LAYER ===
                { type: 'group', label: 'Filter Layer' },
                { label: 'Filter Material Type', id: 'filterType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'filter-type' },
                {
                    label: 'Filter Weight Ratio (W_f/W_a)', id: 'filterWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'filter-weight-ratio',
                    placeholder: 'e.g., 10 for 1/10',
                    datalist: [5, 10, 15]
                },
                { label: 'Filter Dn50 (Calculated)', unit: 'm', id: 'filterDn50Display', value: 0.56, type: 'readonly', tooltipKey: 'filter-dn50' },
                { label: 'Filter Layer Count (n)', id: 'filterLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'filter-layers' },

                // === CORE ===
                { type: 'group', label: 'Core' },
                {
                    label: 'Core Weight Ratio (W_c/W_a)', id: 'coreWeightRatio', value: 200, step: 10, min: 1,
                    tooltipKey: 'core-weight-ratio',
                    placeholder: 'e.g., 200 for 1/200',
                    datalist: [100, 200, 500]
                },
                { label: 'Core Dn50 (Calculated)', unit: 'm', id: 'coreDn50Display', value: 0.20, type: 'readonly', tooltipKey: 'core-dn50' },

                // === TOE ===
                { type: 'group', label: 'Toe' },
                { label: 'Enable Left Toe', id: 'hasLeftToe', value: true, type: 'checkbox', tooltipKey: 'toe-width' },
                { label: 'Enable Right Toe', id: 'hasRightToe', value: true, type: 'checkbox', tooltipKey: 'toe-width' },
                { label: 'Toe Material Type', id: 'toeType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'toe-type' },
                {
                    label: 'Toe Weight Ratio (W_t/W_a)', id: 'toeWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'toe-weight-ratio',
                    placeholder: 'e.g., 10 for 1/10',
                    datalist: [5, 10, 15]
                },
                { label: 'Toe Dn50 (Calculated)', unit: 'm', id: 'toeDn50Display', value: 0.56, type: 'readonly', tooltipKey: 'toe-dn50' },
                { label: 'Toe Layer Count (n)', id: 'toeLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'toe-layers' },
                { label: 'Toe Width Multiplier', id: 'toeWidthMultiplier', value: 4, type: 'select', options: [3, 4, 5, 6], tooltipKey: 'toe-width-multiplier' },
                { label: 'Left Toe Width (Calculated)', unit: 'm', id: 'toeLeftWidthDisplay', value: 2.2, type: 'readonly', tooltipKey: 'toe-width' },
                { label: 'Right Toe Width (Calculated)', unit: 'm', id: 'toeRightWidthDisplay', value: 2.2, type: 'readonly', tooltipKey: 'toe-width' },
                { label: 'Left Toe Slope', id: 'toeSlopeLeft', value: 1.5, tooltipKey: 'structure-slope' },
                { label: 'Right Toe Slope', id: 'toeSlopeRight', value: 1.5, tooltipKey: 'structure-slope' }
            ];
            break;

        case 'rubble-revetment':
            // Rubble Mound Revetment - Shore protection structure
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                // Removed generic "Number of Layers" as requested - assuming always Armour + Filter
                { label: 'Revetment Slope (1:n)', id: 'slopeLeft', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Crest Elevation', unit: 'm', id: 'crestHeight', value: 3.5, tooltipKey: 'crest-elevation' },
                { label: 'Reclamation Level', unit: 'm', id: 'reclamationLevel', value: 1.6, step: 0.1, tooltipKey: 'reclamation-level' },
                { label: 'Water Depth at Toe (d_toe)', unit: 'm', id: 'depth', value: 2.0, tooltipKey: 'water-depth' },

                // === BULLNOSE / WAVE WALL ===
                { type: 'group', label: 'Superstructure / Bullnose' },
                { label: 'Has Bullnose/Parapet', id: 'hasBullnose', value: false, type: 'checkbox', tooltipKey: 'bullnose-check' },
                { label: 'Bullnose Width', unit: 'm', id: 'bullnoseWidth', value: 1.0, step: 0.1, tooltipKey: 'bullnose-width' },
                { label: 'Bullnose Height', unit: 'm', id: 'bullnoseHeight', value: 1.2, step: 0.1, tooltipKey: 'bullnose-height' },
                { label: 'Bullnose Factor (γ_bn)', id: 'bullnoseFactor', value: 0.7, step: 0.05, min: 0.1, max: 1.0, tooltipKey: 'bullnose-factor' },

                // === ARMOUR LAYER ===
                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 0.8, tooltipKey: 'armour-dn50' },
                { label: 'Armour Layer Count (n)', id: 'armourLayers', value: 2, type: 'select', options: [2, 3], tooltipKey: 'armour-layers' }, // Default 2, strictly enforced in logic often

                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 2.0, tooltipKey: 'stability-coefficient' },
                { label: 'Porosity (n)', id: 'matPorosity', value: 0.40, tooltipKey: 'porosity' },
                { label: 'Notional Permeability (P)', id: 'permeability', value: 0.5, tooltipKey: 'permeability-coefficient' },
                { label: 'Damage Level (S)', id: 'damageLevel', value: 2.0, tooltipKey: 'damage-level' },
                { label: 'Number of Waves (N)', id: 'stormWaves', value: 3000, tooltipKey: 'number-of-waves' },
                { label: 'Crest Width Multiplier', id: 'crestWidthMultiplier', value: 3, type: 'select', options: [2, 3, 4, 5], tooltipKey: 'crest-width-multiplier' },
                { label: 'Crest Width (Calculated)', unit: 'm', id: 'crestWidthDisplay', value: 2.4, type: 'readonly', tooltipKey: 'crest-width' },

                // === FILTER LAYER ===
                { type: 'group', label: 'Filter Layer' },
                { label: 'Filter Material Type', id: 'filterType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'filter-type' },
                {
                    label: 'Filter Weight Ratio (W_f/W_a)', id: 'filterWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'filter-weight-ratio', placeholder: 'e.g., 10 for 1/10', datalist: [5, 10, 15]
                },
                { label: 'Filter Dn50 (Calculated)', unit: 'm', id: 'filterDn50Display', value: 0.37, type: 'readonly', tooltipKey: 'filter-dn50' },
                { label: 'Filter Layer Count (n)', id: 'filterLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'filter-layers' },

                // === CORE ===
                { type: 'group', label: 'Core' },
                {
                    label: 'Core Weight Ratio (W_c/W_a)', id: 'coreWeightRatio', value: 200, step: 10, min: 1,
                    tooltipKey: 'core-weight-ratio', placeholder: 'e.g., 200 for 1/200', datalist: [100, 200, 500]
                },
                { label: 'Core Dn50 (Calculated)', unit: 'm', id: 'coreDn50Display', value: 0.14, type: 'readonly', tooltipKey: 'core-dn50' },

                // === TOE ===
                { type: 'group', label: 'Toe' },
                { label: 'Toe Depth', unit: 'm', id: 'toeDepth', value: 1.5, tooltipKey: 'toe-depth' },
                { label: 'Toe Material Type', id: 'toeType', value: 'rock_angular', type: 'select', options: armourOptions, tooltipKey: 'toe-type' },
                {
                    label: 'Toe Weight Ratio (W_t/W_a)', id: 'toeWeightRatio', value: 10, step: 1, min: 1,
                    tooltipKey: 'toe-weight-ratio', placeholder: 'e.g., 10 for 1/10', datalist: [5, 10, 15]
                },
                { label: 'Toe Dn50 (Calculated)', unit: 'm', id: 'toeDn50Display', value: 0.37, type: 'readonly', tooltipKey: 'toe-dn50' },
                { label: 'Toe Layer Count (n)', id: 'toeLayers', value: 2, type: 'select', options: [1, 2, 3], tooltipKey: 'toe-layers' },
                { label: 'Toe Width Multiplier', id: 'toeWidthMultiplier', value: 3, type: 'select', options: [2, 3, 4, 5], tooltipKey: 'toe-width-multiplier' },
                { label: 'Toe Width (Calculated)', unit: 'm', id: 'toeWidthDisplay', value: 1.1, type: 'readonly', tooltipKey: 'toe-width' }
            ];
            break;

        case 'rubble-berm':
            // Berm Breakwater - Reshaping structure with berm
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Number of Layers', id: 'layerCount', value: 3, type: 'select', options: [1, 2, 3], tooltipKey: 'layer-count' },
                { label: 'Structure Slope (1:n)', id: 'slopeLeft', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Crest Height', unit: 'm', id: 'crestHeight', value: 4.0, tooltipKey: 'crest-elevation' },
                { label: 'Water Depth at Toe (d_toe)', unit: 'm', id: 'depth', value: 5.0, tooltipKey: 'water-depth' },

                // === BERM PARAMETERS ===
                { type: 'group', label: 'Berm Configuration' },
                { label: 'Berm Width (Bb)', unit: 'm', id: 'bermWidth', value: 15.0, tooltipKey: 'berm-width' },
                { label: 'Berm Elevation', unit: 'm', id: 'bermElevation', value: 2.0, tooltipKey: 'berm-elevation' },
                { label: 'Recession Allowed (Rec)', unit: 'm', id: 'recession', value: 5.0, tooltipKey: 'recession' },

                // === ARMOUR LAYER ===
                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.5, tooltipKey: 'armour-dn50' },
                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Notional Permeability (P)', id: 'permeability', value: 0.4, tooltipKey: 'permeability-coefficient' },
                { label: 'Damage Level (Nod)', id: 'damageLevel', value: 0.5, tooltipKey: 'damage-level' }
            ];
            break;



        case 'rubble-low':
            // Low-Crested Breakwater - Allows overtopping and transmission
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Structure Slope (1:n)', id: 'slopeLeft', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Crest Elevation (Rc)', unit: 'm', id: 'crestHeight', value: 1.5, tooltipKey: 'crest-elevation' },
                { label: 'Crest Width (Gc)', unit: 'm', id: 'crestWidth', value: 5.0, tooltipKey: 'crest-width' },
                { label: 'Rear Slope (1:n)', id: 'slopeRight', value: 2.0, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 3.5, tooltipKey: 'water-depth' },

                // === BULLNOSE / WAVE WALL ===
                { type: 'group', label: 'Superstructure / Bullnose' },
                { label: 'Has Bullnose/Parapet', id: 'hasBullnose', value: false, type: 'checkbox', tooltipKey: 'bullnose-check' },
                { label: 'Bullnose Factor (γ_bn)', id: 'bullnoseFactor', value: 0.7, step: 0.05, min: 0.1, max: 1.0, tooltipKey: 'bullnose-factor' },

                // === ARMOUR LAYER ===
                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.2, tooltipKey: 'armour-dn50' },
                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 3.5, tooltipKey: 'stability-coefficient' }
            ];
            break;

        case 'vertical-wall':
            // Vertical Wall - Goda wave forces
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Wall Height (hc)', unit: 'm', id: 'wallHeight', value: 12.0, tooltipKey: 'wall-height' },
                { label: 'Wall Thickness (t)', unit: 'm', id: 'wallThickness', value: 3.0, tooltipKey: 'wall-thickness' },
                { label: 'Foundation Width (B)', unit: 'm', id: 'foundationWidth', value: 10.0, tooltipKey: 'foundation-width' },
                { label: 'Foundation Depth (df)', unit: 'm', id: 'foundationDepth', value: 4.0, tooltipKey: 'foundation-depth' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 10.0, tooltipKey: 'water-depth' },

                // === MATERIAL PROPERTIES ===
                { type: 'group', label: 'Material Properties' },
                { label: 'Concrete Density (ρc)', unit: 'kg/m³', id: 'concreteDensity', value: 2400, tooltipKey: 'concrete-density' },
                { label: 'Fill Density (ρf)', unit: 'kg/m³', id: 'fillDensity', value: 1800, tooltipKey: 'fill-density' },
                { label: 'Friction Coefficient (μ)', id: 'frictionCoeff', value: 0.6, step: 0.05, tooltipKey: 'friction-coeff' },

                // === WAVE PARAMETERS ===
                { type: 'group', label: 'Wave Parameters' },
                { label: 'Design Wave Height (H)', unit: 'm', id: 'waveHeight', value: 4.0, tooltipKey: 'wave-height' },
                { label: 'Wave Period (T)', unit: 's', id: 'wavePeriod', value: 10.0, tooltipKey: 'wave-period' },
                { label: 'Wave Angle (β)', unit: '°', id: 'waveAngle', value: 0, step: 5, tooltipKey: 'wave-angle' }
            ];
            break;

        case 'vertical-composite':
            // Composite Structure - Rubble mound base + vertical wall
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Total Structure Height', unit: 'm', id: 'totalHeight', value: 15.0, tooltipKey: 'total-height' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 10.0, tooltipKey: 'water-depth' },

                // === MOUND PARAMETERS ===
                { type: 'group', label: 'Rubble Mound Base' },
                { label: 'Mound Height (hm)', unit: 'm', id: 'moundHeight', value: 6.0, tooltipKey: 'mound-height' },
                { label: 'Mound Crest Width (Bm)', unit: 'm', id: 'moundWidth', value: 8.0, tooltipKey: 'mound-width' },
                { label: 'Mound Slope (1:n)', id: 'moundSlope', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.5, tooltipKey: 'armour-dn50' },
                { label: 'Armour Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },

                // === WALL PARAMETERS ===
                { type: 'group', label: 'Vertical Wall' },
                { label: 'Wall Height (hc)', unit: 'm', id: 'wallHeight', value: 9.0, tooltipKey: 'wall-height' },
                { label: 'Wall Thickness (t)', unit: 'm', id: 'wallThickness', value: 2.5, tooltipKey: 'wall-thickness' },
                { label: 'Concrete Density (ρc)', unit: 'kg/m³', id: 'concreteDensity', value: 2400, tooltipKey: 'concrete-density' },
                { label: 'Friction Coefficient (μ)', id: 'frictionCoeff', value: 0.6, step: 0.05, tooltipKey: 'friction-coeff' },

                // === WAVE PARAMETERS ===
                { type: 'group', label: 'Wave Parameters' },
                { label: 'Design Wave Height (H)', unit: 'm', id: 'waveHeight', value: 4.5, tooltipKey: 'wave-height' },
                { label: 'Wave Period (T)', unit: 's', id: 'wavePeriod', value: 10.0, tooltipKey: 'wave-period' }
            ];
            break;

        case 'vertical-caisson':
            // Caisson - Prefabricated concrete box structure
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 12.0, tooltipKey: 'water-depth' },

                // === CAISSON GEOMETRY ===
                { type: 'group', label: 'Caisson Dimensions' },
                { label: 'Caisson Width (B)', unit: 'm', id: 'caissonWidth', value: 12.0, tooltipKey: 'caisson-width' },
                { label: 'Caisson Height (hc)', unit: 'm', id: 'caissonHeight', value: 15.0, tooltipKey: 'caisson-height' },
                { label: 'Wall Thickness (t)', unit: 'm', id: 'wallThickness', value: 0.5, tooltipKey: 'wall-thickness' },
                { label: 'Number of Cells', id: 'cellCount', value: 3, type: 'select', options: [1, 2, 3, 4, 5], tooltipKey: 'cell-count' },

                // === FOUNDATION ===
                { type: 'group', label: 'Foundation' },
                { label: 'Foundation Height (hf)', unit: 'm', id: 'foundationHeight', value: 2.0, tooltipKey: 'foundation-height' },

                // === MATERIAL PROPERTIES ===
                { type: 'group', label: 'Material Properties' },
                { label: 'Concrete Density (ρc)', unit: 'kg/m³', id: 'concreteDensity', value: 2400, tooltipKey: 'concrete-density' },
                { label: 'Fill Material Density (ρf)', unit: 'kg/m³', id: 'fillDensity', value: 1900, tooltipKey: 'fill-density' },
                { label: 'Friction Coefficient (μ)', id: 'frictionCoeff', value: 0.6, step: 0.05, tooltipKey: 'friction-coeff' },

                // === WAVE PARAMETERS ===
                { type: 'group', label: 'Wave Parameters' },
                { label: 'Design Wave Height (H)', unit: 'm', id: 'waveHeight', value: 5.0, tooltipKey: 'wave-height' },
                { label: 'Wave Period (T)', unit: 's', id: 'wavePeriod', value: 11.0, tooltipKey: 'wave-period' },
                { label: 'Wave Angle (β)', unit: '°', id: 'waveAngle', value: 0, step: 5, tooltipKey: 'wave-angle' }
            ];
            break;

        case 'vertical-perforated':
            // Perforated Wall - Reduced reflection structure
            parameters = [
                // === GENERAL STRUCTURE ===
                { type: 'group', label: 'General Structure' },
                { label: 'Wall Height (hc)', unit: 'm', id: 'wallHeight', value: 12.0, tooltipKey: 'wall-height' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 10.0, tooltipKey: 'water-depth' },

                // === PERFORATION PARAMETERS ===
                { type: 'group', label: 'Perforation Configuration' },
                { label: 'Perforation Ratio (ε)', unit: '%', id: 'perforationRatio', value: 25, step: 5, min: 10, max: 40, tooltipKey: 'perforation-ratio' },
                { label: 'Perforation Diameter (dp)', unit: 'cm', id: 'perforationDiameter', value: 15, tooltipKey: 'perforation-diameter' },
                { label: 'Chamber Width (B)', unit: 'm', id: 'chamberWidth', value: 2.0, tooltipKey: 'chamber-width' },
                { label: 'Wall Thickness (t)', unit: 'm', id: 'wallThickness', value: 0.4, tooltipKey: 'wall-thickness' },

                // === FOUNDATION ===
                { type: 'group', label: 'Foundation' },
                { label: 'Foundation Width (Bf)', unit: 'm', id: 'foundationWidth', value: 10.0, tooltipKey: 'foundation-width' },
                { label: 'Foundation Depth (df)', unit: 'm', id: 'foundationDepth', value: 3.0, tooltipKey: 'foundation-depth' },

                // === MATERIAL PROPERTIES ===
                { type: 'group', label: 'Material Properties' },
                { label: 'Concrete Density (ρc)', unit: 'kg/m³', id: 'concreteDensity', value: 2400, tooltipKey: 'concrete-density' },
                { label: 'Friction Coefficient (μ)', id: 'frictionCoeff', value: 0.6, step: 0.05, tooltipKey: 'friction-coeff' },

                // === WAVE PARAMETERS ===
                { type: 'group', label: 'Wave Parameters' },
                { label: 'Design Wave Height (H)', unit: 'm', id: 'waveHeight', value: 4.0, tooltipKey: 'wave-height' },
                { label: 'Wave Period (T)', unit: 's', id: 'wavePeriod', value: 10.0, tooltipKey: 'wave-period' },
                { label: 'Reflection Coefficient (Kr)', id: 'reflectionCoeff', value: 0.4, step: 0.05, min: 0.2, max: 0.8, tooltipKey: 'reflection-coeff' }
            ];
            break;

        // Add more templates as needed
        default:
            parameters = [
                { label: 'Structure Height', unit: 'm', id: 'height', value: 5.0 },
                { label: 'Structure Width', unit: 'm', id: 'width', value: 10.0 }
            ];
    }

    // Create form groups for each parameter
    parameterInputs.innerHTML = ''; // Clear previous

    // Create a two-column grid container
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md, 16px);
    `;

    parameters.forEach(param => {
        // Handle group headers
        if (param.type === 'group') {
            const groupHeader = document.createElement('div');
            groupHeader.className = 'parameter-group-header';
            groupHeader.style.cssText = `
                grid-column: 1 / -1;
                margin-top: 16px;
                margin-bottom: 8px;
                padding-bottom: 4px;
                border-bottom: 2px solid var(--md-sys-color-primary);
                font-weight: 600;
                font-size: 14px;
                color: var(--md-sys-color-primary);
            `;
            groupHeader.textContent = param.label;
            gridContainer.appendChild(groupHeader);
            return; // Skip to next parameter
        }

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        let inputHTML = '';
        const paramType = param.type || 'number';

        if (paramType === 'select') {
            const options = param.options || [];
            const optsHTML = options.map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const lab = typeof o === 'object' ? o.label : o;
                const isSelected = val == param.value ? 'selected' : '';
                return `<option value="${val}" ${isSelected}>${lab}</option>`;
            }).join('');
            inputHTML = `<select id="${param.id}" class="form-control">${optsHTML}</select>`;
        } else if (paramType === 'checkbox') {
            inputHTML = `
                <div class="checkbox-wrapper" style="display:flex; align-items:center;">
                    <input type="checkbox" id="${param.id}" ${param.value ? 'checked' : ''} style="width:auto; margin-right:10px;">
                    <span style="font-size:0.9em; color:var(--topography-600);">Enable</span>
                </div>`;
        } else if (paramType === 'readonly') {
            inputHTML = `
                <div class="input-with-unit">
                    <input type="number" id="${param.id}" value="${param.value}" step="${param.step || 0.1}" readonly style="background-color: var(--md-sys-color-surface-variant); cursor: not-allowed;">
                    <span class="unit">${param.unit || ''}</span>
                </div>`;
        } else {
            // Number input with optional datalist for suggestions
            const datalistId = param.datalist ? `${param.id}-datalist` : '';
            const datalistHTML = param.datalist ? `
                <datalist id="${datalistId}">
                    ${param.datalist.map(val => `<option value="${val}">1/${val}</option>`).join('')}
                </datalist>` : '';

            inputHTML = `
                <div class="input-with-unit">
                    <input type="number" id="${param.id}" value="${param.value}" step="${param.step || 0.1}" 
                           min="${param.min || ''}" placeholder="${param.placeholder || ''}"
                           ${datalistId ? `list="${datalistId}"` : ''}>
                    <span class="unit">${param.unit || ''}</span>
                </div>${datalistHTML}`;
        }

        formGroup.innerHTML = `<label data-tooltip-key="${param.tooltipKey || param.id}">${param.label}</label>${inputHTML}`;
        gridContainer.appendChild(formGroup);

        // Attach Tooltip
        const tipSystem = window.tooltipSystem || window.tooltipManager;
        if (tipSystem && typeof tipSystem.addTooltip === 'function') {
            const labelEl = formGroup.querySelector('label');
            const key = param.tooltipKey || param.id;
            if (labelEl) tipSystem.addTooltip(labelEl, key);
        }

        // Bind dynamic inputs to global parameters if applicable
        if (param.id === 'depth') {
            const input = formGroup.querySelector('input');
            if (input && typeof bindInputToGlobal === 'function') {
                bindInputToGlobal(input, 'toeDepth');
            }
        }

        // Specific Logic for Armour Type Change (Auto-update properties)
        if (param.id === 'armourType' && window.ArmourTypes) {
            const selectEl = formGroup.querySelector('select');
            if (selectEl) {
                selectEl.addEventListener('change', (e) => {
                    const type = e.target.value;
                    const data = window.ArmourTypes[type];
                    if (data && type !== 'user_defined') {
                        // Update inputs
                        const setVal = (id, val) => {
                            const input = document.getElementById(id);
                            if (input) input.value = val;
                        };
                        setVal('matDensity', data.rho);
                        setVal('matKd', data.kd);
                        setVal('matPorosity', data.porosity);
                    }
                });
            }
        }

        // Add listener for redraw
        const inputElem = document.getElementById(param.id);
        if (inputElem) {
            inputElem.addEventListener('input', () => {
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(templateName);
                }
            });
            inputElem.addEventListener('change', () => { // For select/checkbox
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(templateName);
                }
            });
        }
    });

    // Append the grid container to the parameter inputs area
    parameterInputs.appendChild(gridContainer);

    // Function to update calculated crest width display
    function updateCrestWidthDisplay() {
        const multiplier = parseInt(document.getElementById('crestWidthMultiplier')?.value || 3);
        const Dn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);
        const crestWidth = multiplier * Dn50;

        const displayInput = document.getElementById('crestWidthDisplay');
        if (displayInput) {
            displayInput.value = crestWidth.toFixed(2);
        }
    }

    // Add listeners to update crest width when dependencies change
    const crestWidthDeps = ['crestWidthMultiplier', 'armourDn50'];
    crestWidthDeps.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('change', updateCrestWidthDisplay);
            elem.addEventListener('input', updateCrestWidthDisplay);
        }
    });

    // Initial update
    updateCrestWidthDisplay();

    // Function to update calculated toe width displays
    function updateToeWidthDisplay() {
        const armourDn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);
        const toeRatio = parseInt(document.getElementById('toeWeightRatio')?.value || 10);
        const multiplier = parseInt(document.getElementById('toeWidthMultiplier')?.value || 4);

        // Calculate toe stone size from weight ratio
        const Dn50_toe = armourDn50 / Math.pow(toeRatio, 1 / 3);
        const toeWidth = multiplier * Dn50_toe;

        const leftDisplay = document.getElementById('toeLeftWidthDisplay');
        const rightDisplay = document.getElementById('toeRightWidthDisplay');

        if (leftDisplay) leftDisplay.value = toeWidth.toFixed(2);
        if (rightDisplay) rightDisplay.value = toeWidth.toFixed(2);
    }

    // Function to update calculated layer Dn50 displays
    function updateLayerDn50Displays() {
        const armourDn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);

        // Get weight ratios
        const filterRatio = parseInt(document.getElementById('filterWeightRatio')?.value || 10);
        const toeRatio = parseInt(document.getElementById('toeWeightRatio')?.value || 10);
        const coreRatio = parseInt(document.getElementById('coreWeightRatio')?.value || 200);

        // Calculate Dn50 for each layer: Dn50_layer = Dn50_armour / ratio^(1/3)
        const filterDn50 = armourDn50 / Math.pow(filterRatio, 1 / 3);
        const toeDn50 = armourDn50 / Math.pow(toeRatio, 1 / 3);
        const coreDn50 = armourDn50 / Math.pow(coreRatio, 1 / 3);

        // Update displays
        const filterDisplay = document.getElementById('filterDn50Display');
        const toeDisplay = document.getElementById('toeDn50Display');
        const coreDisplay = document.getElementById('coreDn50Display');

        if (filterDisplay) filterDisplay.value = filterDn50.toFixed(3);
        if (toeDisplay) toeDisplay.value = toeDn50.toFixed(3);
        if (coreDisplay) coreDisplay.value = coreDn50.toFixed(3);

        // Also update toe width since it depends on toe Dn50
        updateToeWidthDisplay();
    }

    // Add listeners to update layer Dn50 when dependencies change
    const layerDn50Deps = ['armourDn50', 'filterWeightRatio', 'toeWeightRatio', 'coreWeightRatio'];
    layerDn50Deps.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('change', updateLayerDn50Displays);
            elem.addEventListener('input', updateLayerDn50Displays);
        }
    });

    // Add listener for toe width multiplier
    const toeWidthMultElem = document.getElementById('toeWidthMultiplier');
    if (toeWidthMultElem) {
        toeWidthMultElem.addEventListener('change', updateToeWidthDisplay);
    }

    // Initial updates
    updateLayerDn50Displays();

    // Redraw canvas with new template (if canvas is available)
    if (typeof drawStructureOnCanvas === 'function') {
        drawStructureOnCanvas(templateName);
    }
}

// ==========================================
// DASHBOARD - RECENT PROJECTS
// ==========================================
function loadRecentProjects() {
    const recentProjectsGrid = document.getElementById('recentProjectsGrid');
    if (!recentProjectsGrid) return;

    // Get structures from library (using the library module if available)
    let structures = [];

    if (typeof StructureLibrary !== 'undefined' && typeof StructureLibrary.getAllStructures === 'function') {
        structures = StructureLibrary.getAllStructures();
    }

    // Ensure structures is an array before sorting
    if (!Array.isArray(structures)) {
        structures = [];
    }

    // Sort by date modified (most recent first) and take top 3
    const recentStructures = structures
        .sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
        .slice(0, 3);

    // Clear the grid
    recentProjectsGrid.innerHTML = '';

    if (recentStructures.length === 0) {
        // Show empty state
        recentProjectsGrid.innerHTML = `
            <div class="empty-library-state">
                <div class="empty-icon">📚</div>
                <h3>No Projects Yet</h3>
                <p>Start designing coastal structures and save them to your library</p>
                <button class="btn-primary" data-navigate="designer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Create Your First Project
                </button>
            </div>
        `;
    } else {
        // Display recent projects
        recentStructures.forEach(structure => {
            const projectCard = createProjectCard(structure);
            recentProjectsGrid.appendChild(projectCard);
        });
    }
}

function createProjectCard(structure) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.structureId = structure.id;

    // Format date
    const date = new Date(structure.dateModified);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Get type label
    const typeLabels = {
        'rubble-standard': 'Rubble Mound',
        'rubble-berm': 'Berm Breakwater',
        'rubble-reef': 'Reef',
        'rubble-low': 'Low-Crested',
        'vertical-wall': 'Vertical Wall',
        'vertical-composite': 'Composite',
        'vertical-caisson': 'Caisson',
        'vertical-perforated': 'Perforated',
        'custom': 'Custom'
    };

    const typeLabel = typeLabels[structure.type] || structure.type;

    card.innerHTML = `
        <div class="project-header">
            <span class="project-type-badge">${typeLabel}</span>
        </div>
        <h3>${structure.name || 'Untitled Structure'}</h3>
        <div class="project-meta">
            <div class="project-meta-item">
                <span>📅</span>
                <span>${formattedDate}</span>
            </div>
            ${structure.projectName ? `
                <div class="project-meta-item">
                    <span>📁</span>
                    <span>${structure.projectName}</span>
                </div>
            ` : ''}
        </div>
        ${structure.description ? `
            <p class="project-description">${structure.description}</p>
        ` : `
            <p class="project-description">Coastal structure design saved on ${formattedDate}</p>
        `}
        ${structure.tags && structure.tags.length > 0 ? `
            <div class="project-tags">
                ${structure.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
            </div>
        ` : ''}
    `;

    // Add click handler to load the structure
    card.addEventListener('click', () => {
        if (typeof loadStructureFromLibrary === 'function') {
            loadStructureFromLibrary(structure.id);
        }
        navigateToPage('designer');
    });

    return card;
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
window.AppState = AppState;
window.navigateToPage = navigateToPage;
window.updateUnitsDisplay = updateUnitsDisplay;
window.loadRecentProjects = loadRecentProjects;
