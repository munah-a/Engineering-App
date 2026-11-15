// ==========================================
// PROJECT CREATION WIZARD
// Step-by-step guided workflow for creating projects
// ==========================================

const _escWizardHtml = (val) => {
    if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
        return window.escapeHtml(val);
    }
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

class ProjectWizard {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            'project-info',
            'wave-analysis',
            'structure-design',
            'serviceability',
            'review'
        ];
        this.projectData = {
            structures: [],
            structureAnalyses: {}
        };
        this.currentStructureIndex = 0;
    }

    // ==========================================
    // WIZARD CONTROL
    // ==========================================

    start(projectData = {}) {
        this.projectData = {
            ...projectData,
            structures: projectData.structures || [],
            structureAnalyses: projectData.structureAnalyses || {}
        };
        this.currentStep = 0;
        this.currentStructureIndex = 0;

        const nextBtn = document.getElementById('wizardNextBtn');
        const prevBtn = document.getElementById('wizardPrevBtn');
        const closeBtn = document.getElementById('closeWizardModal');
        if (nextBtn) nextBtn.onclick = () => this.nextStep();
        if (prevBtn) prevBtn.onclick = () => this.previousStep();
        if (closeBtn) closeBtn.onclick = () => this.hideWizardModal();

        this.showWizardModal();
        this.renderStep();
    }

    showWizardModal() {
        const modal = document.getElementById('projectWizardModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideWizardModal() {
        const modal = document.getElementById('projectWizardModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.saveCurrentStepData();

            if (this.currentStep === 3) {
                const addAnotherCheckbox = document.getElementById('wizardAddAnotherStructure');
                if (addAnotherCheckbox && addAnotherCheckbox.checked) {
                    this.currentStructureIndex++;
                    this.currentStep = 2;
                    this.renderStep();
                    return;
                }
            }

            if (this.currentStep < this.steps.length - 1) {
                this.currentStep++;
                this.renderStep();
            } else {
                this.finish();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    }

    async finish() {
        await this.saveProject();
        this.hideWizardModal();

        if (window.StructureLibrary?.showNotification) {
            window.StructureLibrary.showNotification(
                `Project "${this.projectData.name}" created with ${this.projectData.structures.length} structure(s)!`,
                'success'
            );
        }

        if (window.projectUI) {
            await window.projectUI.refreshProjectList();
        }
    }

    // ==========================================
    // STEP RENDERING
    // ==========================================

    renderStep() {
        const container = document.getElementById('wizardStepContent');
        if (!container) return;

        const stepName = this.steps[this.currentStep];

        // Update progress indicator
        this.updateProgress();

        // Render step content
        switch (stepName) {
            case 'project-info':
                this.renderProjectInfoStep(container);
                break;
            case 'wave-analysis':
                this.renderWaveAnalysisStep(container);
                break;
            case 'structure-design':
                this.renderStructureDesignStep(container);
                break;
            case 'serviceability':
                this.renderServiceabilityStep(container);
                break;
            case 'review':
                this.renderReviewStep(container);
                break;
        }

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    updateProgress() {
        const progressBar = document.getElementById('wizardProgress');
        const progressText = document.getElementById('wizardProgressText');

        if (progressBar) {
            const progress = ((this.currentStep + 1) / this.steps.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('wizardPrevBtn');
        const nextBtn = document.getElementById('wizardNextBtn');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
        }

        if (nextBtn) {
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.textContent = 'Finish & Create Project';
                nextBtn.className = 'btn-primary btn-large';
            } else {
                nextBtn.textContent = 'Next →';
                nextBtn.className = 'btn-primary';
            }
        }
    }

    // ==========================================
    // STEP 1: PROJECT INFO
    // ==========================================

    renderProjectInfoStep(container) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Project Information</h2>
                <p class="step-description">Enter basic information about your coastal engineering project</p>

                <div class="form-group">
                    <label>Project Name *</label>
                    <input type="text" id="wizardProjectName" class="form-input"
                           value="${_escWizardHtml(this.projectData.name || '')}"
                           placeholder="e.g., Marina Breakwater Design">
                </div>

                <div class="form-group">
                    <label>Project Description</label>
                    <textarea id="wizardProjectDesc" class="form-input" rows="3"
                              placeholder="Brief description of the project...">${_escWizardHtml(this.projectData.description || '')}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Client</label>
                        <input type="text" id="wizardClient" class="form-input"
                               value="${_escWizardHtml(this.projectData.client || '')}"
                               placeholder="Client name">
                    </div>

                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="wizardLocation" class="form-input"
                               value="${_escWizardHtml(this.projectData.location || '')}"
                               placeholder="Project location">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Engineer Name</label>
                        <input type="text" id="wizardEngineer" class="form-input"
                               value="${_escWizardHtml(this.projectData.engineerName || '')}"
                               placeholder="Your name">
                    </div>

                    <div class="form-group">
                        <label>Company</label>
                        <input type="text" id="wizardCompany" class="form-input"
                               value="${_escWizardHtml(this.projectData.companyName || '')}"
                               placeholder="Company name">
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // STEP 2: WAVE ANALYSIS
    // ==========================================

    renderWaveAnalysisStep(container) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Wave Analysis</h2>
                <p class="step-description">Configure wave conditions that will be used for all structures in this project</p>
                
                <div class="info-box">
                    <strong>Note:</strong> This wave analysis will be shared across all structures you add to this project.
                </div>
                
                <div id="wizardWaveAnalysisContent">
                    <!-- Wave analysis form will be injected here -->
                </div>
                
                <button class="btn-secondary" id="runWaveAnalysis" style="margin-top: 20px;">
                    Calculate Wave Conditions
                </button>
                
                <div id="wizardWaveResults" style="margin-top: 20px;"></div>
            </div>
        `;

        // Inject wave analysis inputs
        this.injectWaveAnalysisInputs();

        // Attach calculate button
        document.getElementById('runWaveAnalysis').addEventListener('click', () => {
            this.calculateWaveAnalysis();
        });
    }

    injectWaveAnalysisInputs() {
        const content = document.getElementById('wizardWaveAnalysisContent');
        if (!content) return;

        content.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Wind Speed (m/s)</label>
                    <input type="number" id="wizardWindSpeed" class="form-input" 
                           value="20" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>Fetch Length (m)</label>
                    <input type="number" id="wizardFetchLength" class="form-input" 
                           value="20000" step="100">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Deep Water Depth (m)</label>
                    <input type="number" id="wizardWaterDepth" class="form-input" 
                           value="30" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>Method</label>
                    <select id="wizardWaveMethod" class="form-input">
                        <option value="smb">SMB</option>
                        <option value="jonswap" selected>JONSWAP</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>MSL (m)</label>
                    <input type="number" id="wizardMSL" class="form-input" 
                           value="0.0" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>Tidal Range (m)</label>
                    <input type="number" id="wizardTidalRange" class="form-input" 
                           value="0.7" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>SLR (m)</label>
                    <input type="number" id="wizardSLR" class="form-input" 
                           value="0.5" step="0.1">
                </div>
            </div>
        `;
    }

    calculateWaveAnalysis() {
        // Get inputs
        const windSpeed = parseFloat(document.getElementById('wizardWindSpeed').value);
        const fetchLength = parseFloat(document.getElementById('wizardFetchLength').value);
        const waterDepth = parseFloat(document.getElementById('wizardWaterDepth').value);
        const method = document.getElementById('wizardWaveMethod').value;
        const msl = parseFloat(document.getElementById('wizardMSL').value);
        const tidalRange = parseFloat(document.getElementById('wizardTidalRange').value);
        const slr = parseFloat(document.getElementById('wizardSLR').value);

        // Calculate using existing functions
        let waveResult;
        if (method === 'smb') {
            waveResult = calculateSMBWaves(windSpeed, fetchLength, waterDepth);
        } else {
            waveResult = calculateJONSWAPWaves(windSpeed, fetchLength, waterDepth);
        }

        const Hb = calculateBreakingHeightMiche(waveResult.Hs, waveResult.L, waterDepth);
        const setup = calculateWaveSetup(waveResult.Hs, waterDepth);
        const dwlResult = calculateDWL(msl, tidalRange, slr, setup);

        // Store results
        this.projectData.waveAnalysis = {
            windSpeed,
            fetchLength,
            waterDepth,
            method,
            msl,
            tidalRange,
            slr,
            ...waveResult,
            Hb,
            setup,
            ...dwlResult
        };

        // Display results
        const resultsDiv = document.getElementById('wizardWaveResults');
        resultsDiv.innerHTML = `
            <div class="results-card success">
                <h3>✓ Wave Analysis Complete</h3>
                <div class="results-grid">
                    <div><strong>Hs:</strong> ${waveResult.Hs.toFixed(2)} m</div>
                    <div><strong>Tp:</strong> ${waveResult.Tp.toFixed(2)} s</div>
                    <div><strong>L:</strong> ${waveResult.L.toFixed(2)} m</div>
                    <div><strong>Hb:</strong> ${Hb.toFixed(2)} m</div>
                    <div><strong>DWL:</strong> ${dwlResult.DWL.toFixed(2)} m</div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // STEP 3: STRUCTURE DESIGN
    // ==========================================

    renderStructureDesignStep(container) {
        const structureNum = this.currentStructureIndex + 1;

        container.innerHTML = `
            <div class="wizard-step">
                <h2>Structure Design #${structureNum}</h2>
                <p class="step-description">Design a coastal structure for this project</p>
                
                <div class="form-group">
                    <label>Structure Name</label>
                    <input type="text" id="wizardStructureName" class="form-input" 
                           placeholder="e.g., Main Breakwater" 
                           value="Structure ${structureNum}">
                </div>
                
                <div class="form-group">
                    <label>Structure Type</label>
                    <select id="wizardStructureType" class="form-input">
                        <option value="rubble-standard">Standard Rubble Mound</option>
                        <option value="rubble-berm">Berm Breakwater</option>
                        <option value="rubble-reef">Reef Breakwater</option>
                        <option value="vertical-wall">Vertical Wall</option>
                    </select>
                </div>
                
                <div id="wizardStructureParams"></div>
                
                <button class="btn-secondary" id="analyzeStructureWizard" style="margin-top: 20px;">
                    Analyze Structure
                </button>
                
                <div id="wizardStructureResults" style="margin-top: 20px;"></div>
            </div>
        `;

        // Load structure parameters based on type
        document.getElementById('wizardStructureType').addEventListener('change', (e) => {
            this.loadStructureParameters(e.target.value);
        });

        // Initial load
        this.loadStructureParameters('rubble-standard');

        // Analyze button
        document.getElementById('analyzeStructureWizard').addEventListener('click', () => {
            this.analyzeStructure();
        });
    }

    loadStructureParameters(type) {
        const container = document.getElementById('wizardStructureParams');
        if (!container) return;

        if (type === 'vertical-wall') {
            container.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Wall Height (m)</label>
                        <input type="number" id="wizardWallHeight" class="form-input" value="12.0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Wall Thickness (m)</label>
                        <input type="number" id="wizardWallThickness" class="form-input" value="3.5" step="0.1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Foundation Width (m)</label>
                        <input type="number" id="wizardFoundationWidth" class="form-input" value="10.0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Toe Depth (m)</label>
                        <input type="number" id="wizardToeDepth" class="form-input" value="8.0" step="0.1">
                    </div>
                </div>
            `;
            return;
        }

        const defaultCrest = type === 'rubble-reef' ? -0.5 : 3.5;
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Slope (1:n)</label>
                    <input type="number" id="wizardSlope" class="form-input" value="1.5" step="0.1">
                </div>

                <div class="form-group">
                    <label>Crest Freeboard / Height (m)</label>
                    <input type="number" id="wizardCrestHeight" class="form-input" value="${defaultCrest}" step="0.1">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Crest Width (m)</label>
                    <input type="number" id="wizardCrestWidth" class="form-input" value="6.0" step="0.1">
                </div>

                <div class="form-group">
                    <label>Toe Depth (m)</label>
                    <input type="number" id="wizardToeDepth" class="form-input" value="4.0" step="0.1">
                </div>
            </div>

            <div class="form-group">
                <label>Armour Stone Size Dn50 (m)</label>
                <input type="number" id="wizardDn50" class="form-input" value="1.2" step="0.05">
            </div>
        `;
    }

    analyzeStructure() {
        const structureName = (document.getElementById('wizardStructureName')?.value || '').trim() || `Structure ${this.currentStructureIndex + 1}`;
        const structureType = document.getElementById('wizardStructureType')?.value || 'rubble-standard';

        const wave = this.projectData.waveAnalysis || {};
        const Hs = Number.isFinite(wave.Hs) ? wave.Hs : 2.5;
        const Tp = Number.isFinite(wave.Tp) ? wave.Tp : 8.0;

        let parameters = {};
        let stability = null;
        let summaryHTML = '';

        if (structureType === 'vertical-wall') {
            const wallHeight = parseFloat(document.getElementById('wizardWallHeight')?.value || 12.0);
            const wallThickness = parseFloat(document.getElementById('wizardWallThickness')?.value || 3.5);
            const foundationWidth = parseFloat(document.getElementById('wizardFoundationWidth')?.value || 10.0);
            const toeDepth = parseFloat(document.getElementById('wizardToeDepth')?.value || 8.0);
            parameters = { wallHeight, wallThickness, foundationWidth, toeDepth, depth: toeDepth };

            const forces = calculateVerticalWallForces({
                wallHeight,
                wallThickness,
                foundationWidth,
                depth: toeDepth,
                waveHeight: Hs,
                wavePeriod: Tp,
                waveAngle: 0
            });
            const check = checkVerticalWallStability({
                wallHeight,
                wallThickness,
                foundationWidth,
                depth: toeDepth,
                concreteDensity: 2400,
                fillDensity: 1800,
                frictionCoeff: 0.6,
                ...forces.forces
            });

            stability = {
                template: 'vertical-wall',
                type: 'vertical-wall',
                params: parameters,
                forces,
                stability: check,
                summary: { passed: check.sliding.passed && check.overturning.passed }
            };
            summaryHTML = `
                <div><strong>Fh:</strong> ${forces.forces.F_h.toFixed(1)} kN/m</div>
                <div><strong>Sliding FS:</strong> ${check.sliding.FS.toFixed(2)} (${check.sliding.passed ? 'PASS' : 'FAIL'})</div>
                <div><strong>Overturning FS:</strong> ${check.overturning.FS.toFixed(2)} (${check.overturning.passed ? 'PASS' : 'FAIL'})</div>
            `;
        } else {
            const slope = parseFloat(document.getElementById('wizardSlope')?.value || 1.5);
            const crestHeight = parseFloat(document.getElementById('wizardCrestHeight')?.value || 3.5);
            const crestWidth = parseFloat(document.getElementById('wizardCrestWidth')?.value || 6.0);
            const toeDepth = parseFloat(document.getElementById('wizardToeDepth')?.value || 4.0);
            const dn50 = parseFloat(document.getElementById('wizardDn50')?.value || 1.2);
            parameters = { slope, crestHeight, crestWidth, toeDepth, depth: toeDepth, dn50 };

            const rho_s = 2650;
            const rho_w = 1025;
            const KD = 4.0;
            const delta = (rho_s - rho_w) / rho_w;
            const W50_t_hudson = hudsonFormula(Hs, rho_s, rho_w, KD, slope);
            const hudson = {
                M50: W50_t_hudson * 1000,
                Dn50: Math.pow((W50_t_hudson * 1000) / rho_s, 1 / 3)
            };
            const vdm = calculateVanDerMeer(Hs, Tp / 1.1, delta, slope, rho_s, 0.4, 2.0, 3000);

            let extra = null;
            if (structureType === 'rubble-reef' && typeof calculateReefTransmission === 'function') {
                extra = calculateReefTransmission({
                    waveHeight: Hs,
                    wavePeriod: Tp,
                    depth: toeDepth,
                    structureHeight: toeDepth + crestHeight,
                    crestWidth,
                    slopeLeft: slope,
                    armourDn50: dn50
                });
            } else if (structureType === 'rubble-berm' && typeof calculateBermStability === 'function') {
                extra = calculateBermStability({
                    armourDn50: dn50,
                    matDensity: rho_s,
                    slopeLeft: slope,
                    bermWidth: crestWidth,
                    bermElevation: crestHeight * 0.5,
                    recession: 5.0,
                    waveHeight: Hs,
                    depth: toeDepth
                });
            }

            const passed = dn50 >= vdm.Dn50;
            stability = {
                template: structureType,
                type: structureType,
                Hs,
                waterDepth: toeDepth,
                slope,
                rho_s,
                KD,
                delta,
                inputDn50: dn50,
                hudson,
                vdm,
                extra,
                volumes: { armour: 0, filter: 0, core: 0 },
                masses: { armour: 0, filter: 0, core: 0 },
                summary: { passed }
            };
            summaryHTML = `
                <div><strong>Hudson Req Dn50:</strong> ${hudson.Dn50.toFixed(2)} m (${(hudson.M50 / 1000).toFixed(2)} t)</div>
                <div><strong>Van der Meer Req Dn50:</strong> ${vdm.Dn50.toFixed(2)} m (${vdm.regime})</div>
                <div><strong>Armour Check (Dn50=${dn50.toFixed(2)} m):</strong> ${passed ? 'PASS' : 'FAIL'}</div>
                ${extra && extra.Kt !== undefined ? `<div><strong>Transmission Kt:</strong> ${extra.Kt.toFixed(3)}</div>` : ''}
            `;
        }

        const structure = {
            id: `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: structureName,
            type: structureType,
            parameters,
            stability,
            status: stability?.summary?.passed ? 'approved' : 'draft'
        };

        if (!this.projectData.structures[this.currentStructureIndex]) {
            this.projectData.structures.push(structure);
        } else {
            this.projectData.structures[this.currentStructureIndex] = structure;
        }
        this.projectData.structureAnalyses = this.projectData.structureAnalyses || {};
        this.projectData.structureAnalyses[structure.id] = {
            ...(this.projectData.structureAnalyses[structure.id] || {}),
            stability
        };

        const resultsDiv = document.getElementById('wizardStructureResults');
        resultsDiv.innerHTML = `
            <div class="results-card success">
                <h3>✓ Structure Analyzed: ${_escWizardHtml(structureName)}</h3>
                <div class="results-grid">${summaryHTML}</div>
            </div>
        `;
    }

    // ==========================================
    // STEP 4: SERVICEABILITY
    // ==========================================

    renderServiceabilityStep(container) {
        const currentStruct = this.projectData.structures[this.currentStructureIndex];
        const defaultRc = currentStruct?.parameters?.crestHeight ?? 3.0;
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Serviceability Analysis</h2>
                <p class="step-description">Assess EurOtop (2018) overtopping and safety for the current structure</p>

                <div class="info-box">
                    Analyzing serviceability for: <strong>${_escWizardHtml(currentStruct?.name || 'Current Structure')}</strong>
                </div>

                <div class="form-group">
                    <label>Freeboard Rc (m)</label>
                    <input type="number" id="wizardFreeboard" class="form-input" value="${defaultRc}" step="0.1">
                </div>

                <div class="form-group" style="display:flex; align-items:center; gap:8px; margin-top:12px;">
                    <input type="checkbox" id="wizardAddAnotherStructure" style="width:auto;">
                    <label for="wizardAddAnotherStructure" style="margin:0;">Add another structure after this step</label>
                </div>

                <button class="btn-secondary" id="analyzeServiceability" style="margin-top:12px;">
                    Calculate Overtopping
                </button>

                <div id="wizardServiceResults" style="margin-top: 20px;"></div>
            </div>
        `;

        document.getElementById('analyzeServiceability').addEventListener('click', () => {
            this.analyzeServiceability();
        });
    }

    analyzeServiceability() {
        const struct = this.projectData.structures[this.currentStructureIndex] || {};
        const params = struct.parameters || {};
        const wave = this.projectData.waveAnalysis || {};

        const freeboard = parseFloat(document.getElementById('wizardFreeboard')?.value || params.crestHeight || 3.0);
        const Hs = Number.isFinite(wave.Hs) ? wave.Hs : 2.5;
        const Tp = Number.isFinite(wave.Tp) ? wave.Tp : 8.0;
        const Tm = Number.isFinite(wave.Tm) ? wave.Tm : Tp / 1.1;
        const slope = params.slope || 1.5;
        const crestWidth = params.crestWidth || 5.0;
        const alphaDeg = struct.type === 'vertical-wall' ? 89 : (Math.atan(1 / slope) * 180) / Math.PI;
        const gamma_f = struct.type === 'vertical-wall' ? 1.0 : 0.55;

        const ot = calculateEurOtopOvertopping(Hs, Tm, freeboard, alphaDeg, gamma_f, 1.0, 1.0, 1.0, crestWidth);
        const Vmax = calculateIndividualWaveVolume(Hs, Tm, freeboard, ot.q, {
            Ru2: ot.Ru2,
            alphaDeg,
            gamma_f,
            Gc: crestWidth
        });
        const safety = assessSafetyThresholds(ot.q_l_s_m);

        const serviceData = {
            freeboard,
            slopeAngle: alphaDeg,
            crestWidth,
            waveHeight: Hs,
            wavePeriod: Tm,
            toeDepth: params.toeDepth || 5.0,
            q: ot.q_l_s_m,
            q_m3_s_m: ot.q,
            Ru2: ot.Ru2,
            xi_m10: ot.xi_m10,
            regime: ot.regime,
            Cr: ot.Cr,
            gamma_f,
            Vmax,
            safety
        };

        struct.serviceability = serviceData;
        if (struct.id) {
            this.projectData.structureAnalyses = this.projectData.structureAnalyses || {};
            this.projectData.structureAnalyses[struct.id] = {
                ...(this.projectData.structureAnalyses[struct.id] || {}),
                stability: struct.stability || null,
                serviceability: serviceData
            };
        }

        const resultsDiv = document.getElementById('wizardServiceResults');
        resultsDiv.innerHTML = `
            <div class="results-card success">
                <h3>✓ Serviceability Analyzed (EurOtop 2018)</h3>
                <div class="results-grid">
                    <div><strong>Mean Discharge (q):</strong> ${ot.q_l_s_m.toFixed(4)} l/s/m</div>
                    <div><strong>Max Wave Volume:</strong> ${Vmax.toFixed(3)} m³/m</div>
                    <div><strong>Run-up (Ru2%):</strong> ${ot.Ru2.toFixed(2)} m</div>
                    <div><strong>Pedestrian Safety:</strong> ${safety.pedestrian.status}</div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // STEP 5: REVIEW
    // ==========================================

    renderReviewStep(container) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Review &amp; Create Project</h2>
                <p class="step-description">Review your project before creating</p>

                <div class="review-section">
                    <h3>Project Information</h3>
                    <table class="review-table">
                        <tr><td><strong>Name:</strong></td><td>${_escWizardHtml(this.projectData.name || 'N/A')}</td></tr>
                        <tr><td><strong>Client:</strong></td><td>${_escWizardHtml(this.projectData.client || 'N/A')}</td></tr>
                        <tr><td><strong>Location:</strong></td><td>${_escWizardHtml(this.projectData.location || 'N/A')}</td></tr>
                    </table>
                </div>

                <div class="review-section">
                    <h3>Wave Analysis</h3>
                    ${this.projectData.waveAnalysis ? `
                        <table class="review-table">
                            <tr><td><strong>Hs:</strong></td><td>${this.projectData.waveAnalysis.Hs?.toFixed(2)} m</td></tr>
                            <tr><td><strong>Tp:</strong></td><td>${this.projectData.waveAnalysis.Tp?.toFixed(2)} s</td></tr>
                            <tr><td><strong>DWL:</strong></td><td>${this.projectData.waveAnalysis.DWL?.toFixed(2)} m</td></tr>
                        </table>
                    ` : '<p>No wave analysis performed</p>'}
                </div>

                <div class="review-section">
                    <h3>Structures (${this.projectData.structures.length})</h3>
                    ${this.projectData.structures.map((s, i) => `
                        <div class="structure-review-card">
                            <strong>${i + 1}. ${_escWizardHtml(s.name)}</strong> - ${_escWizardHtml(s.type)} (${_escWizardHtml(s.status || 'draft')})
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ==========================================
    // VALIDATION & SAVING
    // ==========================================

    validateCurrentStep() {
        const stepName = this.steps[this.currentStep];

        switch (stepName) {
            case 'project-info': {
                const name = document.getElementById('wizardProjectName').value.trim();
                if (!name) {
                    if (window.StructureLibrary?.showNotification) {
                        window.StructureLibrary.showNotification('Please enter a project name', 'error');
                    }
                    return false;
                }
                return true;
            }

            case 'wave-analysis':
                if (!this.projectData.waveAnalysis) {
                    if (window.StructureLibrary?.showNotification) {
                        window.StructureLibrary.showNotification('Please calculate wave conditions before proceeding', 'error');
                    }
                    return false;
                }
                return true;

            case 'structure-design':
                if (!this.projectData.structures[this.currentStructureIndex]) {
                    if (window.StructureLibrary?.showNotification) {
                        window.StructureLibrary.showNotification('Please analyze the structure before proceeding', 'error');
                    }
                    return false;
                }
                return true;

            default:
                return true;
        }
    }

    saveCurrentStepData() {
        const stepName = this.steps[this.currentStep];

        if (stepName === 'project-info') {
            this.projectData.name = document.getElementById('wizardProjectName').value;
            this.projectData.description = document.getElementById('wizardProjectDesc').value;
            this.projectData.client = document.getElementById('wizardClient').value;
            this.projectData.location = document.getElementById('wizardLocation').value;
            this.projectData.engineerName = document.getElementById('wizardEngineer').value;
            this.projectData.companyName = document.getElementById('wizardCompany').value;
        }
    }

    async saveProject() {
        if (!window.projectManager) {
            console.error('Project manager not available');
            return null;
        }

        try {
            const project = await window.projectManager.createProject(this.projectData);
            if (project && window.AppState) {
                window.AppState.projectData = {
                    name: project.name || '',
                    location: project.location || '',
                    engineer: project.engineerName || '',
                    company: project.companyName || ''
                };
                if (project.waveAnalysis) {
                    window.AppState.waveData = project.waveAnalysis;
                }
            }
            console.log('Project created:', project);
            return project;
        } catch (error) {
            console.error('Failed to create project:', error);
            if (window.StructureLibrary?.showNotification) {
                window.StructureLibrary.showNotification('Failed to create project. Please try again.', 'error');
            }
            return null;
        }
    }
}

// ==========================================
// INITIALIZE
// ==========================================

window.ProjectWizard = ProjectWizard;

document.addEventListener('DOMContentLoaded', () => {
    window.projectWizard = new ProjectWizard();
});
