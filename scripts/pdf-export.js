// ==========================================
// PDF EXPORT FUNCTIONALITY
// ==========================================

function _escReportHtml(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _fmtNum(value, decimals = 2, fallback = 'N/A') {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : fallback;
}

function _domControlVal(id, fallback) {
    if (typeof document === 'undefined') return fallback;
    if (typeof getDesignValue === 'function') {
        return getDesignValue(id, fallback);
    }
    const el = document.getElementById(`design_${id}`) || document.getElementById(id);
    if (!el) return fallback;
    const raw = el.dataset?.siValue !== undefined ? parseFloat(el.dataset.siValue) : parseFloat(el.value);
    return Number.isFinite(raw) ? raw : fallback;
}

/**
 * Generate engineering report in PDF format
 * This uses HTML to PDF conversion approach
 */
function generatePDFReport() {
    if (typeof document === 'undefined') return;

    const projectName = document.getElementById('projectName')?.value || 'Untitled Project';
    const projectLocation = document.getElementById('projectLocation')?.value || 'Not specified';
    const engineerName = document.getElementById('engineerName')?.value || 'Not specified';
    const companyName = document.getElementById('companyName')?.value || 'Not specified';

    const includeWave = document.getElementById('includeWave')?.checked ?? true;
    const includeStructure = document.getElementById('includeStructure')?.checked ?? true;
    const includeService = document.getElementById('includeService')?.checked ?? true;
    const includeFormulas = document.getElementById('includeFormulas')?.checked ?? true;
    const includeDiagrams = document.getElementById('includeDiagrams')?.checked ?? true;

    const diagramImage = includeDiagrams ? exportCanvasImage() : null;

    const reportHTML = generateReportHTML({
        projectName,
        projectLocation,
        engineerName,
        companyName,
        includeWave,
        includeStructure,
        includeService,
        includeFormulas,
        includeDiagrams,
        diagramImage
    });

    // Always update the embedded preview first
    updateReportPreview(reportHTML);

    // Attempt popup print window safely (fallback cleanly when blocked)
    const printWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (printWindow && printWindow.document) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
    } else if (typeof StructureLibrary !== 'undefined' && typeof StructureLibrary.showNotification === 'function') {
        StructureLibrary.showNotification(
            'Popup blocked by browser — use the "Print Report Preview" button below the toolbar to print or save PDF.',
            'info'
        );
    }
}

/**
 * Generate the complete report HTML
 */
function generateReportHTML(config = {}) {
    const safeConfig = {
        projectName: _escReportHtml(config.projectName || 'Untitled Project'),
        projectLocation: _escReportHtml(config.projectLocation || 'Not specified'),
        engineerName: _escReportHtml(config.engineerName || 'Not specified'),
        companyName: _escReportHtml(config.companyName || 'Not specified'),
        includeWave: config.includeWave ?? true,
        includeStructure: config.includeStructure ?? true,
        includeService: config.includeService ?? true,
        includeFormulas: config.includeFormulas ?? true,
        includeDiagrams: config.includeDiagrams ?? true,
        diagramImage: config.diagramImage || null
    };

    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const state = typeof AppState !== 'undefined'
        ? AppState
        : (typeof globalThis !== 'undefined' && globalThis.AppState ? globalThis.AppState : {});
    const waveData = config.waveData || state.waveData || null;
    const structureData = config.structureData || state.structureData || null;
    const serviceData = config.serviceabilityData || state.serviceabilityData || null;
    const currentProject = config.project || (typeof window !== 'undefined' && window.projectManager ? window.projectManager.getCurrentProject() : null);

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${safeConfig.projectName} - Coastal Engineering Report</title>
    
    <!-- KaTeX for Math Rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        /* Ensure math is visible */
        .katex { font-size: 1.1em; }
        
        .cover-page {
            text-align: center;
            padding: 100px 40px;
            page-break-after: always;
        }
        
        .cover-page h1 {
            font-size: 32pt;
            color: #0a84ff;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .cover-page h2 {
            font-size: 24pt;
            color: #333;
            margin-bottom: 60px;
            font-weight: normal;
        }
        
        .cover-details {
            margin-top: 80px;
            text-align: left;
            font-size: 14pt;
            line-height: 2;
        }
        
        .cover-details strong {
            display: inline-block;
            width: 150px;
        }
        
        .section {
            page-break-inside: avoid;
            margin-bottom: 40px;
        }
        
        h2 {
            color: #0a84ff;
            font-size: 20pt;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #0a84ff;
            padding-bottom: 5px;
        }
        
        h3 {
            color: #333;
            font-size: 16pt;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11pt;
        }
        
        table th {
            background: #f0f0f0;
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
            font-weight: bold;
        }
        
        table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
        }
        
        .formula-box {
            background: #f9f9f9;
            border-left: 4px solid #0a84ff;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Times New Roman', serif;
        }
        
        .result-highlight {
            background: #e3f2fd;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 10pt;
            color: #666;
            text-align: center;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                padding: 0;
            }
            .no-print {
                display: none;
            }
        }
    </style>
    <script>
        function checkAndRender() {
            // Check if KaTeX is loaded
            if (window.renderMathInElement && window.katex) {
                try {
                    renderMathInElement(document.body, {
                        delimiters: [
                            {left: "$$", right: "$$", display: true},
                            {left: "$", right: "$", display: false}
                        ]
                    });
                    
                    // Allow a brief moment for layout paints
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 500);
                    
                } catch (e) {
                    console.error("Math render error:", e);
                    // Print even if math fails, so user gets something
                    window.print();
                }
            } else {
                // Not ready, check again shortly
                setTimeout(checkAndRender, 100);
            }
        }

        // Start checking when basic DOM is ready
        document.addEventListener("DOMContentLoaded", function() {
            // Set a fallback timeout in case scripts fail entirely (5 seconds)
            setTimeout(function() {
                if (!window.katex) window.print(); 
            }, 5000);
            
            checkAndRender();
        });
    </script>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <h1>Coastal Engineering Report</h1>
        <h2>${safeConfig.projectName}</h2>
        
        <div class="cover-details">
            <p><strong>Project:</strong> ${safeConfig.projectName}</p>
            <p><strong>Location:</strong> ${safeConfig.projectLocation}</p>
            <p><strong>Engineer:</strong> ${safeConfig.engineerName}</p>
            <p><strong>Company:</strong> ${safeConfig.companyName}</p>
            <p><strong>Date:</strong> ${date}</p>
        </div>
    </div>
    
    <!-- Table of Contents -->
    <div class="section page-break">
        <h2>Table of Contents</h2>
        <ol>
            <li>Executive Summary</li>
            ${safeConfig.includeWave ? '<li>Wave Analysis</li>' : ''}
            ${safeConfig.includeStructure ? '<li>Structure Design</li>' : ''}
            ${safeConfig.includeService ? '<li>Serviceability Analysis</li>' : ''}
            ${safeConfig.includeFormulas ? '<li>Design Formulas</li>' : ''}
            <li>Conclusions and Recommendations</li>
        </ol>
    </div>
`;

    // Executive Summary
    html += `
    <div class="section page-break">
        <h2>1. Executive Summary</h2>
        <p>This report presents the coastal engineering analysis and design for ${safeConfig.projectName}, 
        located at ${safeConfig.projectLocation}. The analysis includes wave characterization, structural 
        design, and serviceability assessments in accordance with current engineering standards.</p>
        
        <h3>Key Findings</h3>
        <ul>
            <li>Comprehensive wave analysis performed using industry-standard methods</li>
            <li>Structure designed for stability under design wave conditions</li>
            <li>Overtopping rates assessed against safety criteria</li>
            <li>All calculations conform to EurOtop (2018) and USACE CEM guidelines</li>
        </ul>
    </div>
`;

    // Wave Analysis Section
    if (safeConfig.includeWave && waveData && waveData.Hs !== undefined && waveData.Hs !== null) {
        html += generateWaveSection(waveData);
    }

    if (currentProject && Array.isArray(currentProject.structures) && currentProject.structures.length > 0) {
        html += `
        <div class="section page-break">
            <h2>3. Project Structures Overview</h2>
            <p>This project contains ${currentProject.structures.length} structure(s). Each structure is analyzed below using the shared project wave conditions.</p>
            <table>
                <tr>
                    <th>#</th>
                    <th>Structure Name</th>
                    <th>Type</th>
                    <th>Status</th>
                </tr>
                ${currentProject.structures.map((s, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${_escReportHtml(s.name || 'Unnamed Structure')}</td>
                        <td>${_escReportHtml(s.type || 'N/A')}</td>
                        <td>${_escReportHtml(s.status || 'N/A')}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        `;

        const analysesMap = currentProject.structureAnalyses || {};
        currentProject.structures.forEach((structure, index) => {
            const analysis = analysesMap[structure.id];
            if (analysis && analysis.stability) {
                html += `
                <div class="section page-break">
                    <h2>3.${index + 1} Structure: ${_escReportHtml(structure.name || 'Unnamed')}</h2>
                `;
                html += generateStructureSection(analysis.stability, safeConfig.includeDiagrams ? analysis.diagram : null);

                if (safeConfig.includeService && analysis.serviceability && analysis.serviceability.q !== undefined && analysis.serviceability.q !== null) {
                    html += generateServiceabilitySection(analysis.serviceability);
                }

                html += `</div>`;
            }
        });
    } else {
        if (safeConfig.includeStructure && structureData) {
            html += generateStructureSection(structureData, safeConfig.includeDiagrams ? safeConfig.diagramImage : null);
        }

        if (safeConfig.includeService && serviceData && serviceData.q !== undefined && serviceData.q !== null) {
            html += generateServiceabilitySection(serviceData);
        }
    }

    // Formulas Section
    if (safeConfig.includeFormulas) {
        html += generateFormulasSection();
    }

    // Conclusions
    html += `
    <div class="section page-break">
        <h2>Conclusions and Recommendations</h2>
        
        <h3>Design Summary</h3>
        <p>The proposed coastal structure has been designed and analyzed using established 
        engineering principles and formulae. All design parameters should be verified against 
        project-specific safety factors for the specified design conditions.</p>
        
        <h3>Recommendations</h3>
        <ul>
            <li>Physical model testing is recommended for final design validation on critical works</li>
            <li>Regular monitoring and maintenance program should be established</li>
            <li>Climate change sea-level rise allowances should be periodically reviewed</li>
            <li>Construction quality control protocols must be strictly followed</li>
        </ul>
    </div>
`;

    // Footer
    html += `
    <div class="footer">
        <p>This report was generated by CoastalEngineer Pro</p>
        <p>${safeConfig.companyName} | ${safeConfig.engineerName} | ${date}</p>
        <p>Page generated automatically - verify all calculations before construction</p>
    </div>
    
</body>
</html>
`;

    return html;
}

/**
 * Generate Wave Analysis section (offshore + transformed toe conditions)
 */
function generateWaveSection(waveData) {
    const Hs = Number(waveData.Hs ?? 0);
    const Tp = Number(waveData.Tp ?? 0);
    const L = Number(waveData.L ?? waveData.L0 ?? 0);
    const trans = waveData.transformation || null;
    const L0 = Number(trans?.L0 ?? waveData.L0 ?? L);
    const windSpeed = Number(waveData.windSpeed ?? 0);
    const fetchLength = Number(waveData.fetchLength ?? 0);
    const offshoreDepth = Number(waveData.offshoreDepth ?? waveData.waterDepth ?? 0);
    const toeDepth = waveData.toeDepth !== undefined ? Number(waveData.toeDepth) : (trans?.toe?.d !== undefined ? Number(trans.toe.d) : null);
    const method = _escReportHtml((waveData.method || 'smb').toUpperCase());
    const toe = trans?.toe || null;
    const offshore = trans?.offshore || null;
    const coeffs = trans?.coefficients || null;
    const breaking = trans?.breaking || null;

    let calculationSteps = '';
    if ((waveData.method || 'smb') === 'smb' && windSpeed > 0) {
        const F_star = (9.81 * fetchLength) / (windSpeed * windSpeed);
        calculationSteps = `
        <div class="formula-box">
            <p><strong>SMB Method Calculation:</strong></p>
            <p>$$F^* = \\frac{g F}{U_{10}^2} = \\frac{9.81 \\times ${fetchLength.toFixed(0)}}{${windSpeed.toFixed(1)}^2} = ${F_star.toFixed(2)}$$</p>
            <p>$$H_{s,0} = 0.283 \\frac{U_{10}^2}{g} \\tanh(0.530 (F^*)^{0.375}) = ${_fmtNum(offshore?.H ?? Hs, 2)} \\text{ m}$$</p>
            <p>$$T_p = 7.54 \\frac{U_{10}}{g} \\tanh(0.833 (F^*)^{0.375}) = ${_fmtNum(Tp, 2)} \\text{ s}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: USACE Shore Protection Manual (1984); CEM.</em></p>
        </div>`;
    } else {
        calculationSteps = `
        <div class="formula-box">
            <p><strong>${method} Method Calculation:</strong></p>
            <p>$$H_{s,0} = ${_fmtNum(offshore?.H ?? Hs, 2)} \\text{ m}, \\quad T_p = ${_fmtNum(Tp, 2)} \\text{ s}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: Hasselmann et al. (1973); USACE CEM.</em></p>
        </div>`;
    }

    const ksVal = coeffs?.Ks ?? toe?.Ks;
    const krVal = coeffs?.Kr ?? toe?.Kr;
    const betaToe = toe?.beta ?? toe?.thetaDeg ?? waveData.waveAngle ?? 0;
    const isBreaking = breaking?.isDepthLimited ?? toe?.isBreaking ?? false;

    const transformationHTML = toe ? `
        <h3>2.3 Offshore-to-Toe Wave Transformation</h3>
        <table>
            <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
            <tr><td>Deep Water Wave Length ($L_0$)</td><td>${_fmtNum(L0, 2)}</td><td>m</td></tr>
            <tr><td>Offshore Depth ($d_0$)</td><td>${_fmtNum(offshore?.d ?? offshore?.depth ?? offshoreDepth, 2)}</td><td>m</td></tr>
            <tr><td>Structure Toe Depth ($d_{toe}$)</td><td>${_fmtNum(toe.d ?? toe.depth ?? toeDepth, 2)}</td><td>m</td></tr>
            <tr><td>Shoaling Coefficient ($K_s$)</td><td>${_fmtNum(ksVal, 3)}</td><td>-</td></tr>
            <tr><td>Refraction Coefficient ($K_r$)</td><td>${_fmtNum(krVal, 3)}</td><td>-</td></tr>
            <tr><td>Wave Incidence at Toe ($\\theta_{toe}$)</td><td>${_fmtNum(betaToe, 1)}</td><td>deg</td></tr>
            <tr><td>Toe Wavelength ($L_{toe}$)</td><td>${_fmtNum(toe.L ?? L, 2)}</td><td>m</td></tr>
            <tr class="result-highlight"><td><strong>Transformed Design Wave Height at Toe ($H_{s,toe}$)</strong></td><td><strong>${_fmtNum(toe.H ?? Hs, 2)}</strong></td><td><strong>m</strong></td></tr>
            <tr><td>Depth-Limited Breaking Status</td><td colspan="2">${isBreaking ? 'Depth-Limited Breaking Applied' : 'Non-Breaking at Toe'}</td></tr>
        </table>` : '';

    return `
    <div class="section page-break">
        <h2>2. Wave Analysis</h2>
        
        <h3>2.1 Input Parameters</h3>
        <table>
            <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
            <tr><td>Wind Speed ($U_{10}$)</td><td>${_fmtNum(waveData.windSpeed, 1)}</td><td>m/s</td></tr>
            <tr><td>Fetch Length ($F$)</td><td>${_fmtNum(waveData.fetchLength, 0)}</td><td>m</td></tr>
            <tr><td>Offshore Water Depth ($d_0$)</td><td>${_fmtNum(offshoreDepth, 2)}</td><td>m</td></tr>
            ${toeDepth !== null ? `<tr><td>Toe Water Depth ($d_{toe}$)</td><td>${_fmtNum(toeDepth, 2)}</td><td>m</td></tr>` : ''}
            <tr><td>Method</td><td colspan="2">${method}</td></tr>
        </table>
        
        <h3>2.2 Calculation Details</h3>
        ${calculationSteps}

        ${transformationHTML}

        <h3>2.${toe ? '4' : '3'} Design Wave & Water Level Summary</h3>
        <table>
            <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
            <tr><td>Design Wave Height ($H_s$)</td><td>${_fmtNum(Hs, 2)}</td><td>m</td></tr>
            <tr><td>Peak Period ($T_p$)</td><td>${_fmtNum(Tp, 2)}</td><td>s</td></tr>
            <tr><td>Local Wave Length ($L$)</td><td>${_fmtNum(L, 2)}</td><td>m</td></tr>
            <tr><td>Breaking Wave Height ($H_b$)</td><td>${_fmtNum(waveData.Hb, 2)}</td><td>m</td></tr>
            <tr><td>High Tide Level (HTL)</td><td>${_fmtNum(waveData.HTL, 2)}</td><td>m</td></tr>
            <tr><td>Sea Level Rise (SLR)</td><td>${_fmtNum(waveData.slr ?? 0.5, 2)}</td><td>m</td></tr>
            <tr><td>Wave Setup ($\\eta$)</td><td>${_fmtNum(waveData.setup, 3)}</td><td>m</td></tr>
            <tr class="result-highlight">
                <td><strong>Design Water Level (DWL)</strong></td>
                <td><strong>${_fmtNum(waveData.DWL, 2)}</strong></td>
                <td><strong>m</strong></td>
            </tr>
        </table>
        <div class="formula-box">
             <p>$$DWL = HTL + SLR + \\eta = ${_fmtNum(waveData.HTL, 2)} + ${_fmtNum(waveData.slr ?? 0.5, 2)} + ${_fmtNum(waveData.setup, 3)} = ${_fmtNum(waveData.DWL, 2)} \\text{ m}$$</p>
        </div>
    </div>
`;
}

/**
 * Generate Structure Design section (supports all 11 templates)
 */
function generateStructureSection(data, diagramImage) {
    if (!data || typeof data !== 'object') {
        return '<div class="section"><p>Structure data incomplete.</p></div>';
    }

    const templateType = data.template || data.type || (data.hudson ? 'rubble-standard' : '');
    const diagramHTML = diagramImage ? `
        <h3>3.0 Structure Cross-Section</h3>
        <div style="text-align:center; margin: 20px 0; border:1px solid #ddd; padding:10px; break-inside: avoid;">
            <img src="${diagramImage}" style="max-width:100%; max-height:120mm; object-fit: contain;" alt="Structure Diagram">
            <p style="font-size:0.9em; color:#666; margin-top:5px;"><em>Figure 3.1: Designed Structure Cross-Section</em></p>
        </div>
    ` : '';

    // 1. Standard Rubble Mound / Bullnose / Custom Rubble
    if (data.hudson && data.vdm) {
        const hsVal = Number(data.Hs ?? data.params?.waveHeight ?? 0);
        const wdVal = Number(data.waterDepth ?? data.params?.depth ?? 0);
        const slopeVal = Number(data.slope ?? data.params?.slope ?? data.params?.slopeLeft ?? 1.5);
        const rho_s = Number(data.rho_s ?? data.params?.matDensity ?? 2650);
        const KD = Number(data.KD ?? data.params?.matKd ?? 4.0);
        const delta = Number(data.delta ?? ((rho_s - 1025) / 1025));
        const inputDn = Number(data.inputDn50 ?? data.params?.dn50 ?? data.params?.armourDn50 ?? 1.2);
        const filterR = _domControlVal('filterWeightRatio', 10);
        const toeR = _domControlVal('toeWeightRatio', 10);
        const coreR = _domControlVal('coreWeightRatio', 200);
        const filterDn = inputDn / Math.pow(Math.max(1, filterR), 1 / 3);
        const toeDn = inputDn / Math.pow(Math.max(1, toeR), 1 / 3);
        const coreDn = inputDn / Math.pow(Math.max(1, coreR), 1 / 3);

        const quantitiesHTML = data.volumes && data.masses ? `
            <h3>3.6 Quantities (per m run)</h3>
            <table>
                <tr><th>Layer</th><th>Volume (m³/m)</th><th>Mass (t/m)</th></tr>
                <tr><td>Armour</td><td>${_fmtNum(data.volumes.armour, 2)}</td><td>${_fmtNum(data.masses.armour / 1000, 2)}</td></tr>
                <tr><td>Filter</td><td>${_fmtNum(data.volumes.filter, 2)}</td><td>${_fmtNum(data.masses.filter / 1000, 2)}</td></tr>
                <tr><td>Core</td><td>${_fmtNum(data.volumes.core, 2)}</td><td>${_fmtNum(data.masses.core / 1000, 2)}</td></tr>
                ${data.volumes.toe !== undefined ? `<tr><td>Toe</td><td>${_fmtNum(data.volumes.toe, 2)}</td><td>${_fmtNum((data.masses.toe || 0) / 1000, 2)}</td></tr>` : ''}
            </table>` : '';

        return `
        <div class="section page-break">
            <h2>3. Structure Design (${_escReportHtml(data.templateName || templateType || 'Rubble Mound')})</h2>
            ${diagramHTML}
            <h3>3.1 Design Conditions</h3>
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Design Wave Height ($H_s$)</td><td>${_fmtNum(hsVal, 2)}</td><td>m</td></tr>
                <tr><td>Effective Water Depth ($d$)</td><td>${_fmtNum(wdVal, 2)}</td><td>m</td></tr>
                <tr><td>Structure Slope</td><td>1:${_fmtNum(slopeVal, 2)}</td><td>-</td></tr>
                <tr><td>Armour Rock Properties</td><td>${_fmtNum(rho_s, 0)} kg/m³ ($K_D=${_fmtNum(KD, 1)}$)</td><td>-</td></tr>
            </table>

            <h3>3.2 Stability Analysis: Hudson Formula</h3>
            <div class="formula-box">
                <p>$$M_{50} = \\frac{\\rho_s H_s^3}{K_D \\Delta^3 \\cot \\alpha} = ${_fmtNum(data.hudson.M50 / 1000, 2)} \\text{ tonnes}$$</p>
                <p>$$D_{n50} = (M_{50}/\\rho_s)^{1/3} = ${_fmtNum(data.hudson.Dn50, 2)} \\text{ m}$$</p>
                <p style="font-size:0.8em; margin-top:5px;"><em>Source: Hudson (1959); USACE Shore Protection Manual / CEM.</em></p>
            </div>

            <h3>3.3 Stability Analysis: Van der Meer (1988)</h3>
            <div class="formula-box">
                <p><strong>Surf Similarity Parameter ($\\xi_m$):</strong></p>
                <p>$$\\xi_m = \\frac{\\tan \\alpha}{\\sqrt{H_s/L_0}} = ${_fmtNum(data.vdm.xi_m, 2)} \\quad (\\text{Regime: ${_escReportHtml(data.vdm.regime || 'N/A')}})$$</p>
                <p><strong>Conditions:</strong> Permeability $P=${_fmtNum(data.vdm.P, 2)}$, Damage $S=${_fmtNum(data.vdm.S_dam, 1)}$, Waves $N=${_fmtNum(data.vdm.N_waves, 0)}$</p>
                <p><strong>Stability Number ($N_s$):</strong> ${_fmtNum(data.vdm.Ns_vdm ?? data.vdm.Ns, 2)}</p>
                <p>$$D_{n50} = \\frac{H_s}{\\Delta \\cdot N_s} = \\frac{${_fmtNum(hsVal, 2)}}{${_fmtNum(delta, 2)} \\times ${_fmtNum(data.vdm.Ns_vdm ?? data.vdm.Ns, 2)}} = ${_fmtNum(data.vdm.Dn50, 2)} \\text{ m} \\quad (M_{50} = ${_fmtNum(data.vdm.M50 / 1000, 2)} \\text{ tonnes})$$</p>
            </div>

            <h3>3.4 Selected Armour</h3>
            <div class="result-highlight">
                <p><strong>Input Armour Size ($D_{n50}$):</strong> ${_fmtNum(inputDn, 2)} m</p>
                <p><strong>Safety Check:</strong> ${inputDn >= data.vdm.Dn50 ? 'PASS (Adequate)' : 'FAIL (Increase Size)'}</p>
            </div>

            <h3>3.5 Layer Weight Ratios (CEM Table VI-5-127)</h3>
            <table>
                <tr><th>Layer</th><th>Weight Ratio</th><th>Calculated $D_{n50}$ (m)</th></tr>
                <tr><td>Filter</td><td>1/${_fmtNum(filterR, 0)}</td><td>${_fmtNum(filterDn, 3)}</td></tr>
                <tr><td>Toe</td><td>1/${_fmtNum(toeR, 0)}</td><td>${_fmtNum(toeDn, 3)}</td></tr>
                <tr><td>Core</td><td>1/${_fmtNum(coreR, 0)}</td><td>${_fmtNum(coreDn, 3)}</td></tr>
            </table>
            ${quantitiesHTML}
        </div>`;
    }

    // 2. Rubble Mound Revetment
    if (templateType === 'rubble-revetment' && data.stability) {
        const p = data.params || {};
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Shoreline Revetment)</h2>
            ${diagramHTML}
            <h3>3.1 Stability &amp; Runup Results</h3>
            <table>
                <tr><th>Metric</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Slope / Wave Height / Period</td><td>1:${_fmtNum(p.slopeLeft, 1)} / ${_fmtNum(p.waveHeight, 2)} m / ${_fmtNum(p.wavePeriod, 1)} s</td><td>-</td></tr>
                <tr><td>Provided Armour $D_{n50}$</td><td>${_fmtNum(p.armourDn50, 2)}</td><td>m</td></tr>
                <tr><td>Required Van der Meer $D_{n50}$</td><td>${_fmtNum(data.stability.vdmDn50, 2)}</td><td>m</td></tr>
                <tr><td>Required Hudson $D_{n50}$</td><td>${_fmtNum(data.stability.hudsonDn50, 2)}</td><td>m</td></tr>
                <tr><td>Stability Ratio (Provided / Required)</td><td>${_fmtNum(data.stability.stabilityRatio, 2)}</td><td>-</td></tr>
                <tr><td>Wave Runup $R_{u2\\%}$</td><td>${_fmtNum(data.runup?.Ru2, 2)}</td><td>m</td></tr>
                <tr class="result-highlight"><td><strong>Overtopping Rate ($q$)</strong></td><td><strong>${_fmtNum(data.q_overtop, 4)}</strong></td><td><strong>l/s/m (${data.stability.passed ? 'PASS' : 'FAIL'})</strong></td></tr>
            </table>
        </div>`;
    }

    // 3. Berm Breakwater
    if (templateType === 'rubble-berm' && data.result) {
        const p = data.params || {};
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Berm Breakwater)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Provided $D_{n50}$ / Berm Width</td><td>${_fmtNum(p.armourDn50, 2)} m / ${_fmtNum(p.bermWidth, 2)} m</td><td>-</td></tr>
                <tr><td>Stability Number ($H_0$)</td><td>${_fmtNum(r.Ns, 2)}</td><td>-</td></tr>
                <tr><td>Expected Recession ($R_{ec}$)</td><td>${_fmtNum(r.recession, 2)}</td><td>m</td></tr>
                <tr><td>Required Minimum Berm Width</td><td>${_fmtNum(r.requiredBermWidth, 2)}</td><td>m</td></tr>
                <tr class="result-highlight"><td><strong>Berm Reshaping Check</strong></td><td colspan="2"><strong>${r.passed ? 'PASS' : 'FAIL'}</strong></td></tr>
            </table>
        </div>`;
    }

    // 4. Reef Breakwater
    if (templateType === 'rubble-reef' && data.result) {
        const p = data.params || {};
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Submerged / Reef Breakwater)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Depth ($d$) / Freeboard ($R_c$)</td><td>${_fmtNum(p.depth, 2)} m / ${_fmtNum(p.crestHeight, 2)} m</td><td>-</td></tr>
                <tr><td>Crest Width ($B_c$)</td><td>${_fmtNum(p.crestWidth, 2)}</td><td>m</td></tr>
                <tr><td>Transmission Coefficient ($K_t$)</td><td>${_fmtNum(r.Kt, 3)}</td><td>-</td></tr>
                <tr><td>Transmitted Wave Height ($H_t$)</td><td>${_fmtNum(r.Ht, 2)}</td><td>m</td></tr>
                <tr><td>Wave Energy Attenuation</td><td>${_fmtNum(r.energyDissipatedPct, 1)}</td><td>%</td></tr>
                ${data.hudson ? `<tr><td>Hudson Armour Check ($D_{n50}$ req)</td><td>${_fmtNum(data.hudson.Dn50, 2)}</td><td>m</td></tr>` : ''}
                <tr class="result-highlight"><td><strong>Reef Performance</strong></td><td colspan="2"><strong>${r.passed ? 'PASS' : 'REVIEW'}</strong></td></tr>
            </table>
        </div>`;
    }

    // 5. Low-Crested Breakwater
    if (templateType === 'rubble-low' && data.result) {
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Low-Crested Structure)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Required $D_{n50}$ (Van der Meer + Freeboard Reduction)</td><td>${_fmtNum(r.stability?.Dn50_required, 2)}</td><td>m</td></tr>
                <tr><td>Transmission Coefficient ($K_t$)</td><td>${_fmtNum(r.transmission?.Kt, 3)}</td><td>-</td></tr>
                <tr><td>Transmitted Wave Height ($H_t$)</td><td>${_fmtNum(r.transmission?.Ht, 2)}</td><td>m</td></tr>
                <tr class="result-highlight"><td><strong>EurOtop Overtopping ($q$)</strong></td><td><strong>${_fmtNum(r.overtopping?.q_l_s_m ?? r.overtopping?.q, 3)}</strong></td><td><strong>l/s/m</strong></td></tr>
            </table>
        </div>`;
    }

    // 6. Vertical Wall & Custom Vertical
    if ((templateType === 'vertical-wall' || (templateType === 'custom' && data.family === 'vertical')) && data.forces && data.stability) {
        const p = data.params || {};
        const f = data.forces.forces || data.forces;
        const st = data.stability;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Vertical Gravity Wall - Goda Method)</h2>
            ${diagramHTML}
            <h3>3.1 Dimensions &amp; Goda Wave Loads</h3>
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Wall Height / Foundation Width / Toe Depth</td><td>${_fmtNum(p.wallHeight, 2)} / ${_fmtNum(p.foundationWidth, 2)} / ${_fmtNum(p.depth, 2)}</td><td>m</td></tr>
                <tr><td>Horizontal Wave Force ($F_h$)</td><td>${_fmtNum(f.F_h, 2)}</td><td>kN/m</td></tr>
                <tr><td>Uplift Force ($F_u$)</td><td>${_fmtNum(f.F_uplift, 2)}</td><td>kN/m</td></tr>
                <tr><td>Overturning Moment ($M_{ot}$)</td><td>${_fmtNum(f.M_overturn, 2)}</td><td>kNm/m</td></tr>
            </table>
            <h3>3.2 Stability Verification</h3>
            <table>
                <tr><th>Check</th><th>Factor of Safety</th><th>Required</th><th>Status</th></tr>
                <tr><td>Sliding</td><td>${_fmtNum(st.sliding?.FS, 2)}</td><td>${_fmtNum(st.sliding?.required ?? 1.5, 2)}</td><td>${st.sliding?.passed ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Overturning</td><td>${_fmtNum(st.overturning?.FS, 2)}</td><td>${_fmtNum(st.overturning?.required ?? 2.0, 2)}</td><td>${st.overturning?.passed ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Bearing Capacity ($q_{max}$)</td><td>${_fmtNum(st.bearing?.q_max, 1)} kPa</td><td>&le; ${_fmtNum(st.bearing?.q_allow ?? 300, 1)} kPa</td><td>${st.bearing?.passed ? 'PASS' : 'FAIL'}</td></tr>
            </table>
        </div>`;
    }

    // 7. Composite Structure
    if (templateType === 'vertical-composite' && data.result) {
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Composite Breakwater)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Component / Check</th><th>Result</th><th>Status</th></tr>
                <tr><td>Rubble Mound Required $D_{n50}$</td><td>${_fmtNum(r.mound?.Dn50_required, 2)} m</td><td>${r.mound?.stable ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Crown Wall Horizontal Force ($F_h$)</td><td>${_fmtNum(r.wall?.forces?.F_h, 2)} kN/m</td><td>${r.wall?.stable ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Crown Wall Sliding / Overturning FS</td><td>${_fmtNum(r.wall?.stability?.sliding?.FS, 2)} / ${_fmtNum(r.wall?.stability?.overturning?.FS, 2)}</td><td>${r.wall?.stable ? 'PASS' : 'FAIL'}</td></tr>
            </table>
        </div>`;
    }

    // 8. Caisson Breakwater
    if (templateType === 'vertical-caisson' && data.result) {
        const p = data.params || {};
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Caisson Breakwater)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Status / Unit</th></tr>
                <tr><td>Caisson Width / Height / Cells</td><td>${_fmtNum(p.caissonWidth, 2)} m / ${_fmtNum(p.caissonHeight, 2)} m / ${_fmtNum(p.cellCount, 0)}</td><td>-</td></tr>
                <tr><td>Horizontal Wave Force ($F_h$)</td><td>${_fmtNum(r.forces?.F_h, 2)}</td><td>kN/m</td></tr>
                <tr><td>Uplift Force ($F_u$)</td><td>${_fmtNum(r.forces?.F_uplift, 2)}</td><td>kN/m</td></tr>
                <tr><td>Sliding Factor of Safety</td><td>${_fmtNum(r.sliding?.FS, 2)}</td><td>${r.sliding?.passed ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Overturning Factor of Safety</td><td>${_fmtNum(r.overturning?.FS, 2)}</td><td>${r.overturning?.passed ? 'PASS' : 'FAIL'}</td></tr>
                <tr><td>Bearing Pressure ($q_{max}$)</td><td>${_fmtNum(r.bearing?.q_max, 1)} kPa</td><td>${r.bearing?.passed ? 'PASS' : 'FAIL'}</td></tr>
            </table>
        </div>`;
    }

    // 9. Perforated Caisson
    if (templateType === 'vertical-perforated' && data.result) {
        const r = data.result;
        return `
        <div class="section page-break">
            <h2>3. Structure Design (Perforated Wave-Dissipating Caisson)</h2>
            ${diagramHTML}
            <table>
                <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                <tr><td>Reflection Coefficient ($K_r$)</td><td>${_fmtNum(r.reflection?.Kr, 3)}</td><td>-</td></tr>
                <tr><td>Energy Dissipation</td><td>${_fmtNum(r.reflection?.energyDissipatedPct, 1)}</td><td>%</td></tr>
                <tr><td>Perforated Wall Force ($F_{perf}$)</td><td>${_fmtNum(r.forces?.F_perforated, 2)}</td><td>kN/m</td></tr>
                <tr><td>Equivalent Solid Wall Force ($F_{solid}$)</td><td>${_fmtNum(r.forces?.F_solid, 2)}</td><td>kN/m</td></tr>
            </table>
        </div>`;
    }

    // Generic Fallback
    return `
    <div class="section page-break">
        <h2>3. Structure Design (${_escReportHtml(templateType || 'Custom')})</h2>
        ${diagramHTML}
        <pre style="background:#f5f5f5; padding:12px; font-size:10pt; white-space:pre-wrap;">${_escReportHtml(JSON.stringify(data.summary || data.params || data, null, 2))}</pre>
    </div>`;
}

/**
 * Generate Serviceability section (EurOtop 2018 Eqs. 5.10 / 5.11)
 */
function generateServiceabilitySection(data) {
    const g = 9.81;
    const Hm0 = Math.max(0.01, Number(data.waveHeight ?? 0.01));
    const Tm = Math.max(0.1, Number(data.wavePeriod ?? 8.0));
    const slopeAngle = Number(data.slopeAngle ?? 33.69);
    const Rc = Number(data.freeboard ?? 0);
    const gamma_f = Number(data.gamma_f ?? 1.0);
    const gamma_v = Number(data.gamma_v ?? 1.0);
    const Cr = Number(data.Cr ?? 1.0);
    const Ru2 = data.Ru2 !== undefined ? Number(data.Ru2) : null;
    const Vmax = data.Vmax !== undefined ? Number(data.Vmax) : null;
    const q = Number(data.q ?? 0);

    const Lm = (g * Tm * Tm) / (2 * Math.PI);
    const tanAlpha = Math.tan((slopeAngle * Math.PI) / 180);
    const xi = Number(data.xi_m10 ?? (tanAlpha / Math.sqrt(Hm0 / Lm)));
    const isBreaking = xi < 2.0;
    const crestStatusNote = Rc <= 0
        ? `Crest at or below SWL ($R_c = ${_fmtNum(Rc, 2)}$ m $\\le 0$) — zero-freeboard / weir overflow regime applied.`
        : `Positive freeboard ($R_c = ${_fmtNum(Rc, 2)}$ m) evaluated with roughness $\\gamma_f = ${_fmtNum(gamma_f, 2)}$ and crest factor $C_r = ${_fmtNum(Cr, 2)}$.`;

    return `
    <div class="section page-break">
        <h2>4. Serviceability Analysis</h2>
        
        <h3>4.1 Overtopping Analysis (EurOtop 2018)</h3>
        <p>${crestStatusNote}</p>
        <table>
            <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
            <tr><td>Crest Freeboard ($R_c$)</td><td>${_fmtNum(Rc, 2)}</td><td>m</td></tr>
            <tr><td>Slope Angle ($\\alpha$)</td><td>${_fmtNum(slopeAngle, 1)}</td><td>degrees</td></tr>
            <tr><td>Crest Width ($G_c$)</td><td>${_fmtNum(data.crestWidth ?? 0, 2)}</td><td>m</td></tr>
            <tr><td>Design Wave Height ($H_{m0}$)</td><td>${_fmtNum(Hm0, 2)}</td><td>m</td></tr>
            <tr><td>Wave Period ($T_{m-1,0}$)</td><td>${_fmtNum(Tm, 1)}</td><td>s</td></tr>
            <tr><td>Roughness Factor ($\\gamma_f$) / Wall Factor ($\\gamma_v$)</td><td>${_fmtNum(gamma_f, 2)} / ${_fmtNum(gamma_v, 2)}</td><td>-</td></tr>
            <tr><td>Crest Width Reduction ($C_r$)</td><td>${_fmtNum(Cr, 3)}</td><td>-</td></tr>
            ${Ru2 !== null ? `<tr><td>2% Wave Run-up ($R_{u2\\%}$)</td><td>${_fmtNum(Ru2, 2)}</td><td>m</td></tr>` : ''}
            ${Vmax !== null ? `<tr><td>Max Individual Wave Overtopping Volume ($V_{max}$)</td><td>${_fmtNum(Vmax, 1)}</td><td>l/m</td></tr>` : ''}
        </table>

        <h3>4.2 Detailed Calculation</h3>
        <div class="formula-box">
            <p><strong>Wave Steepness &amp; Breaker Parameter:</strong></p>
            <p>$$L_{m-1,0} = \\frac{g T_{m-1,0}^2}{2\\pi} = ${Lm.toFixed(2)} \\text{ m}, \\qquad \\xi_{m-1,0} = \\frac{\\tan \\alpha}{\\sqrt{H_{m0}/L_{m-1,0}}} = ${xi.toFixed(2)}$$</p>
            
            <p><strong>EurOtop (2018) Mean Overtopping Discharge (${isBreaking ? 'Breaking — Eq. 5.10' : 'Non-Breaking — Eq. 5.11'}):</strong></p>
            ${isBreaking ?
            `<p>$$\\frac{q}{\\sqrt{g H_{m0}^3}} = \\frac{0.023}{\\sqrt{\\tan\\alpha}} \\gamma_b \\xi_{m-1,0} \\exp\\!\\left[-\\left(2.7 \\frac{R_c}{\\xi_{m-1,0} H_{m0} \\gamma_b \\gamma_f \\gamma_\\beta \\gamma_v}\\right)^{1.3}\\right] \\cdot C_r$$</p>` :
            `<p>$$\\frac{q}{\\sqrt{g H_{m0}^3}} = 0.09 \\exp\\!\\left[-\\left(1.5 \\frac{R_c}{H_{m0} \\gamma_f \\gamma_\\beta \\gamma_\\nu}\\right)^{1.3}\\right] \\cdot C_r$$</p>`}
            ${Rc <= 0 ? '<p><em>For $R_c \\le 0$: combined EurOtop zero-freeboard discharge and submerged crest weir overflow ($q_{weir} = 0.54 \\sqrt{g |-R_c|^3}$) applied.</em></p>' : ''}
            <p><strong>Result:</strong></p>
            <p>$$q = ${q.toFixed(4)} \\text{ l/s/m} \\quad (${(q / 1000).toFixed(6)} \\text{ m}^3/\\text{s/m})$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: EurOtop Manual 2nd Edition (2018), Chapter 5, Eqs. 5.10, 5.11 &amp; 5.16.</em></p>
        </div>
        
        <h3>4.3 Safety Assessment</h3>
        <table>
            <tr>
                <th>Category</th>
                <th>Limit</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Pedestrians</td>
                <td>0.01 l/s/m</td>
                <td style="color:${data.safety?.pedestrian?.safe ? 'green' : 'red'}">${_escReportHtml(data.safety?.pedestrian?.status || 'N/A')}</td>
            </tr>
            <tr>
                <td>Vehicles</td>
                <td>0.05 l/s/m</td>
                <td style="color:${data.safety?.vehicle?.safe ? 'green' : 'red'}">${_escReportHtml(data.safety?.vehicle?.status || 'N/A')}</td>
            </tr>
            <tr>
                <td>Buildings</td>
                <td>1.0 l/s/m</td>
                <td style="color:${data.safety?.building?.safe ? 'green' : 'red'}">${_escReportHtml(data.safety?.building?.status || 'N/A')}</td>
            </tr>
        </table>
    </div>
`;
}

/**
 * Generate Formulas section (Appendix)
 */
function generateFormulasSection() {
    return `
    <div class="section page-break">
        <h2>5. Appendix: Reference Formulas</h2>
        <p>The following formulas are standard references used in this application.</p>
        
        <h3>5.1 Wave &amp; Water Level</h3>
        <div class="formula-box">
             <p><strong>Wave Setup:</strong></p>
             <p>$$\\eta_{max} \\approx 0.19 \\cdot H_b$$</p>
             <p><em>USACE Coastal Engineering Manual (CEM Part II-4).</em></p>
        </div>

        <h3>5.2 Rubble Mound Stability</h3>
        <div class="formula-box">
            <p><strong>Hudson Formula (1959):</strong></p>
            <p>$$M_{50} = \\frac{\\rho_s H_s^3}{K_D \\Delta^3 \\cot \\alpha}$$</p>
        </div>
        
        <div class="formula-box">
             <p><strong>Van der Meer (1988):</strong></p>
             <p>Used for plunging ($\\xi_m &lt; \\xi_{mc}$) and surging ($\\xi_m \\ge \\xi_{mc}$) wave stability accounting for permeability ($P$), damage ($S$), and storm wave count ($N$).</p>
        </div>

        <h3>5.3 Overtopping</h3>
        <div class="formula-box">
             <p><strong>EurOtop (2018) Eqs. 5.10 &amp; 5.11:</strong></p>
             <p>Mean overtopping discharge incorporating breaker parameter $\\xi_{m-1,0}$, roughness $\\gamma_f$, crown wall factor $\\gamma_v$, and crest width reduction $C_r$.</p>
        </div>
    </div>
`;
}

/**
 * Update the preview panel with non-blocking embedded Print button
 */
function updateReportPreview(html) {
    if (typeof document === 'undefined') return;
    const previewContainer = document.getElementById('reportPreview');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
        <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
            <button type="button" id="printReportPreviewBtn" class="btn btn-primary btn-sm">Print Report Preview</button>
        </div>
        <iframe id="reportPreviewFrame" style="width: 100%; height: 600px; border: none; background: white;"></iframe>
    `;

    const frame = document.getElementById('reportPreviewFrame');
    if (frame) {
        frame.srcdoc = html;
    }

    const printBtn = document.getElementById('printReportPreviewBtn');
    if (printBtn && frame) {
        printBtn.addEventListener('click', () => {
            if (frame.contentWindow) {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            }
        });
    }
}

/**
 * Export canvas as image for report
 */
function exportCanvasImage() {
    if (typeof document === 'undefined') return null;
    const canvas = document.getElementById('designCanvas');
    if (canvas && typeof canvas.toDataURL === 'function') {
        return canvas.toDataURL('image/png');
    }
    return null;
}

if (typeof window !== 'undefined') {
    window.generatePDFReport = generatePDFReport;
    window.generateReportHTML = generateReportHTML;
    window.generateWaveSection = generateWaveSection;
    window.generateStructureSection = generateStructureSection;
    window.generateServiceabilitySection = generateServiceabilitySection;
    window.updateReportPreview = updateReportPreview;
    window.exportCanvasImage = exportCanvasImage;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generatePDFReport,
        generateReportHTML,
        generateWaveSection,
        generateStructureSection,
        generateServiceabilitySection,
        generateFormulasSection,
        exportCanvasImage
    };
}
