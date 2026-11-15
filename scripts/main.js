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
// SECURITY & DESIGN INPUT HELPERS
// ==========================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getDesignInput(key) {
    if (typeof document === 'undefined' || !key) return null;
    return (
        document.getElementById(`design_${key}`) ||
        document.querySelector(`#parameterInputs [data-param-id="${key}"]`)
    );
}

function getDesignValue(key, fallback = 0) {
    const el = getDesignInput(key);
    if (!el) return fallback;

    if (el.type === 'checkbox') {
        return Boolean(el.checked);
    }

    if (el.tagName === 'SELECT') {
        const raw = el.value;
        if (el.dataset.valueType === 'string') return raw;
        if (raw !== '' && !Number.isNaN(Number(raw)) && Number.isFinite(Number(raw))) {
            return Number(raw);
        }
        return raw;
    }

    if (el.dataset.siValue !== undefined && el.dataset.siValue !== '') {
        const cached = parseFloat(el.dataset.siValue);
        if (Number.isFinite(cached)) return cached;
    }

    const raw = parseFloat(el.value);
    if (!Number.isFinite(raw)) return fallback;

    const unitType = el.dataset.unitType || 'dimensionless';
    return UnitConverter.toSI(raw, unitType, AppState.unitSystem);
}

function readSIInput(id, fallback = 0) {
    if (typeof document === 'undefined' || !id) return fallback;
    const el = document.getElementById(id);
    if (!el) return fallback;

    if (el.dataset.siValue !== undefined && el.dataset.siValue !== '') {
        const cached = parseFloat(el.dataset.siValue);
        if (Number.isFinite(cached)) return cached;
    }

    const raw = parseFloat(el.value);
    if (!Number.isFinite(raw)) return fallback;

    const unitType = el.dataset.unitType || 'dimensionless';
    return UnitConverter.toSI(raw, unitType, AppState.unitSystem);
}

function _mapUnitToType(unit) {
    switch (unit) {
        case 'm': return 'length';
        case 'cm': return 'length_cm';
        case 'm/s': return 'speed';
        case 'kg/m³': return 'density';
        case 'l/s/m': return 'discharge';
        case '°': return 'angle';
        case 's': return 'time';
        case '%': return 'percent';
        default: return 'dimensionless';
    }
}

function _formatConvertedNumber(val) {
    if (!Number.isFinite(val)) return '';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs < 0.1) return String(parseFloat(val.toFixed(4)));
    if (abs < 1) return String(parseFloat(val.toFixed(3)));
    return String(parseFloat(val.toFixed(2)));
}

// ==========================================
// PAGE NAVIGATION
// ==========================================
const PageRouteAliases = {
    'designer-rubble': { page: 'designer', template: 'rubble-standard' },
    'designer-vertical': { page: 'designer', template: 'vertical-wall' }
};

function navigateToPage(pageName) {
    if (typeof document === 'undefined') return false;

    const alias = PageRouteAliases[pageName];
    const resolvedPage = alias ? alias.page : pageName;
    const targetPage = document.getElementById(resolvedPage);
    if (!targetPage) {
        console.warn(`navigateToPage: Unknown page '${pageName}'`);
        return false;
    }

    // Update navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === resolvedPage) {
            link.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    targetPage.classList.add('active');
    AppState.currentPage = resolvedPage;

    if (resolvedPage === 'designer') {
        const parameterPanel = document.querySelector('.design-parameters');
        if (parameterPanel) {
            parameterPanel.style.display = 'block';
        }

        const templateToLoad = alias ? alias.template : null;
        if (templateToLoad) {
            AppState.selectedTemplate = templateToLoad;
            loadTemplate(templateToLoad);
        } else {
            const parameterInputs = document.getElementById('parameterInputs');
            if (parameterInputs && parameterInputs.children.length === 0) {
                loadTemplate(AppState.selectedTemplate || 'rubble-standard');
            } else {
                const templateSelect = document.getElementById('structureTemplateSelect');
                if (templateSelect && AppState.selectedTemplate) {
                    templateSelect.value = AppState.selectedTemplate;
                }
            }
        }

        setTimeout(() => {
            if (typeof initCanvas === 'function') {
                initCanvas();
            }
            if (typeof drawStructureOnCanvas === 'function') {
                drawStructureOnCanvas(AppState.selectedTemplate);
            }
        }, 50);
    }

    return true;
}

// ==========================================
// UNIT CONVERSION
// ==========================================
const UnitConverter = {
    definitions: {
        length: { metricLabel: 'm', imperialLabel: 'ft', toImperialFactor: 3.280839895 },
        length_cm: { metricLabel: 'cm', imperialLabel: 'in', toImperialFactor: 0.3937007874 },
        speed: { metricLabel: 'm/s', imperialLabel: 'mph', toImperialFactor: 2.2369362921 },
        density: { metricLabel: 'kg/m³', imperialLabel: 'lb/ft³', toImperialFactor: 0.0624279606 },
        discharge: { metricLabel: 'l/s/m', imperialLabel: 'ft³/s/ft', toImperialFactor: 0.0107639104 },
        volume_per_m: { metricLabel: 'm³/m', imperialLabel: 'ft³/ft', toImperialFactor: 10.7639104 },
        angle: { metricLabel: '°', imperialLabel: '°', toImperialFactor: 1 },
        time: { metricLabel: 's', imperialLabel: 's', toImperialFactor: 1 },
        percent: { metricLabel: '%', imperialLabel: '%', toImperialFactor: 1 },
        dimensionless: { metricLabel: '', imperialLabel: '', toImperialFactor: 1 }
    },

    toSI(value, unitType = 'dimensionless', system = AppState.unitSystem) {
        if (!Number.isFinite(value)) return NaN;
        if (system !== 'imperial') return value;
        const def = this.definitions[unitType];
        if (!def || def.toImperialFactor === 1) return value;
        return value / def.toImperialFactor;
    },

    fromSI(value, unitType = 'dimensionless', system = AppState.unitSystem) {
        if (!Number.isFinite(value)) return NaN;
        if (system !== 'imperial') return value;
        const def = this.definitions[unitType];
        if (!def || def.toImperialFactor === 1) return value;
        return value * def.toImperialFactor;
    },

    getUnitLabel(unitType = 'dimensionless', system = AppState.unitSystem) {
        const def = this.definitions[unitType];
        if (!def) return '';
        return system === 'imperial' ? def.imperialLabel : def.metricLabel;
    },

    convertAllInputs(fromSystem, toSystem) {
        if (typeof document === 'undefined' || fromSystem === toSystem) return;
        document.querySelectorAll('input[type="number"][data-unit-type]').forEach(input => {
            const unitType = input.dataset.unitType || 'dimensionless';
            const def = this.definitions[unitType];
            if (!def || def.toImperialFactor === 1) return;

            let siVal;
            if (input.dataset.siValue !== undefined && input.dataset.siValue !== '') {
                siVal = parseFloat(input.dataset.siValue);
            } else {
                const raw = parseFloat(input.value);
                if (!Number.isFinite(raw)) return;
                siVal = this.toSI(raw, unitType, fromSystem);
            }

            if (!Number.isFinite(siVal)) return;
            input.dataset.siValue = String(siVal);

            if (toSystem === 'metric') {
                input.value = String(parseFloat(siVal.toFixed(6)));
            } else {
                input.value = _formatConvertedNumber(this.fromSI(siVal, unitType, toSystem));
            }
        });
    }
};

function convertUnit(value, fromSystem, toSystem, type = 'length') {
    if (!Number.isFinite(value) || fromSystem === toSystem) return value;
    const siVal = UnitConverter.toSI(value, type, fromSystem);
    return UnitConverter.fromSI(siVal, type, toSystem);
}

function updateUnitsDisplay() {
    if (typeof document === 'undefined') return;
    const system = AppState.unitSystem;
    const unitIndicator = document.querySelector('.unit-indicator');

    if (unitIndicator) {
        unitIndicator.textContent = system === 'metric' ? 'Metric' : 'Imperial';
    }

    document.querySelectorAll('.unit[data-unit-type]').forEach(el => {
        const type = el.dataset.unitType || 'dimensionless';
        el.textContent = UnitConverter.getUnitLabel(type, system);
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
    { id: 'offshoreDepth', key: 'offshoreDepth' },
    { id: 'toeDepthWave', key: 'toeDepth' },
    { id: 'msl', key: 'msl' },
    { id: 'tidalRange', key: 'tidalRange' },
    { id: 'slr', key: 'slr' },

    // Serviceability Page
    { id: 'freeboard', key: 'freeboard' },
    { id: 'slopeAngle', key: 'slopeAngle' },
    { id: 'crestWidth', key: 'crestWidth' },
    { id: 'waveHeight', key: 'waveHeight' },
    { id: 'wavePeriod', key: 'wavePeriod' },
    { id: 'toeDepth', key: 'toeDepth' }
];


function initializeParameterBindings() {
    if (!window.GlobalParams || typeof document === 'undefined') return;

    // 1. Track manual edits so cached SI values never become stale
    document.querySelectorAll('input[type="number"]').forEach(input => {
        if (!input.dataset.siClearedListener) {
            input.addEventListener('input', () => {
                delete input.dataset.siValue;
            });
            input.dataset.siClearedListener = 'true';
        }
    });

    // 2. Seed globals from actual DOM input values without overwriting HTML defaults
    ParameterBindings.forEach(binding => {
        const input = document.getElementById(binding.id);
        if (!input) return;

        // Bind listeners and visual marker without clobbering existing HTML input values
        bindInputToGlobal(input, binding.key, false);

        if (window.GlobalParams.getEffectiveValue(null, binding.key) === null) {
            const val = readSIInput(binding.id, NaN);
            if (Number.isFinite(val)) {
                window.GlobalParams.setGlobal(binding.key, val, 'init');
            }
        }
    });

    // 3. Subscribe to subsequent changes to synchronize bound static & dynamic UI inputs
    window.GlobalParams.subscribe((key, type, value) => {
        if (type === 'global' && !Number.isFinite(value)) return;
        const effectiveValue = (type === 'global' || type === 'import')
            ? window.GlobalParams.getEffectiveValue(null, key)
            : value;
        if (!Number.isFinite(effectiveValue)) return;

        // Synchronize static bound inputs (skip currently focused field)
        ParameterBindings.filter(b => b.key === key).forEach(binding => {
            const input = document.getElementById(binding.id);
            if (input && document.activeElement !== input) {
                const unitType = input.dataset.unitType || 'dimensionless';
                input.dataset.siValue = String(effectiveValue);
                input.value = AppState.unitSystem === 'imperial'
                    ? _formatConvertedNumber(UnitConverter.fromSI(effectiveValue, unitType, 'imperial'))
                    : String(parseFloat(effectiveValue.toFixed(6)));
            }
        });

        // Synchronize dynamic Designer inputs matching this global key
        document.querySelectorAll(`[data-global-key="${key}"]`).forEach(input => {
            if (document.activeElement !== input && input.closest('#parameterInputs')) {
                const unitType = input.dataset.unitType || 'dimensionless';
                input.dataset.siValue = String(effectiveValue);
                input.value = AppState.unitSystem === 'imperial'
                    ? _formatConvertedNumber(UnitConverter.fromSI(effectiveValue, unitType, 'imperial'))
                    : String(parseFloat(effectiveValue.toFixed(6)));
            }
        });
    });
}

function bindInputToGlobal(input, key, overwriteFromGlobal = false) {
    if (!input || !window.GlobalParams) return;

    if (overwriteFromGlobal) {
        const globalValue = window.GlobalParams.getEffectiveValue(null, key);
        if (globalValue !== null && globalValue !== undefined && Number.isFinite(Number(globalValue))) {
            const unitType = input.dataset.unitType || 'dimensionless';
            input.dataset.siValue = String(globalValue);
            input.value = AppState.unitSystem === 'imperial'
                ? _formatConvertedNumber(UnitConverter.fromSI(Number(globalValue), unitType, 'imperial'))
                : String(parseFloat(Number(globalValue).toFixed(6)));
        }
    }

    if (!input.dataset.globalBoundListener) {
        input.addEventListener('input', () => {
            delete input.dataset.siValue;
        });
        input.addEventListener('change', (e) => {
            delete input.dataset.siValue;
            const raw = parseFloat(e.target.value);
            if (!Number.isNaN(raw)) {
                const unitType = e.target.dataset.unitType || 'dimensionless';
                const siVal = UnitConverter.toSI(raw, unitType, AppState.unitSystem);
                window.GlobalParams.setGlobal(key, siVal, 'user-input');
            }
        });
        input.dataset.globalBoundListener = 'true';
    }

    input.dataset.globalKey = key;

    const wrapper = input.parentElement;
    if (wrapper && wrapper.classList.contains('input-with-unit')) {
        wrapper.classList.add('global-param');

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

        rangeInput.disabled = true;
        rangeInput.title = `Fixed value for ${selector.options[selector.selectedIndex].text}`;

        const rangeSI = stations[station];
        if (rangeSI) {
            rangeInput.dataset.siValue = String(rangeSI);
            rangeInput.value = AppState.unitSystem === 'imperial'
                ? _formatConvertedNumber(UnitConverter.fromSI(rangeSI, 'length', 'imperial'))
                : String(rangeSI);
            if (window.GlobalParams) {
                window.GlobalParams.setGlobal('tidalRange', rangeSI, 'user-input');
            }

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
    updateStationState();
}

// ==========================================
// INITIALIZATION
// ==========================================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('CoastalEngineer Pro - Initializing...');

        initializeParameterBindings();
        initializeTideStationLogic();

        // Navigation event listeners
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    navigateToPage(page);
                }
            });
        });

        // Dashboard Project Wizard button
        const startWizardBtn = document.getElementById('startProjectWizardBtn');
        if (startWizardBtn) {
            startWizardBtn.addEventListener('click', () => {
                launchProjectWizard();
            });
        }

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

        // Unit system radio buttons with real value conversion
        document.querySelectorAll('input[name="unitSystem"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const prevSystem = AppState.unitSystem;
                const nextSystem = e.target.value;
                AppState.unitSystem = nextSystem;
                UnitConverter.convertAllInputs(prevSystem, nextSystem);
                updateUnitsDisplay();
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(AppState.selectedTemplate);
                }
                closeModal('unitModal');
            });
        });

        // Template selection buttons (if any exist)
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
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

                parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

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

                    const parameterPanel = document.querySelector('.design-parameters');
                    if (parameterPanel) {
                        parameterPanel.style.display = 'block';
                    }
                }
            });
        }

        // Keep designer parameters visible for default template
        const parameterPanel = document.querySelector('.design-parameters');
        if (parameterPanel) {
            parameterPanel.style.display = 'block';
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
        if (resetView) {
            resetView.addEventListener('click', () => {
                if (typeof resetCanvasView === 'function') {
                    resetCanvasView();
                } else if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(AppState.selectedTemplate);
                }
            });
        }

        // Save to Library button
        const saveToLibrary = document.getElementById('saveToLibrary');
        if (saveToLibrary) {
            saveToLibrary.addEventListener('click', () => {
                if (typeof saveCurrentStructureToLibrary === 'function') {
                    saveCurrentStructureToLibrary();
                }
            });
        }

        // Delegated navigation for all elements with [data-navigate]
        document.addEventListener('click', (e) => {
            const navButton = e.target.closest('[data-navigate]');
            if (navButton) {
                const page = navButton.dataset.navigate;
                if (page) {
                    navigateToPage(page);
                }
            }
        });

        // Load recent saved structures on dashboard
        loadRecentProjects();

        // Initialize default template visibly
        loadTemplate('rubble-standard');
        updateUnitsDisplay();

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
}

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
function _getArmourSelectOptions() {
    const types = (typeof ArmourTypes !== 'undefined' && ArmourTypes)
        ? ArmourTypes
        : (typeof window !== 'undefined' ? window.ArmourTypes : null);
    if (types) {
        return Object.keys(types).map(k => ({ value: k, label: types[k].name }));
    }
    return [{ value: 'rock_angular', label: 'Default Rock' }];
}

function getTemplateParameters(templateName) {
    const armourOptions = _getArmourSelectOptions();
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

        case 'rubble-reef':
            // Submerged / Reef Breakwater (d'Angremond wave transmission & Hudson stability)
            parameters = [
                { type: 'group', label: 'General Structure' },
                { label: 'Crest Freeboard (Rc, - if submerged)', unit: 'm', id: 'crestHeight', value: -0.5, step: 0.1, tooltipKey: 'crest-elevation' },
                { label: 'Crest Width (B)', unit: 'm', id: 'crestWidth', value: 8.0, tooltipKey: 'crest-width' },
                { label: 'Seaward Slope (cotα)', id: 'slopeLeft', value: 2.0, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Leeward Slope (cotα)', id: 'slopeRight', value: 2.0, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 4.0, tooltipKey: 'water-depth' },

                { type: 'group', label: 'Armour Layer' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.0, tooltipKey: 'armour-dn50' },
                { label: 'Material Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 3.5, tooltipKey: 'stability-coefficient' },
                { label: 'Porosity (n)', id: 'matPorosity', value: 0.40, tooltipKey: 'porosity' },

                { type: 'group', label: 'Wave Parameters' },
                { label: 'Design Wave Height (Hs)', unit: 'm', id: 'waveHeight', value: 2.5, tooltipKey: 'wave-height' },
                { label: 'Wave Period (Tp)', unit: 's', id: 'wavePeriod', value: 8.0, tooltipKey: 'wave-period' }
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

        case 'custom':
            // Flexible Custom Coastal Structure
            parameters = [
                { type: 'group', label: 'Custom Structure Type' },
                {
                    label: 'Structural Behavior Family',
                    id: 'structureFamily',
                    value: 'rubble',
                    type: 'select',
                    options: [
                        { value: 'rubble', label: 'Rubble Mound Section' },
                        { value: 'vertical', label: 'Vertical Wall / Gravity Structure' }
                    ]
                },
                { label: 'Water Depth at Toe (d)', unit: 'm', id: 'depth', value: 5.0, tooltipKey: 'water-depth' },

                { type: 'group', label: 'Geometry' },
                { label: 'Crest Freeboard / Elevation (Rc)', unit: 'm', id: 'crestHeight', value: 3.5, tooltipKey: 'crest-elevation' },
                { label: 'Crest Width (B)', unit: 'm', id: 'crestWidth', value: 5.0, tooltipKey: 'crest-width' },
                { label: 'Seaward Slope (cotα)', id: 'slopeLeft', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Leeward Slope (cotα)', id: 'slopeRight', value: 1.5, step: 0.1, tooltipKey: 'structure-slope' },
                { label: 'Wall Height (hc, if vertical)', unit: 'm', id: 'wallHeight', value: 8.0, tooltipKey: 'wall-height' },
                { label: 'Wall Thickness / Width (t)', unit: 'm', id: 'wallThickness', value: 2.5, tooltipKey: 'wall-thickness' },
                { label: 'Foundation Width (Bf)', unit: 'm', id: 'foundationWidth', value: 8.0, tooltipKey: 'foundation-width' },

                { type: 'group', label: 'Material Properties' },
                { label: 'Armour Type', id: 'armourType', value: 'rock_angular', type: 'select', options: armourOptions },
                { label: 'Armour Stone Dn50', unit: 'm', id: 'armourDn50', value: 1.2, tooltipKey: 'armour-dn50' },
                { label: 'Rock Density (ρs)', unit: 'kg/m³', id: 'matDensity', value: 2650, tooltipKey: 'material-density' },
                { label: 'Stability Coeff (Kd)', id: 'matKd', value: 4.0, tooltipKey: 'stability-coefficient' },
                { label: 'Concrete Density (ρc)', unit: 'kg/m³', id: 'concreteDensity', value: 2400, tooltipKey: 'concrete-density' },
                { label: 'Friction Coefficient (μ)', id: 'frictionCoeff', value: 0.6, step: 0.05, tooltipKey: 'friction-coeff' },

                { type: 'group', label: 'Wave Conditions' },
                { label: 'Design Wave Height (Hs)', unit: 'm', id: 'waveHeight', value: 3.0, tooltipKey: 'wave-height' },
                { label: 'Wave Period (Tp)', unit: 's', id: 'wavePeriod', value: 8.0, tooltipKey: 'wave-period' }
            ];
            break;

        default:
            parameters = [
                { label: 'Structure Height', unit: 'm', id: 'height', value: 5.0 },
                { label: 'Structure Width', unit: 'm', id: 'width', value: 10.0 }
            ];
    }

    return parameters;
}

function loadTemplate(templateName) {
    AppState.selectedTemplate = templateName;

    if (typeof document === 'undefined') {
        return getTemplateParameters(templateName);
    }

    const templateSelect = document.getElementById('structureTemplateSelect');
    if (templateSelect && templateSelect.value !== templateName) {
        templateSelect.value = templateName;
    }

    const parameterPanel = document.querySelector('.design-parameters');
    if (parameterPanel) {
        parameterPanel.style.display = 'block';
    }

    const parameterInputs = document.getElementById('parameterInputs');
    if (!parameterInputs) return [];

    const parameters = getTemplateParameters(templateName);

    // Clear existing inputs
    parameterInputs.innerHTML = '';

    // Create a two-column grid container
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md, 16px);
    `;

    parameters.forEach(param => {
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
            return;
        }

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const domId = `design_${param.id}`;
        const paramType = param.type || 'number';
        const unitType = _mapUnitToType(param.unit);
        const unitLabel = param.unit ? UnitConverter.getUnitLabel(unitType, AppState.unitSystem) : '';
        const stringSelect = ['armourType', 'filterType', 'toeType', 'structureFamily'].includes(param.id);

        let inputHTML = '';
        if (paramType === 'select') {
            const options = param.options || [];
            const optsHTML = options.map(o => {
                const val = typeof o === 'object' ? o.value : o;
                const lab = typeof o === 'object' ? o.label : o;
                const isSelected = val == param.value ? 'selected' : '';
                return `<option value="${escapeHtml(val)}" ${isSelected}>${escapeHtml(lab)}</option>`;
            }).join('');
            inputHTML = `<select id="${domId}" data-param-id="${param.id}" ${stringSelect ? 'data-value-type="string"' : ''} class="form-control">${optsHTML}</select>`;
        } else if (paramType === 'checkbox') {
            inputHTML = `
                <div class="checkbox-wrapper" style="display:flex; align-items:center;">
                    <input type="checkbox" id="${domId}" data-param-id="${param.id}" ${param.value ? 'checked' : ''} style="width:auto; margin-right:10px;">
                    <span style="font-size:0.9em; color:var(--topography-600);">Enable</span>
                </div>`;
        } else {
            const siNum = Number(param.value);
            const displayVal = (AppState.unitSystem === 'imperial' && Number.isFinite(siNum))
                ? _formatConvertedNumber(UnitConverter.fromSI(siNum, unitType, 'imperial'))
                : param.value;
            const siAttr = Number.isFinite(siNum) ? `data-si-value="${siNum}"` : '';

            if (paramType === 'readonly') {
                inputHTML = `
                    <div class="input-with-unit">
                        <input type="number" id="${domId}" data-param-id="${param.id}" data-unit-type="${unitType}" ${siAttr} value="${displayVal}" step="${param.step || 0.1}" readonly style="background-color: var(--md-sys-color-surface-variant); cursor: not-allowed;">
                        <span class="unit" data-unit-type="${unitType}">${unitLabel}</span>
                    </div>`;
            } else {
                const datalistId = param.datalist ? `${domId}-datalist` : '';
                const datalistHTML = param.datalist ? `
                    <datalist id="${datalistId}">
                        ${param.datalist.map(val => `<option value="${val}">1/${val}</option>`).join('')}
                    </datalist>` : '';

                inputHTML = `
                    <div class="input-with-unit">
                        <input type="number" id="${domId}" data-param-id="${param.id}" data-unit-type="${unitType}" ${siAttr} value="${displayVal}" step="${param.step || 0.1}"
                               min="${param.min !== undefined ? param.min : ''}" placeholder="${param.placeholder || ''}"
                               ${datalistId ? `list="${datalistId}"` : ''}>
                        <span class="unit" data-unit-type="${unitType}">${unitLabel}</span>
                    </div>${datalistHTML}`;
            }
        }

        formGroup.innerHTML = `<label for="${domId}" data-tooltip-key="${param.tooltipKey || param.id}">${escapeHtml(param.label)}</label>${inputHTML}`;
        gridContainer.appendChild(formGroup);

        // Attach Tooltip
        const tipSystem = window.tooltipSystem || window.tooltipManager;
        if (tipSystem && typeof tipSystem.addTooltip === 'function') {
            const labelEl = formGroup.querySelector('label');
            const key = param.tooltipKey || param.id;
            if (labelEl) tipSystem.addTooltip(labelEl, key);
        }

        // Bind dynamic depth/waveHeight/wavePeriod to global parameters if present (without clobbering template defaults)
        const ctrl = formGroup.querySelector(`#${domId}`);
        if (ctrl) {
            if (param.id === 'depth') bindInputToGlobal(ctrl, 'toeDepth', false);
            if (param.id === 'waveHeight') bindInputToGlobal(ctrl, 'waveHeight', false);
            if (param.id === 'wavePeriod') bindInputToGlobal(ctrl, 'wavePeriod', false);
        }

        // Specific Logic for Armour Type Change (Auto-update properties in SI & current UI unit)
        if (param.id === 'armourType') {
            const types = (typeof ArmourTypes !== 'undefined' && ArmourTypes) ? ArmourTypes : window.ArmourTypes;
            if (types && ctrl) {
                ctrl.addEventListener('change', (e) => {
                    const type = e.target.value;
                    const data = types[type];
                    if (data && type !== 'user_defined') {
                        const setSIVal = (key, siVal) => {
                            const target = getDesignInput(key);
                            if (!target) return;
                            const uType = target.dataset.unitType || 'dimensionless';
                            target.dataset.siValue = String(siVal);
                            target.value = AppState.unitSystem === 'imperial'
                                ? _formatConvertedNumber(UnitConverter.fromSI(siVal, uType, 'imperial'))
                                : String(siVal);
                        };
                        setSIVal('matDensity', data.rho);
                        setSIVal('matKd', data.kd);
                        setSIVal('matPorosity', data.porosity);
                    }
                });
            }
        }

        // Redraw canvas & clear stale cached SI value on manual input
        if (ctrl) {
            ctrl.addEventListener('input', () => {
                delete ctrl.dataset.siValue;
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(templateName);
                }
            });
            ctrl.addEventListener('change', () => {
                if (ctrl.type === 'number') {
                    delete ctrl.dataset.siValue;
                }
                if (typeof drawStructureOnCanvas === 'function') {
                    drawStructureOnCanvas(templateName);
                }
            });
        }
    });

    parameterInputs.appendChild(gridContainer);

    const _setDisplaySI = (key, siVal, decimals = 2) => {
        const displayInput = getDesignInput(key);
        if (!displayInput) return;
        const unitType = displayInput.dataset.unitType || 'length';
        displayInput.dataset.siValue = String(siVal);
        const uiVal = UnitConverter.fromSI(siVal, unitType, AppState.unitSystem);
        displayInput.value = uiVal.toFixed(decimals);
    };

    function updateCrestWidthDisplay() {
        const multiplier = getDesignValue('crestWidthMultiplier', 3);
        const Dn50 = getDesignValue('armourDn50', 1.2);
        const crestWidth = multiplier * Dn50;
        _setDisplaySI('crestWidthDisplay', crestWidth, 2);
    }

    ['crestWidthMultiplier', 'armourDn50'].forEach(key => {
        const elem = getDesignInput(key);
        if (elem) {
            elem.addEventListener('change', updateCrestWidthDisplay);
            elem.addEventListener('input', updateCrestWidthDisplay);
        }
    });
    updateCrestWidthDisplay();

    function updateToeWidthDisplay() {
        const armourDn50 = getDesignValue('armourDn50', 1.2);
        const toeRatio = getDesignValue('toeWeightRatio', 10);
        const multiplier = getDesignValue('toeWidthMultiplier', 4);
        const Dn50_toe = armourDn50 / Math.pow(Math.max(1, toeRatio), 1 / 3);
        const toeWidth = multiplier * Dn50_toe;

        _setDisplaySI('toeLeftWidthDisplay', toeWidth, 2);
        _setDisplaySI('toeRightWidthDisplay', toeWidth, 2);
        _setDisplaySI('toeWidthDisplay', toeWidth, 2);
    }

    function updateLayerDn50Displays() {
        const armourDn50 = getDesignValue('armourDn50', 1.2);
        const filterRatio = getDesignValue('filterWeightRatio', 10);
        const toeRatio = getDesignValue('toeWeightRatio', 10);
        const coreRatio = getDesignValue('coreWeightRatio', 200);

        const filterDn50 = armourDn50 / Math.pow(Math.max(1, filterRatio), 1 / 3);
        const toeDn50 = armourDn50 / Math.pow(Math.max(1, toeRatio), 1 / 3);
        const coreDn50 = armourDn50 / Math.pow(Math.max(1, coreRatio), 1 / 3);

        _setDisplaySI('filterDn50Display', filterDn50, 3);
        _setDisplaySI('toeDn50Display', toeDn50, 3);
        _setDisplaySI('coreDn50Display', coreDn50, 3);

        updateToeWidthDisplay();
    }

    ['armourDn50', 'filterWeightRatio', 'toeWeightRatio', 'coreWeightRatio'].forEach(key => {
        const elem = getDesignInput(key);
        if (elem) {
            elem.addEventListener('change', updateLayerDn50Displays);
            elem.addEventListener('input', updateLayerDn50Displays);
        }
    });

    const toeWidthMultElem = getDesignInput('toeWidthMultiplier');
    if (toeWidthMultElem) {
        toeWidthMultElem.addEventListener('change', updateToeWidthDisplay);
    }

    updateLayerDn50Displays();

    if (typeof drawStructureOnCanvas === 'function') {
        drawStructureOnCanvas(templateName);
    }

    return parameters;
}

// ==========================================
// DASHBOARD - RECENT SAVED STRUCTURES
// ==========================================
async function loadRecentProjects() {
    const recentProjectsGrid = document.getElementById('recentProjectsGrid');
    if (!recentProjectsGrid) return;

    let structures = [];
    try {
        if (typeof StructureLibrary !== 'undefined' && typeof StructureLibrary.getAllStructures === 'function') {
            const loaded = await StructureLibrary.getAllStructures();
            if (Array.isArray(loaded)) {
                structures = loaded;
            }
        }
    } catch (err) {
        console.warn('Could not load recent structures:', err);
    }

    const recentStructures = structures
        .slice()
        .sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
        .slice(0, 3);

    recentProjectsGrid.innerHTML = '';

    if (recentStructures.length === 0) {
        recentProjectsGrid.innerHTML = `
            <div class="empty-library-state">
                <div class="empty-icon">📚</div>
                <h3>No Saved Structures Yet</h3>
                <p>Start designing coastal structures and save them to your library</p>
                <button class="btn-primary" data-navigate="designer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Open Structure Designer
                </button>
            </div>
        `;
    } else {
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

    const date = new Date(structure.dateModified);
    const formattedDate = Number.isNaN(date.getTime())
        ? 'Recent'
        : date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

    const typeLabels = {
        'rubble-standard': 'Rubble Mound',
        'rubble-bullnose': 'Rubble Mound (Bullnose)',
        'rubble-berm': 'Berm Breakwater',
        'rubble-reef': 'Reef Breakwater',
        'rubble-low': 'Low-Crested',
        'rubble-revetment': 'Revetment',
        'vertical-wall': 'Vertical Wall',
        'vertical-composite': 'Composite',
        'vertical-caisson': 'Caisson',
        'vertical-perforated': 'Perforated',
        'custom': 'Custom'
    };

    const typeLabel = typeLabels[structure.type] || structure.type || 'Structure';

    card.innerHTML = `
        <div class="project-header">
            <span class="project-type-badge">${escapeHtml(typeLabel)}</span>
        </div>
        <h3>${escapeHtml(structure.name || 'Untitled Structure')}</h3>
        <div class="project-meta">
            <div class="project-meta-item">
                <span>📅</span>
                <span>${escapeHtml(formattedDate)}</span>
            </div>
            ${structure.projectName ? `
                <div class="project-meta-item">
                    <span>📁</span>
                    <span>${escapeHtml(structure.projectName)}</span>
                </div>
            ` : ''}
        </div>
        ${structure.description ? `
            <p class="project-description">${escapeHtml(structure.description)}</p>
        ` : `
            <p class="project-description">Coastal structure design saved on ${escapeHtml(formattedDate)}</p>
        `}
        ${Array.isArray(structure.tags) && structure.tags.length > 0 ? `
            <div class="project-tags">
                ${structure.tags.map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : ''}
    `;

    card.addEventListener('click', () => {
        if (typeof loadStructureForEditing === 'function') {
            loadStructureForEditing(structure.id);
        } else if (typeof loadStructureFromLibrary === 'function') {
            loadStructureFromLibrary(structure.id);
        } else {
            navigateToPage('designer');
        }
    });

    return card;
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================
if (typeof window !== 'undefined') {
    window.AppState = AppState;
    window.UnitConverter = UnitConverter;
    window.convertUnit = convertUnit;
    window.escapeHtml = escapeHtml;
    window.getDesignInput = getDesignInput;
    window.getDesignValue = getDesignValue;
    window.readSIInput = readSIInput;
    window.getTemplateParameters = getTemplateParameters;
    window.navigateToPage = navigateToPage;
    window.loadTemplate = loadTemplate;
    window.updateUnitsDisplay = updateUnitsDisplay;
    window.loadRecentProjects = loadRecentProjects;
    window.openModal = openModal;
    window.closeModal = closeModal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        UnitConverter,
        convertUnit,
        escapeHtml,
        getDesignInput,
        getDesignValue,
        readSIInput,
        getTemplateParameters,
        navigateToPage,
        loadTemplate
    };
}
