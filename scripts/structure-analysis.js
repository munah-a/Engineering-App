// ==========================================
// STRUCTURE ANALYSIS WRAPPER FUNCTIONS
// ==========================================
// These functions gather parameters from UI and call structure-specific calculations

// Helper to create pass/fail badges
const getStatusBadge = (passed, label = '') => {
    const fg = passed ? 'var(--color-success, #2E7D32)' : 'var(--color-danger, #BA1A1A)';
    const bg = passed ? 'rgba(46, 125, 50, 0.14)' : 'rgba(186, 26, 26, 0.14)';
    const bd = passed ? 'rgba(46, 125, 50, 0.35)' : 'rgba(186, 26, 26, 0.35)';
    const icon = passed ? '✓' : '✗';
    const text = passed ? 'PASS' : 'FAIL';
    const labelText = label ? ` (${label})` : '';
    return `<span style="display:inline-block; background:${bg}; color:${fg}; padding: 2px 8px; border-radius:12px; font-weight:600; font-size:0.85em; border:1px solid ${bd};">${icon} ${text}${labelText}</span>`;
};

// Helper for section styling
const sectionStyle = 'background:var(--surface-2); padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color);';

const _val = (key, fallback) => (typeof getDesignValue === 'function' ? getDesignValue(key, fallback) : fallback);

const _waveParam = (key, fallback) => {
    if (typeof getDesignInput === 'function' && getDesignInput(key)) {
        return getDesignValue(key, fallback);
    }
    const gVal = typeof GlobalParams !== 'undefined' ? GlobalParams.getEffectiveValue('structure-designer', key) : null;
    return (gVal !== null && gVal !== undefined && Number.isFinite(Number(gVal))) ? Number(gVal) : fallback;
};

function _saveAnalysisState(templateType, payload) {
    if (typeof AppState !== 'undefined') {
        AppState.structureData = {
            template: templateType,
            type: templateType,
            ...payload
        };
    }

    if (typeof window !== 'undefined' && window.projectManager && window.projectManager.getCurrentProject()) {
        const currentProject = window.projectManager.getCurrentProject();
        const structureId = currentProject.structures.length > 0
            ? currentProject.structures[currentProject.structures.length - 1].id
            : 'default_structure';

        window.projectManager.saveStructureAnalysisToCurrentProject(structureId, {
            stability: typeof AppState !== 'undefined' ? AppState.structureData : payload,
            serviceability: typeof AppState !== 'undefined' ? AppState.serviceabilityData : {},
            diagram: typeof exportCanvasImage === 'function' ? exportCanvasImage() : null
        }).catch(err => console.error('Failed to save structure analysis to project:', err));
    }
}

function _updateSecondaryTabs(materialsHTML, layersHTML) {
    if (typeof document === 'undefined') return;
    const materialsInfo = document.getElementById('materialsInfo');
    const layersInfo = document.getElementById('layersInfo');
    if (materialsInfo && materialsHTML) materialsInfo.innerHTML = materialsHTML;
    if (layersInfo && layersHTML) layersInfo.innerHTML = layersHTML;
}

function performRevetmentAnalysis(resultsDiv) {
    const params = {
        armourDn50: _val('armourDn50', 0.8),
        matDensity: _val('matDensity', 2650),
        matKd: _val('matKd', 2.0),
        slopeLeft: _val('slopeLeft', 2.5),
        permeability: _val('permeability', 0.5),
        damageLevel: _val('damageLevel', 2.0),
        stormWaves: _val('stormWaves', 3000),
        waveHeight: _waveParam('waveHeight', 2.5),
        wavePeriod: _waveParam('wavePeriod', 8.0),
        depth: _val('depth', 2.0),
        crestHeight: _val('crestHeight', 3.5),
        crestWidth: _val('crestWidthDisplay', _val('crestWidthMultiplier', 3) * _val('armourDn50', 0.8))
    };

    const stability = calculateRevetmentStability(params);
    const runup = calculateRevetmentRunup(params);

    const alpha_deg = (Math.atan(1 / Math.max(0.1, params.slopeLeft)) * 180) / Math.PI;
    const hasBullnose = Boolean(_val('hasBullnose', false));
    const bullnoseFactor = _val('bullnoseFactor', 0.7);
    const gamma_v = hasBullnose ? bullnoseFactor : 1.0;

    const otRes = calculateEurOtopOvertopping(
        params.waveHeight,
        params.wavePeriod,
        params.crestHeight,
        alpha_deg,
        0.55,
        1.0,
        1.0,
        gamma_v,
        params.crestWidth
    );
    const q_overtop = otRes.q_l_s_m;

    let warningsHtml = '';
    if (stability.warnings && stability.warnings.length > 0) {
        warningsHtml = `
            <div style="background: rgba(245, 124, 0, 0.14); border-left: 4px solid var(--color-warning); padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                <h4 style="color: var(--color-warning); margin-top: 0;">Design Warnings</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${stability.warnings.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <h3 style="margin:0;">Revetment Analysis</h3>
            <span style="font-size:0.9em; color:var(--topography-500);">Van der Meer &amp; EurOtop 2018</span>
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
                        <span>Stable Design $H_s$:</span>
                        <strong>${stability.Hs_stable.toFixed(2)} m</strong>
                     </div>
                     <div style="font-size:0.85em; color:var(--topography-500); margin-top:5px;">
                        Formula: $${stability.formula}$
                     </div>
                </div>
            </div>
        </div>

        <div style="${sectionStyle}">
            <h4 style="margin:0 0 10px 0; color:var(--accent-color);">Hydraulic Performance (EurOtop 2018)</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div style="background:var(--surface-1); padding:10px; border-radius:6px; text-align:center;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Run-up ($R_{u2\\%}$)</div>
                    <div style="font-size:1.2em; font-weight:bold; color:var(--primary-color);">${runup.Ru2.toFixed(2)} m</div>
                </div>
                <div style="background:var(--surface-1); padding:10px; border-radius:6px; text-align:center;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Overtopping ($q$)</div>
                    <div style="font-size:1.2em; font-weight:bold; color:var(--accent-color);">${q_overtop.toFixed(2)}</div>
                    <div style="font-size:0.8em;">l/s/m (${otRes.regime})</div>
                </div>
            </div>
        </div>
    `;

    let bnStab = null;
    if (hasBullnose) {
        bnStab = calculateBullnoseStability({
            bullnoseWidth: _val('bullnoseWidth', 1.0),
            bullnoseHeight: _val('bullnoseHeight', 1.2),
            bullnoseDensity: 2400,
            frictionCoeff: 0.6,
            waveHeight: params.waveHeight,
            wavePeriod: params.wavePeriod,
            crestFreeboard: params.crestHeight
        });

        html += `
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

    resultsDiv.innerHTML = html;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Armour $D_{n50}$</td><td>${params.armourDn50.toFixed(2)} m</td></tr>
         <tr><td>Rock Density</td><td>${params.matDensity} kg/m³</td></tr>
         <tr><td>Slope</td><td>1:${params.slopeLeft.toFixed(1)}</td></tr></table>`,
        `<table class="data-table"><tr><th>Layer</th><th>Thickness</th></tr>
         <tr><td>Armour (${_val('armourLayers', 2)} layers)</td><td>${(_val('armourLayers', 2) * params.armourDn50).toFixed(2)} m</td></tr>
         <tr><td>Filter</td><td>${(_val('filterLayers', 2) * (params.armourDn50 / Math.cbrt(_val('filterWeightRatio', 10)))).toFixed(2)} m</td></tr></table>`
    );

    _saveAnalysisState('rubble-revetment', {
        params,
        stability,
        runup,
        overtopping: otRes,
        q_overtop,
        bullnose: bnStab,
        summary: { passed: stability.passed, ratio: stability.stabilityRatio }
    });

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
        });
    }
}

function performBermAnalysis(resultsDiv) {
    const params = {
        armourDn50: _val('armourDn50', 1.5),
        matDensity: _val('matDensity', 2650),
        slopeLeft: _val('slopeLeft', 1.5),
        bermWidth: _val('bermWidth', 15.0),
        bermElevation: _val('bermElevation', 2.0),
        recession: _val('recession', 5.0),
        permeability: _val('permeability', 0.4),
        damageLevel: _val('damageLevel', 0.5),
        waveHeight: _waveParam('waveHeight', 3.0),
        depth: _val('depth', 5.0)
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
                    <div style="font-size:0.9em; color:var(--topography-600);">Stability Number $H_0$ ($N_s$)</div>
                    <div style="font-weight:bold; font-size:1.1em;">${result.Ns.toFixed(2)}</div>
                    <div style="font-size:0.8em; color:var(--topography-500);">Threshold: ${result.Ns_allowed.toFixed(2)}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.9em; color:var(--topography-600);">Exp. Recession ($R_{ec}$)</div>
                    <div style="font-weight:bold; font-size:1.1em;">${result.recession_expected.toFixed(1)} m</div>
                    <div style="font-size:0.8em; color:var(--topography-500);">Allowed: ${params.recession.toFixed(1)} m</div>
                </div>
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color); font-size:0.85em;">
                Formula: $${result.formula}$
                <div style="color:var(--topography-500); margin-top:4px;">${result.note}</div>
            </div>
        </div>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Armour $D_{n50}$</td><td>${params.armourDn50.toFixed(2)} m</td></tr>
         <tr><td>Rock Density</td><td>${params.matDensity} kg/m³</td></tr>
         <tr><td>Berm Width / Elev</td><td>${params.bermWidth.toFixed(1)} m / +${params.bermElevation.toFixed(1)} m</td></tr></table>`,
        `<p>Reshaping berm mass profile: Berm width ${params.bermWidth.toFixed(1)} m above toe depth ${params.depth.toFixed(1)} m.</p>`
    );

    _saveAnalysisState('rubble-berm', {
        params,
        result,
        summary: { passed: result.passed, Ns: result.Ns }
    });

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
        });
    }
}

function performReefAnalysis(resultsDiv) {
    const crestFreeboard = _val('crestHeight', -0.5);
    const depth = _val('depth', 4.0);
    const params = {
        crestFreeboard,
        structureHeight: depth + crestFreeboard,
        crestWidth: _val('crestWidth', 8.0),
        slopeLeft: _val('slopeLeft', 2.0),
        slopeRight: _val('slopeRight', 2.0),
        depth,
        armourDn50: _val('armourDn50', 1.0),
        matDensity: _val('matDensity', 2650),
        matKd: _val('matKd', 3.5),
        matPorosity: _val('matPorosity', 0.40),
        waveHeight: _waveParam('waveHeight', 2.5),
        wavePeriod: _waveParam('wavePeriod', 8.0)
    };

    const result = calculateReefTransmission(params);
    const W50_t_hudson = typeof hudsonFormula === 'function'
        ? hudsonFormula(params.waveHeight, params.matDensity, 1025, params.matKd, params.slopeLeft)
        : null;
    const hudson = Number.isFinite(W50_t_hudson)
        ? {
            M50: W50_t_hudson * 1000,
            Dn50: Math.pow((W50_t_hudson * 1000) / params.matDensity, 1 / 3)
        }
        : null;

    resultsDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <h3 style="margin:0;">Reef Breakwater Analysis</h3>
            <span style="font-size:0.9em; color:var(--topography-500);">d'Angremond (1996) / CEM</span>
        </div>

        <div style="${sectionStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0; color:var(--primary-color);">Wave Transmission &amp; Attenuation</h4>
                <span style="font-size:0.85em; color:var(--topography-500);">${result.isSubmerged ? 'Submerged' : 'Emergent'} ($R_c = ${result.Rc.toFixed(2)}$ m)</span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; text-align:center;">
                <div style="background:var(--surface-1); padding:10px; border-radius:6px;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Transmission ($K_t$)</div>
                    <div style="font-size:1.3em; font-weight:bold; color:var(--primary-color);">${result.Kt.toFixed(3)}</div>
                </div>
                <div style="background:var(--surface-1); padding:10px; border-radius:6px;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Transmitted $H_t$</div>
                    <div style="font-size:1.3em; font-weight:bold;">${result.Ht.toFixed(2)} m</div>
                </div>
                <div style="background:var(--surface-1); padding:10px; border-radius:6px;">
                    <div style="font-size:0.85em; color:var(--topography-600);">Energy Loss</div>
                    <div style="font-size:1.3em; font-weight:bold; color:var(--accent-color);">${result.energyAttenuation.toFixed(1)}%</div>
                </div>
            </div>
            <div style="margin-top:10px; font-size:0.85em;">$${result.formula}$</div>
        </div>

        <div style="${sectionStyle}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0;">Reef Armour Stability</h4>
                ${getStatusBadge(result.passed, result.stabilityRatio.toFixed(2))}
            </div>
            <p><strong>Selected $D_{n50}$:</strong> ${params.armourDn50.toFixed(2)} m &nbsp;|&nbsp; <strong>Required $D_{n50}$:</strong> ${result.Dn50_required.toFixed(2)} m</p>
            ${hudson ? `<p><small>Hudson reference ($K_D=${params.matKd}$): Req. $D_{n50} = ${hudson.Dn50.toFixed(2)}$ m ($M_{50} = ${(hudson.M50 / 1000).toFixed(2)}$ t)</small></p>` : ''}
            <p><small>${result.reference}</small></p>
        </div>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Reef Armour $D_{n50}$</td><td>${params.armourDn50.toFixed(2)} m</td></tr>
         <tr><td>Rock Density</td><td>${params.matDensity} kg/m³</td></tr>
         <tr><td>Porosity</td><td>${params.matPorosity}</td></tr></table>`,
        `<p>Homogeneous submerged/reef mound: Crested at $R_c = ${result.Rc.toFixed(2)}$ m, width $B = ${params.crestWidth.toFixed(1)}$ m.</p>`
    );

    _saveAnalysisState('rubble-reef', {
        params,
        result,
        hudson,
        summary: { passed: result.passed, Kt: result.Kt, Ht: result.Ht }
    });

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
        });
    }
}

function performLowCrestedAnalysis(resultsDiv) {
    const params = {
        crestHeight: _val('crestHeight', 1.5),
        crestWidth: _val('crestWidth', 5.0),
        waveHeight: _waveParam('waveHeight', 2.5),
        wavePeriod: _waveParam('wavePeriod', 8.0),
        slopeLeft: _val('slopeLeft', 1.5),
        slopeRight: _val('slopeRight', 2.0),
        depth: _val('depth', 3.5),
        armourDn50: _val('armourDn50', 1.2),
        matDensity: _val('matDensity', 2650),
        matKd: _val('matKd', 3.5),
        hasBullnose: Boolean(_val('hasBullnose', false)),
        bullnoseFactor: _val('bullnoseFactor', 0.7)
    };

    const result = calculateLowCrestedPerformance(params);

    resultsDiv.innerHTML = `
        <h3 style="margin-bottom:15px;">Low-Crested Breakwater Analysis</h3>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
            <div style="${sectionStyle}">
                <h4 style="margin-top:0; color:var(--accent-color);">Overtopping (EurOtop 2018)</h4>
                <div style="font-size:1.5em; font-weight:bold;">${result.overtopping.q.toFixed(2)} <span style="font-size:0.6em; font-weight:normal;">l/s/m</span></div>
                <div style="font-size:0.8em; margin-top:5px; color:var(--topography-500);">Discharge Rate</div>
            </div>

            <div style="${sectionStyle}">
                <h4 style="margin-top:0; color:var(--primary-color);">Wave Transmission</h4>
                <div style="font-size:1.5em; font-weight:bold;">${result.transmission.Kt.toFixed(2)}</div>
                <div style="font-size:0.8em; margin-top:5px; color:var(--topography-500);">Coeff ($K_t$)</div>
                <div style="margin-top:5px; font-weight:600;">$H_t$: ${result.transmission.Ht.toFixed(2)} m</div>
            </div>
        </div>

        <p style="text-align:center; font-style:italic; color:var(--topography-500); font-size:0.9em;">${result.note}</p>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Armour $D_{n50}$</td><td>${params.armourDn50.toFixed(2)} m</td></tr>
         <tr><td>Rock Density</td><td>${params.matDensity} kg/m³</td></tr>
         <tr><td>$K_D$</td><td>${params.matKd}</td></tr></table>`,
        `<p>Low-crested section: Crest elevation ${params.crestHeight.toFixed(2)} m, crest width ${params.crestWidth.toFixed(2)} m.</p>`
    );

    _saveAnalysisState('rubble-low', {
        params,
        result,
        summary: { Kt: result.transmission.Kt, q: result.overtopping.q }
    });

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
        wallHeight: _val('wallHeight', 12.0),
        foundationWidth: _val('foundationWidth', 10.0),
        foundationDepth: _val('foundationDepth', 4.0),
        wallThickness: _val('wallThickness', 3.0),
        depth: _val('depth', 10.0),
        waveHeight: _waveParam('waveHeight', 4.0),
        wavePeriod: _waveParam('wavePeriod', 10.0),
        waveAngle: _val('waveAngle', 0),
        concreteDensity: _val('concreteDensity', 2400),
        fillDensity: _val('fillDensity', 1800),
        frictionCoeff: _val('frictionCoeff', 0.6)
    };

    const forces = calculateVerticalWallForces(params);
    const stability = checkVerticalWallStability({ ...params, ...forces.forces });

    const warningsHtml = (forces.warnings && forces.warnings.length > 0) ? `
        <div style="background: rgba(245, 124, 0, 0.14); color:var(--color-warning); padding: 10px; margin-bottom: 15px; border-radius: 4px; font-size:0.9em;">
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
                <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span>Overturning</span>
                    ${getStatusBadge(stability.overturning.passed, stability.overturning.FS.toFixed(2))}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Bearing ($q_{\\max}$)</span>
                    ${getStatusBadge(stability.bearing.passed, Number.isFinite(stability.bearing.q_max) ? `${stability.bearing.q_max.toFixed(0)} kPa` : 'N/A')}
                </div>
                <div style="margin-top:10px; font-size:0.8em; color:var(--topography-500);">
                    Submerged Weight: ${stability.weight.toFixed(1)} kN/m
                </div>
            </div>
        </div>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Concrete Density</td><td>${params.concreteDensity} kg/m³</td></tr>
         <tr><td>Fill Density</td><td>${params.fillDensity} kg/m³</td></tr>
         <tr><td>Friction Coeff (μ)</td><td>${params.frictionCoeff}</td></tr></table>`,
        `<p>Vertical gravity wall: $h_c=${params.wallHeight.toFixed(1)}$ m, $t=${params.wallThickness.toFixed(1)}$ m, footing $B=${params.foundationWidth.toFixed(1)}$ m.</p>`
    );

    _saveAnalysisState('vertical-wall', {
        params,
        forces,
        stability,
        summary: {
            passed: stability.sliding.passed && stability.overturning.passed && stability.bearing.passed,
            slidingFS: stability.sliding.FS,
            overturningFS: stability.overturning.FS
        }
    });

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
        moundHeight: _val('moundHeight', 6.0),
        moundWidth: _val('moundWidth', 8.0),
        moundSlope: _val('moundSlope', 1.5),
        armourDn50: _val('armourDn50', 1.5),
        matDensity: _val('matDensity', 2650),
        wallHeight: _val('wallHeight', 9.0),
        wallThickness: _val('wallThickness', 2.5),
        concreteDensity: _val('concreteDensity', 2400),
        frictionCoeff: _val('frictionCoeff', 0.6),
        waveHeight: _waveParam('waveHeight', 4.5),
        wavePeriod: _waveParam('wavePeriod', 10.0),
        depth: _val('depth', 10.0)
    };

    const result = calculateCompositeStructure(params);

    resultsDiv.innerHTML = `
        <h3>Composite Structure Analysis</h3>

        <div class="result-section">
            <h4>Rubble Mound Base</h4>
            <p><strong>Status:</strong> ${getStatusBadge(result.mound.stable)}</p>
            <p><strong>Required Weight:</strong> ${result.mound.W_required.toFixed(2)} tonnes</p>
            <p><strong>Provided Weight:</strong> ${result.mound.W_provided.toFixed(2)} tonnes</p>
            <p><strong>Formula:</strong> $${result.mound.formula}$</p>
            <p><small>${result.mound.reference}</small></p>
        </div>

        <div class="result-section">
            <h4>Vertical Superstructure Wall</h4>
            <p><strong>Horizontal Force:</strong> ${result.wall.F_h.toFixed(2)} kN/m</p>
            <p><strong>Sliding FS:</strong> ${result.wall.FS_slide.toFixed(2)} ${getStatusBadge(result.wall.FS_slide >= 1.2)}</p>
            <p><strong>Overturning FS:</strong> ${result.wall.FS_overturn.toFixed(2)} ${getStatusBadge(result.wall.FS_overturn >= 1.2)}</p>
            <p><strong>Formula:</strong> ${result.wall.formula}</p>
            <p><small>${result.wall.reference}</small></p>
        </div>

        <p><em>${result.note}</em></p>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Component</th><th>Property</th></tr>
         <tr><td>Mound Armour</td><td>$D_{n50}=${params.armourDn50.toFixed(2)}$ m ($\\rho=${params.matDensity}$ kg/m³)</td></tr>
         <tr><td>Concrete Wall</td><td>$\\rho=${params.concreteDensity}$ kg/m³, $\\mu=${params.frictionCoeff}$</td></tr></table>`,
        `<p>Composite section: Rubble berm $h_m=${params.moundHeight.toFixed(1)}$ m supporting superstructure wall $h_c=${params.wallHeight.toFixed(1)}$ m.</p>`
    );

    _saveAnalysisState('vertical-composite', {
        params,
        result,
        summary: { passed: result.mound.stable && result.wall.stable }
    });

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
        caissonWidth: _val('caissonWidth', 12.0),
        caissonHeight: _val('caissonHeight', 15.0),
        wallThickness: _val('wallThickness', 0.5),
        cellCount: parseInt(_val('cellCount', 3), 10) || 3,
        foundationHeight: _val('foundationHeight', 2.0),
        concreteDensity: _val('concreteDensity', 2400),
        fillDensity: _val('fillDensity', 1900),
        frictionCoeff: _val('frictionCoeff', 0.6),
        waveHeight: _waveParam('waveHeight', 5.0),
        wavePeriod: _waveParam('wavePeriod', 11.0),
        waveAngle: _val('waveAngle', 0),
        depth: _val('depth', 12.0)
    };

    const result = calculateCaissonStability(params);

    resultsDiv.innerHTML = `
        <h3>Caisson Analysis</h3>

        <div class="result-section">
            <h4>Stability Checks (Goda + Buoyancy + Eccentric Bearing)</h4>
            <p><strong>Sliding FS:</strong> ${result.sliding.FS.toFixed(2)} ${getStatusBadge(result.sliding.passed)} (Req: ${result.sliding.required})</p>
            <p><strong>Overturning FS:</strong> ${result.overturning.FS.toFixed(2)} ${getStatusBadge(result.overturning.passed)} (Req: ${result.overturning.required})</p>
            <p><strong>Bearing Pressure:</strong> ${Number.isFinite(result.bearing.pressure) ? `${result.bearing.pressure.toFixed(2)} kPa` : 'Overturning (> base width)'}</p>
            <p><strong>Bearing FS:</strong> ${result.bearing.FS.toFixed(2)} ${getStatusBadge(result.bearing.passed)} (Req: ${result.bearing.required})</p>
            <p><strong>Submerged Weight:</strong> ${result.weight.toFixed(2)} kN/m (Dry: ${result.weightDry.toFixed(1)} kN/m)</p>
            <p><small>${result.reference}</small></p>
        </div>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Concrete Density</td><td>${params.concreteDensity} kg/m³</td></tr>
         <tr><td>Cell Fill Density</td><td>${params.fillDensity} kg/m³</td></tr>
         <tr><td>Friction Coeff (μ)</td><td>${params.frictionCoeff}</td></tr></table>`,
        `<p>Cellular caisson (${params.cellCount} cells): $B=${params.caissonWidth.toFixed(1)}$ m, $h_c=${params.caissonHeight.toFixed(1)}$ m on ${params.foundationHeight.toFixed(1)} m rubble bedding.</p>`
    );

    _saveAnalysisState('vertical-caisson', {
        params,
        result,
        summary: {
            passed: result.sliding.passed && result.overturning.passed && result.bearing.passed,
            slidingFS: result.sliding.FS,
            overturningFS: result.overturning.FS
        }
    });

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
        perforationRatio: _val('perforationRatio', 25),
        perforationDiameter: _val('perforationDiameter', 15),
        chamberWidth: _val('chamberWidth', 2.0),
        wallThickness: _val('wallThickness', 0.4),
        wallHeight: _val('wallHeight', 12.0),
        foundationWidth: _val('foundationWidth', 10.0),
        foundationDepth: _val('foundationDepth', 3.0),
        concreteDensity: _val('concreteDensity', 2400),
        frictionCoeff: _val('frictionCoeff', 0.6),
        waveHeight: _waveParam('waveHeight', 4.0),
        wavePeriod: _waveParam('wavePeriod', 10.0),
        depth: _val('depth', 10.0),
        reflectionCoeff: _val('reflectionCoeff', 0.4)
    };

    const result = calculatePerforatedWall(params);

    resultsDiv.innerHTML = `
        <h3>Perforated Wall Analysis</h3>

        <div class="result-section">
            <h4>Wave Reflection</h4>
            <p><strong>Reflection Coefficient ($K_r$):</strong> ${result.reflection.Kr.toFixed(2)}</p>
            <p><strong>Energy Dissipation:</strong> ${result.reflection.energy_dissipation.toFixed(1)}%</p>
            <p><strong>Formula:</strong> $${result.reflection.formula}$</p>
            <p><small>${result.reflection.reference}</small></p>
        </div>

        <div class="result-section">
            <h4>Wave Forces</h4>
            <p><strong>Perforated Wall Force:</strong> ${result.forces.F_perforated.toFixed(2)} kN/m</p>
            <p><strong>Force Reduction:</strong> ${result.forces.reduction.toFixed(1)}%</p>
            <p><strong>Formula:</strong> ${result.forces.formula}</p>
            <p><small>${result.forces.reference}</small></p>
        </div>

        <p><em>${result.note}</em></p>
    `;

    _updateSecondaryTabs(
        `<table class="data-table"><tr><th>Property</th><th>Value</th></tr>
         <tr><td>Perforation Ratio (ε)</td><td>${params.perforationRatio}%</td></tr>
         <tr><td>Chamber Width</td><td>${params.chamberWidth.toFixed(2)} m</td></tr>
         <tr><td>Concrete Density</td><td>${params.concreteDensity} kg/m³</td></tr></table>`,
        `<p>Jarlan-type perforated wall: $h_c=${params.wallHeight.toFixed(1)}$ m, chamber width $B=${params.chamberWidth.toFixed(1)}$ m, perforation $d_p=${params.perforationDiameter}$ cm.</p>`
    );

    _saveAnalysisState('vertical-perforated', {
        params,
        result,
        summary: { Kr: result.reflection.Kr, F_perforated: result.forces.F_perforated }
    });

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}

function performCustomAnalysis(resultsDiv) {
    const family = String(_val('structureFamily', 'rubble'));
    const depth = _val('depth', 5.0);
    const waveHeight = _waveParam('waveHeight', 3.0);
    const wavePeriod = _waveParam('wavePeriod', 8.0);

    if (family === 'vertical') {
        const params = {
            wallHeight: _val('wallHeight', 8.0),
            wallThickness: _val('wallThickness', 2.5),
            foundationWidth: _val('foundationWidth', 8.0),
            depth,
            waveHeight,
            wavePeriod,
            waveAngle: 0,
            concreteDensity: _val('concreteDensity', 2400),
            fillDensity: 1800,
            frictionCoeff: _val('frictionCoeff', 0.6)
        };
        const forces = calculateVerticalWallForces(params);
        const stability = checkVerticalWallStability({ ...params, ...forces.forces });

        resultsDiv.innerHTML = `
            <h3>Custom Structure Analysis (Vertical Gravity Family)</h3>
            <div class="result-section">
                <p><strong>Horizontal Force ($F_h$):</strong> ${forces.forces.F_h.toFixed(2)} kN/m</p>
                <p><strong>Uplift Force ($F_u$):</strong> ${forces.forces.F_uplift.toFixed(2)} kN/m</p>
                <p><strong>Sliding FS:</strong> ${stability.sliding.FS.toFixed(2)} ${getStatusBadge(stability.sliding.passed)}</p>
                <p><strong>Overturning FS:</strong> ${stability.overturning.FS.toFixed(2)} ${getStatusBadge(stability.overturning.passed)}</p>
            </div>
        `;
        _updateSecondaryTabs(
            `<p>Concrete $\\rho_c=${params.concreteDensity}$ kg/m³, $\\mu=${params.frictionCoeff}$.</p>`,
            `<p>Custom vertical wall: $h_c=${params.wallHeight.toFixed(1)}$ m, $B=${params.foundationWidth.toFixed(1)}$ m.</p>`
        );
        _saveAnalysisState('custom', { family, params, forces, stability });
    } else {
        const slope = _val('slopeLeft', 1.5);
        const armourDn50 = _val('armourDn50', 1.2);
        const matDensity = _val('matDensity', 2650);
        const matKd = _val('matKd', 4.0);
        const crestHeight = _val('crestHeight', 3.5);
        const crestWidth = _val('crestWidth', 5.0);

        const rho_w = 1025;
        const delta = (matDensity - rho_w) / rho_w;
        const W50_t_hudson = hudsonFormula(waveHeight, matDensity, rho_w, matKd, slope);
        const hudson = {
            M50: W50_t_hudson * 1000,
            Dn50: Math.pow((W50_t_hudson * 1000) / matDensity, 1 / 3)
        };
        const vdm = calculateVanDerMeer(waveHeight, wavePeriod / 1.1, delta, slope, matDensity, 0.4, 2.0, 3000);
        const passed = armourDn50 >= vdm.Dn50;

        resultsDiv.innerHTML = `
            <h3>Custom Structure Analysis (Rubble Mound Family)</h3>
            <div class="result-section">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>Armour Sizing Check</h4>
                    ${getStatusBadge(passed)}
                </div>
                <p><strong>Selected $D_{n50}$:</strong> ${armourDn50.toFixed(2)} m</p>
                <p><strong>Hudson Req. $D_{n50}$:</strong> ${hudson.Dn50.toFixed(2)} m ($M_{50} = ${(hudson.M50 / 1000).toFixed(2)}$ t)</p>
                <p><strong>Van der Meer Req. $D_{n50}$:</strong> ${vdm.Dn50.toFixed(2)} m (Regime: ${vdm.regime}, $\\xi_m = ${vdm.xi_m.toFixed(2)}$)</p>
            </div>
        `;
        _updateSecondaryTabs(
            `<p>Rock $\\rho_s=${matDensity}$ kg/m³, $K_D=${matKd}$.</p>`,
            `<p>Custom rubble section: Crest ${crestHeight.toFixed(1)} m, width ${crestWidth.toFixed(1)} m, slope 1:${slope.toFixed(1)}.</p>`
        );
        _saveAnalysisState('custom', {
            family,
            params: { depth, crestHeight, crestWidth, slope, armourDn50, matDensity, matKd, waveHeight, wavePeriod },
            hudson,
            vdm,
            summary: { passed }
        });
    }

    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(resultsDiv, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ]
        });
    }
}
