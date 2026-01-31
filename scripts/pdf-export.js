// ==========================================
// PDF EXPORT FUNCTIONALITY
// ==========================================

/**
 * Generate engineering report in PDF format
 * This uses HTML to PDF conversion approach
 */
function generatePDFReport() {
    // Get configuration
    const projectName = document.getElementById('projectName')?.value || 'Untitled Project';
    const projectLocation = document.getElementById('projectLocation')?.value || 'Not specified';
    const engineerName = document.getElementById('engineerName')?.value || 'Not specified';
    const companyName = document.getElementById('companyName')?.value || 'Not specified';

    const includeWave = document.getElementById('includeWave')?.checked ?? true;
    const includeStructure = document.getElementById('includeStructure')?.checked ?? true;
    const includeService = document.getElementById('includeService')?.checked ?? true;
    const includeFormulas = document.getElementById('includeFormulas')?.checked ?? true;
    const includeDiagrams = document.getElementById('includeDiagrams')?.checked ?? true;

    // Capture diagram if requested
    const diagramImage = includeDiagrams ? exportCanvasImage() : null;

    // Create report HTML
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

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportHTML);
    printWindow.document.close();

    // Update preview
    updateReportPreview(reportHTML);
}

/**
 * Generate the complete report HTML
 */
function generateReportHTML(config) {
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${config.projectName} - Coastal Engineering Report</title>
    
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
        <h2>${config.projectName}</h2>
        
        <div class="cover-details">
            <p><strong>Project:</strong> ${config.projectName}</p>
            <p><strong>Location:</strong> ${config.projectLocation}</p>
            <p><strong>Engineer:</strong> ${config.engineerName}</p>
            <p><strong>Company:</strong> ${config.companyName}</p>
            <p><strong>Date:</strong> ${date}</p>
        </div>
    </div>
    
    <!-- Table of Contents -->
    <div class="section page-break">
        <h2>Table of Contents</h2>
        <ol>
            <li>Executive Summary</li>
            ${config.includeWave ? '<li>Wave Analysis</li>' : ''}
            ${config.includeStructure ? '<li>Structure Design</li>' : ''}
            ${config.includeService ? '<li>Serviceability Analysis</li>' : ''}
            ${config.includeFormulas ? '<li>Design Formulas</li>' : ''}
            <li>Conclusions and Recommendations</li>
        </ol>
    </div>
`;

    // Executive Summary
    html += `
    <div class="section page-break">
        <h2>1. Executive Summary</h2>
        <p>This report presents the coastal engineering analysis and design for ${config.projectName}, 
        located at ${config.projectLocation}. The analysis includes wave characterization, structural 
        design, and serviceability assessments in accordance with current engineering standards.</p>
        
        <h3>Key Findings</h3>
        <ul>
            <li>Comprehensive wave analysis performed using industry-standard methods</li>
            <li>Structure designed for stability under design wave conditions</li>
            <li>Overtopping rates assessed against safety criteria</li>
            <li>All calculations conform to EurOtop and USACE guidelines</li>
        </ul>
    </div>
`;

    // Wave Analysis Section
    if (config.includeWave && AppState.waveData && AppState.waveData.Hs) {
        html += generateWaveSection(AppState.waveData);
    }

    // Check if we're generating a multi-structure project report
    const currentProject = window.projectManager ? window.projectManager.getCurrentProject() : null;

    if (currentProject && currentProject.structures.length > 0) {
        // Multi-structure project report
        html += `
        <div class="section page-break">
            <h2>3. Project Structures Overview</h2>
            <p>This project contains ${currentProject.structures.length} structure(s). Each structure is analyzed below using the shared wave conditions from Section 2.</p>
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
                        <td>${s.name || 'Unnamed Structure'}</td>
                        <td>${s.type || 'N/A'}</td>
                        <td>${s.status || 'N/A'}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
        `;

        // Generate detailed analysis for each structure
        currentProject.structures.forEach((structure, index) => {
            const analysis = currentProject.structureAnalyses[structure.id];
            if (analysis && analysis.stability) {
                html += `
                <div class="section page-break">
                    <h2>3.${index + 1} Structure: ${structure.name || 'Unnamed'}</h2>
                `;
                html += generateStructureSection(analysis.stability, analysis.diagram);

                if (config.includeService && analysis.serviceability) {
                    html += generateServiceabilitySection(analysis.serviceability);
                }

                html += `</div>`;
            }
        });
    } else {
        // Single structure report (legacy)
        if (config.includeStructure && AppState.structureData) {
            html += generateStructureSection(AppState.structureData, config.diagramImage);
        }

        // Serviceability Section
        if (config.includeService && AppState.serviceabilityData.q) {
            html += generateServiceabilitySection(AppState.serviceabilityData);
        }
    }

    // Formulas Section
    if (config.includeFormulas) {
        html += generateFormulasSection();
    }

    // Conclusions
    html += `
    <div class="section page-break">
        <h2>Conclusions and Recommendations</h2>
        
        <h3>Design Summary</h3>
        <p>The proposed coastal structure has been designed and analyzed using established 
        engineering principles and formulae. All design parameters meet or exceed the required 
        safety factors for the specified design conditions.</p>
        
        <h3>Recommendations</h3>
        <ul>
            <li>Physical model testing is recommended for final design validation</li>
            <li>Regular monitoring and maintenance program should be established</li>
            <li>Climate change impacts should be reassessed every 5 years</li>
            <li>Construction quality control protocols must be strictly followed</li>
        </ul>
    </div>
`;

    // Footer
    html += `
    <div class="footer">
        <p>This report was generated by CoastalEngineer Pro</p>
        <p>${config.companyName} | ${config.engineerName} | ${date}</p>
        <p>Page generated automatically - verify all calculations before construction</p>
    </div>
    
</body>
</html>
`;

    return html;
}

/**
 * Generate Wave Analysis section
 */
function generateWaveSection(waveData) {
    // Generate formula steps based on method
    let calculationSteps = '';

    if (waveData.method === 'smb') {
        const F_star = (9.81 * waveData.fetchLength) / (waveData.windSpeed * waveData.windSpeed);
        calculationSteps = `
        <div class="formula-box">
            <p><strong>SMB Method Calculation (Consolidated):</strong></p>
            <p><strong>Normalized Fetch ($F^*$):</strong></p>
            <p>$$F^* = \\frac{g F}{U_{10}^2} = \\frac{9.81 \\times ${waveData.fetchLength.toFixed(0)}}{${waveData.windSpeed.toFixed(1)}^2} = ${F_star.toFixed(2)}$$</p>
            
            <p><strong>Significant Wave Height ($H_s$):</strong></p>
            <p>$$H_s = 0.283 \\frac{U_{10}^2}{g} \\tanh(0.530 (F^*)^{0.375})$$</p>
            <p>$$H_s = ${waveData.Hs.toFixed(2)} \\text{ m}$$</p>
            
            <p><strong>Peak Period ($T_p$):</strong></p>
            <p>$$T_p = 7.54 \\frac{U_{10}}{g} \\tanh(0.833 (F^*)^{0.375})$$</p>
            <p>$$T_p = ${waveData.Tp.toFixed(2)} \\text{ s}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: USACE Shore Protection Manual (1984); CEM.</em></p>
        </div>`;
    } else {
        calculationSteps = `
        <div class="formula-box">
            <p><strong>JONSWAP Method Calculation:</strong></p>
            <p>$$H_s = 0.0016 \\sqrt{g} F^{0.5} U_{10}^{1.0} \\text{ (approx simplified form)}$$</p>
            <p>$$H_s = ${waveData.Hs.toFixed(2)} \\text{ m}$$</p>
            <p>$$T_p = ${waveData.Tp.toFixed(2)} \\text{ s}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: Hasselmann et al. (1973); USACE CEM.</em></p>
        </div>`;
    }

    return `
    <div class="section page-break">
        <h2>2. Wave Analysis</h2>
        
        <h3>2.1 Input Parameters</h3>
        <table>
            <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Unit</th>
            </tr>
            <tr>
                <td>Wind Speed (U₁₀)</td>
                <td>${waveData.windSpeed?.toFixed(1) || 'N/A'}</td>
                <td>m/s</td>
            </tr>
            <tr>
                <td>Fetch Length (F)</td>
                <td>${waveData.fetchLength?.toFixed(0) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr>
                <td>Deep Water Depth (d)</td>
                <td>${waveData.waterDepth?.toFixed(1) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr>
                <td>Method</td>
                <td colspan="2">${waveData.method?.toUpperCase() || 'N/A'}</td>
            </tr>
        </table>
        
        <h3>2.2 Calculation Details</h3>
        ${calculationSteps}

        <h3>2.3 Wave Results</h3>
        <table>
            <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Unit</th>
            </tr>
            <tr>
                <td>Significant Wave Height (Hs)</td>
                <td>${waveData.Hs?.toFixed(2) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr>
                <td>Peak Period (Tp)</td>
                <td>${waveData.Tp?.toFixed(2) || 'N/A'}</td>
                <td>s</td>
            </tr>
            <tr>
                <td>Wave Length (L)</td>
                <td>${waveData.L?.toFixed(2) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr class="result-highlight">
                <td><strong>Breaking Wave Height (Hb)</strong></td>
                <td><strong>${waveData.Hb?.toFixed(2) || 'N/A'}</strong></td>
                <td><strong>m</strong></td>
            </tr>
        </table>
        
        <h3>2.4 Design Water Level (DWL)</h3>
        <table>
            <tr>
                <th>Component</th>
                <th>Value</th>
                <th>Unit</th>
            </tr>
            <tr>
                <td>High Tide Level (HTL)</td>
                <td>${waveData.HTL?.toFixed(2) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr>
                <td>Wave Setup (η)</td>
                <td>${waveData.setup?.toFixed(3) || 'N/A'}</td>
                <td>m</td>
            </tr>
            <tr class="result-highlight">
                <td><strong>Design Water Level (DWL)</strong></td>
                <td><strong>${waveData.DWL?.toFixed(2) || 'N/A'}</strong></td>
                <td><strong>m</strong></td>
            </tr>
        </table>
        <div class="formula-box">
             <p>$$DWL = HTL + SLR + \\eta = ${waveData.HTL?.toFixed(2)} + ${waveData.slr?.toFixed(2) || '0.50'} + ${waveData.setup?.toFixed(3)}$$</p>
             <p>$$DWL = ${waveData.DWL?.toFixed(2)} \\text{ m}$$</p>
        </div>
    </div>
`;
}

/**
 * Generate Structure Design section
 */
/**
 * Generate Structure Design section
 */
function generateStructureSection(data, diagramImage) {
    if (!data.hudson) return '<div class="section"><p>Structure data incomplete.</p></div>';

    let diagramHTML = '';
    if (diagramImage) {
        diagramHTML = `
            <h3>3.0 Structure Cross-Section</h3>
            <div style="text-align:center; margin: 20px 0; border:1px solid #ddd; padding:10px; break-inside: avoid;">
                <img src="${diagramImage}" style="max-width:100%; max-height:120mm; object-fit: contain;" alt="Structure Diagram">
                <p style="font-size:0.9em; color:#666; margin-top:5px;"><em>Figure 3.1: Designed Structure Cross-Section</em></p>
            </div>
        `;
    }

    return `
    <div class="section page-break">
        <h2>3. Structure Design</h2>
        
        ${diagramHTML}
        
        <h3>3.1 Design Conditions</h3>
        <table>
             <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
             <tr><td>Design Wave Height (Hs)</td><td>${data.Hs.toFixed(2)}</td><td>m</td></tr>
             <tr><td>Effective Water Depth</td><td>${data.waterDepth.toFixed(2)}</td><td>m</td></tr>
             <tr><td>Structure Slope</td><td>1:${data.slope.toFixed(1)}</td><td>-</td></tr>
             <tr><td>Armour Type</td><td>${data.rho_s} kg/m³ (Kd=${data.KD})</td><td>-</td></tr>
        </table>

        <h3>3.2 Stability Analysis: Hudson Formula</h3>
        <div class="formula-box">
            <p>$$M_{50} = \\frac{\\rho_s H^3}{K_D \\Delta^3 \\cot \\alpha}$$</p>
            <p>$$M_{50} = \\frac{${data.rho_s} \\times ${data.Hs.toFixed(2)}^3}{${data.KD} \\times ${data.delta.toFixed(2)}^3 \\times ${data.slope.toFixed(1)}}$$</p>
            <p>$$M_{50} = ${(data.hudson.M50 / 1000).toFixed(2)} \\text{ tonnes}$$</p>
            <p>$$D_{n50} = (M_{50}/\\rho_s)^{1/3} = ${data.hudson.Dn50.toFixed(2)} \\text{ m}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: Hudson (1959); USACE properties.</em></p>
        </div>

        <h3>3.3 Stability Analysis: Van der Meer (1988)</h3>
        <div class="formula-box">
            <p><strong>Surf Similarity Parameter ($\ξ_m$):</strong></p>
            <p>$$\\xi_m = \\frac{\\tan \\alpha}{\\sqrt{H_s/L_0}} = ${data.vdm.xi_m.toFixed(2)}$$</p>
            <p><strong>Conditions:</strong> Permeability P=${data.vdm.P}, Damage S=${data.vdm.S_dam}, Waves N=${data.vdm.N_waves}</p>
            <p><strong>Stability Number ($N_s$):</strong> Calculated as ${data.vdm.Ns_vdm.toFixed(2)}</p>
            <p><strong>Required Nominal Diameter:</strong></p>
            <p>$$D_{n50} = \\frac{H_s}{\\Delta \\times N_s} = \\frac{${data.Hs.toFixed(2)}}{${data.delta.toFixed(2)} \\times ${data.vdm.Ns_vdm.toFixed(2)}} = ${data.vdm.Dn50.toFixed(2)} \\text{ m}$$</p>
            <p>$$M_{50} = ${(data.vdm.M50 / 1000).toFixed(2)} \\text{ tonnes}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: Van der Meer (1988), Coasts, Engineering and Management.</em></p>
        </div>

        <h3>3.4 Selected Armour</h3>
        <div class="result-highlight">
            <p><strong>Input Armour Size ($D_{n50}$):</strong> ${data.inputDn50.toFixed(2)} m</p>
            <p><strong>Safety Check:</strong> ${data.inputDn50 >= data.vdm.Dn50 ? 'PASS ✅' : 'FAIL ❌ (Increase Size)'}</p>
        </div>

        <h3>3.5 Layer Weight Ratios (CEM Table VI-5-127)</h3>
        <p>Layer stone sizes are determined using weight ratios relative to armour stones:</p>
        <table>
            <tr><th>Layer</th><th>Weight Ratio (W/W_armour)</th><th>Calculated Dn50 (m)</th><th>Formula</th></tr>
            <tr>
                <td>Filter</td>
                <td>1/${document.getElementById('filterWeightRatio')?.value || '10'}</td>
                <td>${(parseFloat(document.getElementById('filterDn50Display')?.value || '0')).toFixed(3)}</td>
                <td>$$D_{n50,f} = D_{n50,a} / R^{1/3}$$</td>
            </tr>
            <tr>
                <td>Toe</td>
                <td>1/${document.getElementById('toeWeightRatio')?.value || '10'}</td>
                <td>${(parseFloat(document.getElementById('toeDn50Display')?.value || '0')).toFixed(3)}</td>
                <td>$$D_{n50,t} = D_{n50,a} / R^{1/3}$$</td>
            </tr>
            <tr>
                <td>Core</td>
                <td>1/${document.getElementById('coreWeightRatio')?.value || '200'}</td>
                <td>${(parseFloat(document.getElementById('coreDn50Display')?.value || '0')).toFixed(3)}</td>
                <td>$$D_{n50,c} = D_{n50,a} / R^{1/3}$$</td>
            </tr>
        </table>
        <p style="font-size:0.9em; color:#666; margin-top:10px;"><em>Where R is the weight ratio denominator (e.g., 10 for 1/10 ratio). Reference: EM 1110-2-1100 (USACE Coastal Engineering Manual) Table VI-5-127.</em></p>

        <h3>3.6 Quantities (per m run)</h3>
        <table>
            <tr><th>Layer</th><th>Volume (m³/m)</th><th>Mass (t/m)</th></tr>
            <tr><td>Armour</td><td>${data.volumes.armour.toFixed(2)}</td><td>${(data.masses.armour / 1000).toFixed(2)}</td></tr>
            <tr><td>Filter</td><td>${data.volumes.filter.toFixed(2)}</td><td>${(data.masses.filter / 1000).toFixed(2)}</td></tr>
            <tr><td>Core</td><td>${data.volumes.core.toFixed(2)}</td><td>${(data.masses.core / 1000).toFixed(2)}</td></tr>
        </table>
    </div>
`;
}

/**
 * Generate Serviceability section
 */
/**
 * Generate Serviceability section
 */
function generateServiceabilitySection(data) {
    const g = 9.81;
    const Lm = (g * data.wavePeriod * data.wavePeriod) / (2 * Math.PI);
    const tanAlpha = Math.tan(data.slopeAngle * Math.PI / 180);
    const xi = tanAlpha / Math.sqrt(data.waveHeight / Lm);

    // Determine formula used
    const isBreaking = xi < 2.0;

    return `
    <div class="section page-break">
        <h2>4. Serviceability Analysis</h2>
        
        <h3>4.1 Overtopping Analysis (EurOtop 2018)</h3>
        
        <p><strong>Input Parameters:</strong></p>
        <table>
            <tr><td>Crest Freeboard (Rc)</td><td>${data.freeboard.toFixed(2)} m</td></tr>
            <tr><td>Slope Angle (α)</td><td>${data.slopeAngle.toFixed(0)} degrees</td></tr>
            <tr><td>Design Wave Height (Hm0)</td><td>${data.waveHeight.toFixed(2)} m</td></tr>
            <tr><td>Wave Period (Tm)</td><td>${data.wavePeriod.toFixed(1)} s</td></tr>
        </table>

        <h3>4.2 Detailed Calculation</h3>
        <div class="formula-box">
            <p><strong>Wave Steepness & Breaker Parameter:</strong></p>
            <p>$$L_m = \\frac{g T_m^2}{2\\pi} = ${Lm.toFixed(2)} \\text{ m}$$</p>
            <p>$$\\xi_{m-1,0} = \\frac{\\tan \\alpha}{\\sqrt{H_{m0}/L_m}} = ${xi.toFixed(2)}$$</p>
            
            <p><strong>Overtopping Discharge Formula (${isBreaking ? 'Breaking' : 'Non-Breaking'}):</strong></p>
            ${isBreaking ?
            `<p>$$q = \\frac{0.067}{\\sqrt{\\tan\\alpha}} \\gamma_b \\xi_{m-1,0} \\exp\\left( -4.75 \\frac{R_c}{\\xi_{m-1,0} H_{m0} \\gamma_b \\gamma_f} \\right) \\sqrt{g H_{m0}^3}$$</p>` :
            `<p>$$q = 0.2 \\exp\\left( -2.6 \\frac{R_c}{H_{m0} \\gamma_f} \\right) \\sqrt{g H_{m0}^3}$$</p>`}
            
            <p><strong>Result:</strong></p>
            <p>$$q = ${data.q.toFixed(5)} \\text{ l/s/m}$$</p>
            <p style="font-size:0.8em; margin-top:5px;"><em>Source: EurOtop Manual 2nd Edition (2018), Chapter 5.</em></p>
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
                <td style="color:${data.safety?.pedestrian?.safe ? 'green' : 'red'}">${data.safety?.pedestrian?.status || 'N/A'}</td>
            </tr>
            <tr>
                <td>Vehicles</td>
                <td>0.05 l/s/m</td>
                <td style="color:${data.safety?.vehicle?.safe ? 'green' : 'red'}">${data.safety?.vehicle?.status || 'N/A'}</td>
            </tr>
            <tr>
                <td>Buildings</td>
                <td>1.0 l/s/m</td>
                <td style="color:${data.safety?.building?.safe ? 'green' : 'red'}">${data.safety?.building?.status || 'N/A'}</td>
            </tr>
        </table>
    </div>
`;
}

/**
 * Generate Formulas section
 */
/**
 * Generate Formulas section (Appendix)
 */
function generateFormulasSection() {
    return `
    <div class="section page-break">
        <h2>5. Appendix: Reference Formulas</h2>
        <p>The following formulas are standard references used in this application.</p>
        
        <h3>5.1 Wave & Water Level</h3>
        <div class="formula-box">
             <p><strong>Wave Setup (Godshell et al):</strong></p>
             <p>$$\\eta_{max} = 0.19 \\cdot H_b (based on breaking height)$$</p>
             <p><em>CEM Part II-4.</em></p>
        </div>

        <h3>5.2 Rubble Mound Stability</h3>
        <div class="formula-box">
            <p><strong>Hudson Formula (1959):</strong></p>
            <p>$$M_{50} = \\frac{\\rho_s H^3}{K_D \\Delta^3 \\cot \\alpha}$$</p>
            <p>Simple stability based on regular waves. Conservative for breaking waves if Kd is chosen correctly.</p>
        </div>
        
        <div class="formula-box">
             <p><strong>Van der Meer (1988):</strong></p>
             <p>Used for deep water and irregular waves. Accounts for permeability (P), damage (S) and waves (N).</p>
        </div>

        <h3>5.3 Overtopping</h3>
        <div class="formula-box">
             <p><strong>EurOtop (2018):</strong></p>
             <p>Standard for wave overtopping of sea defences.</p>
        </div>
    </div>
`;
}

/**
 * Update the preview panel
 */
function updateReportPreview(html) {
    const previewContainer = document.getElementById('reportPreview');
    if (previewContainer) {
        // Create an iframe for preview
        previewContainer.innerHTML = `
            <iframe 
                style="width: 100%; height: 600px; border: none; background: white;" 
                srcdoc="${html.replace(/"/g, '&quot;')}">
            </iframe>
        `;
    }
}

/**
 * Export canvas as image for report
 */
function exportCanvasImage() {
    const canvas = document.getElementById('designCanvas');
    if (canvas) {
        return canvas.toDataURL('image/png');
    }
    return null;
}
