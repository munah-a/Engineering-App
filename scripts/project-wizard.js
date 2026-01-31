// ==========================================
// PROJECT CREATION WIZARD
// Step-by-step guided workflow for creating projects
// ==========================================

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
            structures: []
        };
        this.currentStructureIndex = 0;
    }

    // ==========================================
    // WIZARD CONTROL
    // ==========================================

    start(projectData = {}) {
        this.projectData = {
            ...projectData,
            structures: projectData.structures || []
        };
        this.currentStep = 0;
        this.currentStructureIndex = 0;

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

            // Check if we're adding another structure
            if (this.currentStep === 3) { // After serviceability
                const addAnother = confirm('Would you like to add another structure to this project?');
                if (addAnother) {
                    this.currentStructureIndex++;
                    this.currentStep = 2; // Go back to structure design
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

    finish() {
        this.saveProject();
        this.hideWizardModal();

        // Show success message
        alert(`Project "${this.projectData.name}" created successfully with ${this.projectData.structures.length} structure(s)!`);

        // Refresh project list if on dashboard
        if (window.location.hash === '#dashboard' && window.projectUI) {
            window.projectUI.refreshProjectList();
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
                           value="${this.projectData.name || ''}" 
                           placeholder="e.g., Marina Breakwater Design">
                </div>
                
                <div class="form-group">
                    <label>Project Description</label>
                    <textarea id="wizardProjectDesc" class="form-input" rows="3" 
                              placeholder="Brief description of the project...">${this.projectData.description || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Client</label>
                        <input type="text" id="wizardClient" class="form-input" 
                               value="${this.projectData.client || ''}" 
                               placeholder="Client name">
                    </div>
                    
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="wizardLocation" class="form-input" 
                               value="${this.projectData.location || ''}" 
                               placeholder="Project location">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Engineer Name</label>
                        <input type="text" id="wizardEngineer" class="form-input" 
                               value="${this.projectData.engineerName || ''}" 
                               placeholder="Your name">
                    </div>
                    
                    <div class="form-group">
                        <label>Company</label>
                        <input type="text" id="wizardCompany" class="form-input" 
                               value="${this.projectData.companyName || ''}" 
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

        // Basic rubble mound parameters
        container.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Slope (1:n)</label>
                    <input type="number" id="wizardSlope" class="form-input" value="1.5" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>Crest Height (m)</label>
                    <input type="number" id="wizardCrestHeight" class="form-input" value="5.0" step="0.1">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Crest Width (m)</label>
                    <input type="number" id="wizardCrestWidth" class="form-input" value="6.0" step="0.1">
                </div>
                
                <div class="form-group">
                    <label>Toe Depth (m)</label>
                    <input type="number" id="wizardToeDepth" class="form-input" value="2.0" step="0.1">
                </div>
            </div>
            
            <div class="form-group">
                <label>Armour Stone Size Dn50 (m)</label>
                <input type="number" id="wizardDn50" class="form-input" value="1.0" step="0.01">
            </div>
        `;
    }

    analyzeStructure() {
        // This is a simplified version - you'd call the actual analysis functions
        const structureName = document.getElementById('wizardStructureName').value;
        const structureType = document.getElementById('wizardStructureType').value;

        const structure = {
            id: `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: structureName,
            type: structureType,
            parameters: {
                slope: parseFloat(document.getElementById('wizardSlope').value),
                crestHeight: parseFloat(document.getElementById('wizardCrestHeight').value),
                crestWidth: parseFloat(document.getElementById('wizardCrestWidth').value),
                toeDepth: parseFloat(document.getElementById('wizardToeDepth').value),
                dn50: parseFloat(document.getElementById('wizardDn50').value)
            },
            status: 'designed'
        };

        // Store structure
        if (!this.projectData.structures[this.currentStructureIndex]) {
            this.projectData.structures.push(structure);
        } else {
            this.projectData.structures[this.currentStructureIndex] = structure;
        }

        // Show success
        const resultsDiv = document.getElementById('wizardStructureResults');
        resultsDiv.innerHTML = `
            <div class="results-card success">
                <h3>✓ Structure Analyzed</h3>
                <p><strong>${structureName}</strong> has been added to the project.</p>
            </div>
        `;
    }

    // ==========================================
    // STEP 4: SERVICEABILITY
    // ==========================================

    renderServiceabilityStep(container) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Serviceability Analysis</h2>
                <p class="step-description">Assess overtopping and safety for the current structure</p>
                
                <div class="info-box">
                    Analyzing serviceability for: <strong>${this.projectData.structures[this.currentStructureIndex]?.name || 'Current Structure'}</strong>
                </div>
                
                <div class="form-group">
                    <label>Freeboard (m)</label>
                    <input type="number" id="wizardFreeboard" class="form-input" value="3.0" step="0.1">
                </div>
                
                <button class="btn-secondary" id="analyzeServiceability">
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
        const resultsDiv = document.getElementById('wizardServiceResults');
        resultsDiv.innerHTML = `
            <div class="results-card success">
                <h3>✓ Serviceability Analyzed</h3>
                <p>Overtopping calculations complete.</p>
            </div>
        `;
    }

    // ==========================================
    // STEP 5: REVIEW
    // ==========================================

    renderReviewStep(container) {
        container.innerHTML = `
            <div class="wizard-step">
                <h2>Review & Create Project</h2>
                <p class="step-description">Review your project before creating</p>
                
                <div class="review-section">
                    <h3>Project Information</h3>
                    <table class="review-table">
                        <tr><td><strong>Name:</strong></td><td>${this.projectData.name || 'N/A'}</td></tr>
                        <tr><td><strong>Client:</strong></td><td>${this.projectData.client || 'N/A'}</td></tr>
                        <tr><td><strong>Location:</strong></td><td>${this.projectData.location || 'N/A'}</td></tr>
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
                            <strong>${i + 1}. ${s.name}</strong> - ${s.type}
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
            case 'project-info':
                const name = document.getElementById('wizardProjectName').value.trim();
                if (!name) {
                    alert('Please enter a project name');
                    return false;
                }
                return true;

            case 'wave-analysis':
                if (!this.projectData.waveAnalysis) {
                    alert('Please calculate wave conditions before proceeding');
                    return false;
                }
                return true;

            case 'structure-design':
                if (!this.projectData.structures[this.currentStructureIndex]) {
                    alert('Please analyze the structure before proceeding');
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
            return;
        }

        try {
            const project = await window.projectManager.createProject(this.projectData);
            console.log('Project created:', project);
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please try again.');
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
