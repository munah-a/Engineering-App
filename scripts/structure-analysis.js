// ==========================================
// STRUCTURE ANALYSIS WRAPPER FUNCTIONS
// ==========================================
// These functions gather parameters from UI and call structure-specific calculations

// Helper to create pass/fail badges
const getStatusBadge = (passed, label = '') => {
    const color = passed ? 'var(--success-color)' : 'var(--error-color)';
    const icon = passed ? '✓' : '✗';
    const text = passed ? 'PASS' : 'FAIL';
    return `<span style="display:inline-block; background:${color}20; color:${color}; padding: 2px 8px; border-radius:12px; font-weight:600; font-size:0.85em; border:1px solid ${color}40;">${icon} ${text} ${label}</span>`;
};

// Helper for section styling
const sectionStyle = 'background:var(--surface-2); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);';

function performRevetmentAnalysis(resultsDiv) {
    const params = {
        armourDn50: parseFloat(document.getElementById('armourDn50')?.value || 0.8),
        matDensity: parseFloat(document.getElementById('matDensity')?.value || 2650),
        slopeLeft: parseFloat(document.getElementById('slopeLeft')?.value || 2.5),
        permeability: parseFloat(document.getElementById('permeability')?.value || 0.5),
        damageLevel: parseFloat(document.getElementById('damageLevel')?.value || 2.0),
        stormWaves: parseFloat(document.getElementById('stormWaves')?.value || 3000),
        waveHeight: GlobalParams?.getEffectiveValue(null, 'waveHeight') || 2.5,
        wavePeriod: GlobalParams?.getEffectiveValue(null, 'wavePeriod') || 8.0,
        depth: parseFloat(document.getElementById('depth')?.value || 2.0),
        crestHeight: parseFloat(document.getElementById('crestHeight')?.value || 3.5)
    };

    const stability = calculateRevetmentStability(params);
    const runup = calculateRevetmentRunup(params);

    // Add Overtopping Calculation
    const alpha_deg = Math.atan(1 / params.slopeLeft) * 180 / Math.PI;
    const hasBullnose = document.getElementById('hasBullnose')?.checked || false;
    const bullnoseFactor = parseFloat(document.getElementById('bullnoseFactor')?.value || 0.7);
    const gamma_v = hasBullnose ? bullnoseFactor : 1.0;

    // Rc = Crest Height - (Depth defined at toe? No, usually Crest Elev relative to SWL)
    // params.crestHeight is usually absolute elevation? In templates it says "Crest Elevation".
    // Water Depth at Toe is params.depth.
    // If Crest Elevation is e.g. +3.5m and SWL is 0 (implied, usually reference datum), then Rc = crestHeight.
    // Let's assume params.crestHeight is Rc (Freeboard) if we consider SWL=0.
    // However, usually we might have specific Water Level.
    // For now, let's treat crestHeight as Rc (Freeboard) or check if we need to subtract SWL.
    // Looking at other functions (LowCrested), crestHeight is mapped to Rc directly.
    const q_overtop = calculateEurOtopOvertopping(params.crestHeight, params.waveHeight, params.wavePeriod, alpha_deg, 0.55, gamma_v);

    let warningsHtml = '';
    if (stability.warnings && stability.warnings.length > 0) {
        warningsHtml = `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                <h4 style="color: #856404; margin-top: 0; display:flex; align-items:center; gap:8px;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="#856404"><path d="M8 1L0 15h16L8 1zm0 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-7a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V6a1 1 0 0 1 1-1z"/></svg> 
                    Design Warnings
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    ${stability.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    resultsDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <h3 style="margin:0;">Revetment Analysis</h3>
            <span style="font-size:0.9em; color:var(--topography-500);">EurOtop 2018</span>
        </div>

        ${warningsHtml}
        
        <div style="${sectionStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0; color:var(--primary-color);">Van der Meer Stability</h4>
                ${getStatusBadge(stability.passed)}
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; font-size:0.95em;">
                <div>
                    <div style="color:var(--topography-600); font-size:0.9em;">Wave Condition</div>
                    <div style="font-weight:600;">${stability.waveCondition}</div>
                    <div style="font-size:0.85em; color:var(--topography-500);">
                        $\\xi_m = ${stability.xi_m.toFixed(2)}$ <br>
                        $\\xi_{crit} = ${stability.xi_critical}$
                    </div>
                </div>
                
                <div style="text-align:right;">
                    <div style="color:var(--topography-600); font-size:0.9em;">Stability Ratio</div>
                    <div style="font-weight:600; font-size:1.1em;">${stability.stabilityRatio.toFixed(2)}</div>
                    <div style="font-size:0.85em; color:var(--topography-500);">Target $\\ge 1.0$</div>
                </div>
                
                <div style="grid-column: 1 / -1; border-top:1px dashed var(--border-color); padding-top:10px; margin-top:5px;">
                     <div style="display:flex; justify-content:space-between;">
                        <span>Required $H_s^{stable}$:</span>
                        <strong>${stability.Hs_stable.toFixed(2)} m</strong>
                     </div>
                     <div style="font-size:0.85em; color:var(--topography-500); margin-top:5px;">
                        Formula: $${stability.formula}$
                     </div>
                </div>
            </div>
        </div>

        <div style="${sectionStyle}">
            <h4 style="margin:0 0 10px 0; color:var(--accent-color);">Hydraulic Performance</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div style="background:var(--surface-1); padding:10px; border-radius:6px; text-align:center;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Run-up ($R_{u2\\%}$)</div>
                    <div style="font-size:1.2em; font-weight:bold; color:var(--primary-color);">${runup.Ru2.toFixed(2)} m</div>
                </div>
                <div style="background:var(--surface-1); padding:10px; border-radius:6px; text-align:center;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Overtopping ($q$)</div>
                    <div style="font-size:1.2em; font-weight:bold; color:var(--accent-color);">${q_overtop.toFixed(2)}</div>
                    <div style="font-size:0.8em;">l/s/m</div>
                </div>
            </div>
        </div>
    `;

    // --- BULLNOSE STABILITY ---
    if (hasBullnose) {
        const bnParams = {
            bullnoseWidth: parseFloat(document.getElementById('bullnoseWidth')?.value || 1.0),
            bullnoseHeight: parseFloat(document.getElementById('bullnoseHeight')?.value || 1.2),
            bullnoseDensity: 2400,
            frictionCoeff: 0.6,
            waveHeight: params.waveHeight,
            wavePeriod: params.wavePeriod,
            crestFreeboard: params.crestHeight
        };
        const bnStab = calculateBullnoseStability(bnParams);

        resultsDiv.innerHTML += `
        <div style="${sectionStyle} border-left: 4px solid var(--secondary-color);">
            <h4 style="margin:0 0 10px 0; display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.2em;">🧱</span> Bullnose Stability
            </h4>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; font-size:0.9em;">
                <div>
                    <div><strong>Forces:</strong></div>
                    <div>Weight: ${bnStab.weight.toFixed(1)} kN/m</div>
                    <div>Wave Load ($F_h$): ${bnStab.forces.F_h.toFixed(1)} kN/m</div>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>Sliding:</span>
                        ${getStatusBadge(bnStab.sliding.passed, bnStab.sliding.FS.toFixed(2))}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>Overturn:</span>
                        ${getStatusBadge(bnStab.overturning.passed, bnStab.overturning.FS.toFixed(2))}
                    </div>
                </div>
            </div>
            <div style="margin-top:8px; font-size:0.75em; color:var(--topography-500); font-style:italic;">
                ${bnStab.note}
            </div>
        </div>
        `;
    }

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
        });
    }
}

function performBermAnalysis(resultsDiv) {
    const params = {
        armourDn50: parseFloat(document.getElementById('armourDn50')?.value || 1.5),
        matDensity: parseFloat(document.getElementById('matDensity')?.value || 2650),
        slopeLeft: parseFloat(document.getElementById('slopeLeft')?.value || 1.5),
        bermWidth: parseFloat(document.getElementById('bermWidth')?.value || 15.0),
        bermElevation: parseFloat(document.getElementById('bermElevation')?.value || 2.0),
        recession: parseFloat(document.getElementById('recession')?.value || 5.0),
        permeability: parseFloat(document.getElementById('permeability')?.value || 0.4),
        damageLevel: parseFloat(document.getElementById('damageLevel')?.value || 0.5),
        waveHeight: GlobalParams?.getEffectiveValue(null, 'waveHeight') || 3.0,
        depth: parseFloat(document.getElementById('depth')?.value || 5.0)
    };

    const result = calculateBermStability(params);

    resultsDiv.innerHTML = `
        <h3 style="margin-bottom:15px;">Berm Breakwater Analysis</h3>
        
        <div style="${sectionStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0;">Reshaping Stability</h4>
                ${getStatusBadge(result.passed)}
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div>
                    <div style="font-size:0.9em; color:var(--topography-600);">Stability Number $N_s$</div>
                    <div style="font-weight:bold; font-size:1.1em;">${result.Ns.toFixed(2)}</div>
                    <div style="font-size:0.8em; color:var(--topography-500);">Allowed: ${result.Ns_allowed.toFixed(2)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.9em; color:var(--topography-600);">Exp. Recession</div>
                    <div style="font-weight:bold; font-size:1.1em;">~${result.recession_expected.toFixed(1)} m</div>
                </div>
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color); font-size:0.85em;">
                Formula: $${result.formula}$
            </div>
        </div>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
        });
    }
}



function performLowCrestedAnalysis(resultsDiv) {
    const params = {
        crestHeight: parseFloat(document.getElementById('crestHeight')?.value || 1.5),
        crestWidth: parseFloat(document.getElementById('crestWidth')?.value || 5.0),
        waveHeight: GlobalParams?.getEffectiveValue(null, 'waveHeight') || 2.5,
        wavePeriod: GlobalParams?.getEffectiveValue(null, 'wavePeriod') || 8.0,
        slopeLeft: parseFloat(document.getElementById('slopeLeft')?.value || 1.5),
        slopeRight: parseFloat(document.getElementById('slopeRight')?.value || 2.0),
        depth: parseFloat(document.getElementById('depth')?.value || 3.5),
        hasBullnose: document.getElementById('hasBullnose')?.checked || false,
        bullnoseFactor: parseFloat(document.getElementById('bullnoseFactor')?.value || 0.7)
    };

    const result = calculateLowCrestedPerformance(params);

    resultsDiv.innerHTML = `
        <h3 style="margin-bottom:15px;">Low-Crested Analysis</h3>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div style="${sectionStyle}">
                <h4 style="margin-top:0; color:var(--accent-color);">Overtopping</h4>
                <div style="font-size:1.5em; font-weight:bold;">${result.overtopping.q.toFixed(2)} <span style="font-size:0.6em; font-weight:normal;">l/s/m</span></div>
                <div style="font-size:0.8em; margin-top:5px; color:var(--topography-500);">Discharge Rate</div>
            </div>
            
            <div style="${sectionStyle}">
                <h4 style="margin-top:0; color:var(--primary-color);">Transmission</h4>
                <div style="font-size:1.5em; font-weight:bold;">${result.transmission.Kt.toFixed(2)}</div>
                <div style="font-size:0.8em; margin-top:5px; color:var(--topography-500);">Coeff ($K_t$)</div>
                <div style="margin-top:5px; font-weight:600;">$H_t$: ${result.transmission.Ht.toFixed(2)} m</div>
            </div>
        </div>
        
        <p style="text-align:center; font-style:italic; color:var(--topography-500); font-size:0.9em;">${result.note}</p>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}

function performVerticalWallAnalysis(resultsDiv) {
    const params = {
        wallHeight: parseFloat(document.getElementById('wallHeight')?.value || 12.0),
        foundationWidth: parseFloat(document.getElementById('foundationWidth')?.value || 10.0),
        wallThickness: parseFloat(document.getElementById('wallThickness')?.value || 3.0),
        depth: parseFloat(document.getElementById('depth')?.value || 10.0),
        waveHeight: parseFloat(document.getElementById('waveHeight')?.value || 4.0),
        wavePeriod: parseFloat(document.getElementById('wavePeriod')?.value || 10.0),
        waveAngle: parseFloat(document.getElementById('waveAngle')?.value || 0),
        concreteDensity: parseFloat(document.getElementById('concreteDensity')?.value || 2400),
        fillDensity: parseFloat(document.getElementById('fillDensity')?.value || 1800),
        frictionCoeff: parseFloat(document.getElementById('frictionCoeff')?.value || 0.6)
    };

    const forces = calculateVerticalWallForces(params);
    const stability = checkVerticalWallStability({ ...params, ...forces.forces });

    const warningsHtml = (forces.warnings && forces.warnings.length > 0) ? `
        <div style="background: #fff3cd; color:#856404; padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size:0.9em;">
             <strong>⚠️ Warnings:</strong> ${forces.warnings.join(', ')}
        </div>` : '';

    resultsDiv.innerHTML = `
        <h3 style="margin-bottom:15px;">Vertical Wall (Goda)</h3>
        ${warningsHtml}
        
        <div style="${sectionStyle}">
            <h4 style="margin:0 0 10px 0;">Calculated Wave Parameters</h4>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; font-size:0.9em; text-align:center;">
                <div>
                    <div>$L_{local}$</div>
                    <strong>${forces.waveParams.L} m</strong>
                </div>
                <div>
                    <div>$\\eta^*$</div>
                    <strong>${forces.waveParams.eta_star} m</strong>
                </div>
                <div>
                    <div>Rel. Depth</div>
                    <strong>${forces.waveParams.d_over_L}</strong>
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div style="${sectionStyle}">
                <h4 style="margin-top:0;">Forces</h4>
                <ul style="padding-left:15px; margin:0; font-size:0.9em;">
                    <li>$p_1$: ${forces.forces.p1.toFixed(1)} kPa</li>
                    <li>$p_3$: ${forces.forces.p3.toFixed(1)} kPa</li>
                    <li style="margin-top:5px;"><strong>$F_h$: ${forces.forces.F_h.toFixed(1)} kN/m</strong></li>
                    <li>$F_{uplift}$: ${forces.forces.F_uplift.toFixed(1)} kN/m</li>
                </ul>
            </div>
            
            <div style="${sectionStyle}">
                <h4 style="margin-top:0;">Stability</h4>
                <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Sliding</span>
                    ${getStatusBadge(stability.sliding.passed, stability.sliding.FS.toFixed(2))}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Overturning</span>
                    ${getStatusBadge(stability.overturning.passed, stability.overturning.FS.toFixed(2))}
                </div>
                <div style="margin-top:10px; font-size:0.8em; color:var(--topography-500);">
                    Weight: ${stability.weight.toFixed(1)} kN/m
                </div>
            </div>
        </div>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}

function performCompositeAnalysis(resultsDiv) {
    const params = {
        moundHeight: parseFloat(document.getElementById('moundHeight')?.value || 6.0),
        moundWidth: parseFloat(document.getElementById('moundWidth')?.value || 8.0),
        moundSlope: parseFloat(document.getElementById('moundSlope')?.value || 1.5),
        armourDn50: parseFloat(document.getElementById('armourDn50')?.value || 1.5),
        matDensity: parseFloat(document.getElementById('matDensity')?.value || 2650),
        wallHeight: parseFloat(document.getElementById('wallHeight')?.value || 9.0),
        wallThickness: parseFloat(document.getElementById('wallThickness')?.value || 2.5),
        concreteDensity: parseFloat(document.getElementById('concreteDensity')?.value || 2400),
        waveHeight: parseFloat(document.getElementById('waveHeight')?.value || 4.5),
        wavePeriod: parseFloat(document.getElementById('wavePeriod')?.value || 10.0),
        depth: parseFloat(document.getElementById('depth')?.value || 10.0)
    };

    const result = calculateCompositeStructure(params);

    resultsDiv.innerHTML = `
        <h3>Composite Structure Analysis</h3>
        
        <div class="result-section">
            <h4>Rubble Mound Base</h4>
            <p><strong>Status:</strong> ${result.mound.stable ? '✓ STABLE' : '✗ UNSTABLE'}</p>
            <p><strong>Required Weight:</strong> ${result.mound.W_required.toFixed(2)} tonnes</p>
            <p><strong>Provided Weight:</strong> ${result.mound.W_provided.toFixed(2)} tonnes</p>
            <p><strong>Formula:</strong> $${result.mound.formula}$</p>
            <p><small>${result.mound.reference}</small></p>
        </div>

        <div class="result-section">
            <h4>Vertical Wall</h4>
            <p><strong>Horizontal Force:</strong> ${result.wall.F_h.toFixed(2)} kN/m</p>
            <p><strong>Sliding FS:</strong> ${result.wall.FS_slide.toFixed(2)} ${result.wall.stable ? '✓ PASS' : '✗ FAIL'}</p>
            <p><strong>Formula:</strong> ${result.wall.formula}</p>
            <p><small>${result.wall.reference}</small></p>
        </div>

        <p><em>${result.note}</em></p>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}

function performCaissonAnalysis(resultsDiv) {
    const params = {
        caissonWidth: parseFloat(document.getElementById('caissonWidth')?.value || 12.0),
        caissonHeight: parseFloat(document.getElementById('caissonHeight')?.value || 15.0),
        wallThickness: parseFloat(document.getElementById('wallThickness')?.value || 0.5),
        cellCount: parseInt(document.getElementById('cellCount')?.value || 3),
        foundationHeight: parseFloat(document.getElementById('foundationHeight')?.value || 2.0),
        concreteDensity: parseFloat(document.getElementById('concreteDensity')?.value || 2400),
        fillDensity: parseFloat(document.getElementById('fillDensity')?.value || 1900),
        frictionCoeff: parseFloat(document.getElementById('frictionCoeff')?.value || 0.6),
        waveHeight: parseFloat(document.getElementById('waveHeight')?.value || 5.0),
        wavePeriod: parseFloat(document.getElementById('wavePeriod')?.value || 11.0),
        depth: parseFloat(document.getElementById('depth')?.value || 12.0)
    };

    const result = calculateCaissonStability(params);

    resultsDiv.innerHTML = `
        <h3>Caisson Analysis</h3>
        
        <div class="result-section">
            <h4>Stability Checks</h4>
            <p><strong>Sliding FS:</strong> ${result.sliding.FS.toFixed(2)} ${result.sliding.passed ? '✓ PASS' : '✗ FAIL'} (Required: ${result.sliding.required})</p>
            <p><strong>Overturning FS:</strong> ${result.overturning.FS.toFixed(2)} ${result.overturning.passed ? '✓ PASS' : '✗ FAIL'} (Required: ${result.overturning.required})</p>
            <p><strong>Bearing Pressure:</strong> ${result.bearing.pressure.toFixed(2)} kPa</p>
            <p><strong>Bearing FS:</strong> ${result.bearing.FS.toFixed(2)} ${result.bearing.passed ? '✓ PASS' : '✗ FAIL'} (Required: ${result.bearing.required})</p>
            <p><strong>Caisson Weight:</strong> ${result.weight.toFixed(2)} kN/m</p>
            <p><small>${result.reference}</small></p>
        </div>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}

function performPerforatedAnalysis(resultsDiv) {
    const params = {
        perforationRatio: parseFloat(document.getElementById('perforationRatio')?.value || 25),
        chamberWidth: parseFloat(document.getElementById('chamberWidth')?.value || 2.0),
        wallHeight: parseFloat(document.getElementById('wallHeight')?.value || 12.0),
        waveHeight: parseFloat(document.getElementById('waveHeight')?.value || 4.0),
        wavePeriod: parseFloat(document.getElementById('wavePeriod')?.value || 10.0),
        depth: parseFloat(document.getElementById('depth')?.value || 10.0),
        reflectionCoeff: parseFloat(document.getElementById('reflectionCoeff')?.value || 0.4)
    };

    const result = calculatePerforatedWall(params);

    resultsDiv.innerHTML = `
        <h3>Perforated Wall Analysis</h3>
        
        <div class="result-section">
            <h4>Wave Reflection</h4>
            <p><strong>Reflection Coefficient (Kr):</strong> ${result.reflection.Kr.toFixed(2)}</p>
            <p><strong>Energy Dissipation:</strong> ${result.reflection.energy_dissipation.toFixed(1)}%</p>
            <p><strong>Formula:</strong> $${result.reflection.formula}$</p>
            <p><small>${result.reflection.reference}</small></p>
        </div>

        <div class="result-section">
            <h4>Wave Forces</h4>
            <p><strong>Perforated Wall Force:</strong> ${result.forces.F_perforated.toFixed(2)} kN/m</p>
            <p><strong>Force Reduction:</strong> ${result.forces.reduction.toFixed(1)}%</p>
            <p><strong>Formula:</strong> $${result.forces.formula}$</p>
            <p><small>${result.forces.reference}</small></p>
        </div>

        <p><em>${result.note}</em></p>
    `;

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}
