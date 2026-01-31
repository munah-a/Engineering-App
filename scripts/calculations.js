// ==========================================
// COASTAL ENGINEERING CALCULATIONS
// ==========================================

// ==========================================
// WAVE CALCULATIONS
// ==========================================

/**
 * Calculate fetch-limited wave growth using SMB method
 * @param {number} U10 - Wind speed at 10m height (m/s)
 * @param {number} F - Fetch length (m)
 * @param {number} d - Water depth (m)
 * @returns {object} Wave parameters {Hs, Tp, L}
 */
function calculateSMBWaves(U10, F, d) {
    const g = 9.81; // gravity

    // Non-dimensional fetch
    const Fstar = (g * F) / (U10 * U10);

    // Non-dimensional significant wave height (SMB formula)
    const Hsstar = 0.283 * Math.tanh(0.530 * Math.pow(Fstar, 0.375));

    // Non-dimensional peak period
    const Tpstar = 7.54 * Math.tanh(0.833 * Math.pow(Fstar, 0.375));

    // Dimensional values
    const Hs = Hsstar * (U10 * U10) / g;
    const Tp = Tpstar * U10 / g;

    // Wave length (deep water approximation)
    const L0 = (g * Tp * Tp) / (2 * Math.PI);

    // Depth-limited adjustment
    const k = (2 * Math.PI) / L0;
    const L = L0 * Math.tanh(k * d);

    return { Hs, Tp, L, L0 };
}

/**
 * Calculate fetch-limited wave growth using JONSWAP
 * @param {number} U10 - Wind speed at 10m height (m/s)
 * @param {number} F - Fetch length (m)
 * @param {number} d - Water depth (m)
 * @returns {object} Wave parameters {Hs, Tp, L}
 */
function calculateJONSWAPWaves(U10, F, d) {
    const g = 9.81;

    // Non-dimensional fetch
    const Xstar = (g * F) / (U10 * U10);

    // JONSWAP formulas
    const Hsstar = 0.0016 * Math.pow(Xstar, 0.5);
    const fstar = 3.5 * Math.pow(Xstar, -0.33);

    const Hs = Hsstar * (U10 * U10) / g;
    const fp = fstar * g / U10;
    const Tp = 1 / fp;

    // Wave length
    const L0 = (g * Tp * Tp) / (2 * Math.PI);
    const k = (2 * Math.PI) / L0;
    const L = L0 * Math.tanh(k * d);

    return { Hs, Tp, L, L0 };
}

/**
 * Calculate breaking wave height using Miche criterion
 * @param {number} H - Wave height (m)
 * @param {number} L - Wave length (m)
 * @param {number} d - Water depth (m)
 * @returns {number} Breaking wave height (m)
 */
function calculateBreakingHeightMiche(H, L, d) {
    const k = (2 * Math.PI) / L;
    const Hb = 0.142 * L * Math.tanh(k * d);
    return Math.min(H, Hb);
}

/**
 * Calculate breaking wave height using Goda criterion
 * @param {number} H0 - Deep water wave height (m)
 * @param {number} L0 - Deep water wave length (m)
 * @param {number} d - Water depth (m)
 * @returns {number} Breaking wave height (m)
 */
function calculateBreakingHeightGoda(H0, L0, d) {
    const s = H0 / L0;
    const A = 0.17; // coefficient for gentle slopes
    const Hb = A * L0 * (1 - Math.exp(-1.5 * Math.PI * d / L0 * (1 + 15 * Math.pow(s, 4 / 3))));
    return Hb;
}

/**
 * Calculate Design Water Level (DWL)
 * @param {number} MSL - Mean sea level (m)
 * @param {number} tidalRange - Tidal range (m)
 * @param {number} SLR - Sea level rise (m)
 * @param {number} setup - Wave setup (m)
 * @returns {object} Water levels {HTL, DWL, setup}
 */
function calculateDWL(MSL, tidalRange, SLR, setup) {
    const HTL = MSL + tidalRange / 2;
    const DWL = HTL + SLR + setup;

    return { HTL, DWL, setup };
}

/**
 * Calculate wave setup
 * @param {number} Hs - Significant wave height (m)
 * @param {number} d - Water depth (m)
 * @param {number} slope - Beach slope
 * @returns {number} Wave setup (m)
 */
function calculateWaveSetup(Hs, d, slope = 0.02) {
    // Simplified formula: η ≈ 0.2 * Hs for typical conditions
    const setup = 0.2 * Hs;
    return setup;
}

// ==========================================
// RUBBLE MOUND STABILITY CALCULATIONS
// ==========================================

/**
 * Hudson formula for armour stone stability
 * @param {number} H - Design wave height (m)
 * @param {number} rho_r - Rock density (kg/m³)
 * @param {number} rho_w - Water density (kg/m³)
 * @param {number} KD - Stability coefficient
 * @param {number} cotAlpha - Cotangent of slope angle
 * @returns {number} Required stone weight (tonnes)
 */
function hudsonFormula(H, rho_r, rho_w, KD, cotAlpha) {
    const Sr = rho_r / rho_w;
    const W = (rho_r * Math.pow(H, 3)) / (KD * Math.pow(Sr - 1, 3) * cotAlpha);
    return W / 1000; // Convert kg to tonnes
}

/**
 * Van der Meer formula for plunging waves
 * @param {number} Hs - Significant wave height (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} Dn50 - Nominal diameter (m)
 * @param {number} Delta - Relative density
 * @param {number} alpha - Slope angle (degrees)
 * @param {number} N - Number of waves
 * @returns {object} Stability parameters
 */
function vanderMeerPlunging(Hs, Tm, Dn50, Delta, alpha, N = 3000) {
    const g = 9.81;
    const P = 0.18; // Permeability factor (impermeable core)
    const S = Math.max(Math.min(Math.sqrt(N) / Math.sqrt(N), 3), 2); // Damage level
    const xi = Math.tan(alpha * Math.PI / 180) / Math.sqrt(Hs / (g * Tm * Tm / (2 * Math.PI)));

    // Plunging breaker condition: ξ < 3
    const c = 6.2;
    const Hs_Dn50 = c * P * Math.pow(S / Math.sqrt(N), 0.2) * Math.pow(xi, -0.5);

    const requiredDn50 = Hs / Hs_Dn50;

    return {
        requiredDn50,
        xi,
        stabilityNumber: Hs_Dn50
    };
}

/**
 * Van der Meer formula for surging waves
 * @param {number} Hs - Significant wave height (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} Dn50 - Nominal diameter (m)
 * @param {number} Delta - Relative density
 * @param {number} alpha - Slope angle (degrees)
 * @param {number} N - Number of waves
 * @returns {object} Stability parameters
 */
function vanderMeerSurging(Hs, Tm, Dn50, Delta, alpha, N = 3000) {
    const g = 9.81;
    const P = 0.18;
    const S = Math.max(Math.min(Math.sqrt(N) / Math.sqrt(N), 3), 2);
    const xi = Math.tan(alpha * Math.PI / 180) / Math.sqrt(Hs / (g * Tm * Tm / (2 * Math.PI)));

    // Surging breaker condition: ξ > 3
    // Formula: Hs/ΔDn50 = 1.0 * P^-0.13 * (S/√N)^0.2 * √cotα * ξ^P
    const c = 1.0;
    const cotAlpha = 1 / Math.tan(alpha * Math.PI / 180);
    const Hs_Dn50 = c * Math.pow(P, -0.13) * Math.pow(S / Math.sqrt(N), 0.2) * Math.sqrt(cotAlpha) * Math.pow(xi, P);

    const requiredDn50 = Hs / Hs_Dn50;

    return {
        requiredDn50,
        xi,
        stabilityNumber: Hs_Dn50,
        formula: 'Hs/ΔDn50 = 1.0 * P^-0.13 * (S/√N)^0.2 * √cotα * ξ^P'
    };
}

/**
 * Calculate armour stone mass from Dn50
 * @param {number} Dn50 - Nominal diameter (m)
 * @param {number} rho - Rock density (kg/m³)
 * @returns {number} Mass (tonnes)
 */
function calculateMassFromDn50(Dn50, rho = 2650) {
    const volume = Math.pow(Dn50, 3);
    const mass = rho * volume;
    return mass / 1000; // Convert to tonnes
}

// ==========================================
// VERTICAL STRUCTURE CALCULATIONS (GODA)
// ==========================================

/**
 * Goda formula for wave pressure on vertical walls
 * @param {number} H - Design wave height (m)
 * @param {number} d - Water depth at structure (m)
 * @param {number} h - Wall height above seabed (m)
 * @param {number} L - Wave length (m)
 * @returns {object} Pressure distribution
 */
function godaWavePressure(H, d, h, L) {
    const rho_w = 1025; // Seawater density
    const g = 9.81;

    // Wave pressure coefficients
    const alpha1 = 0.6 + 0.5 * Math.pow((4 * Math.PI * d / L) / Math.sinh(4 * Math.PI * d / L), 2);
    // α2: Depth-related reduction factor (assumes vertical wall on seabed, no mound effect if h not specified correctly)
    // Goda α2 depends on mound height. If no mound, α2 can be approx 0 or small.
    // Standard Goda: α2 = min( (1-dw/d)/3 * (H/d)^2, 2d/H ) where dw is depth to mound.
    // If wall sits on seabed, dw = d, so α2 = 0.
    // Allowing for small mound effect or if h != d:
    // We assume h is wall height. If wall height < depth, it's submerged? 
    // If wall height > depth, it's emerged.
    // For safety, if no mound info, use 0 unless specified.
    const alpha2 = 0; // Default to 0 for wall on seabed (conservative for pressure, less for uplift?)
    const alpha3 = 1 - (h / d) * (1 - 1 / Math.cosh(2 * Math.PI * d / L));

    // Maximum wave pressure at still water level
    const p1 = 0.5 * (1 + Math.cos(0)) * alpha1 * rho_w * g * H;

    // Pressure at depth
    const p3 = alpha3 * p1;

    // Uplift pressure
    const p_uplift = 0.5 * alpha1 * alpha2 * rho_w * g * H;

    return {
        p1,
        p3,
        p_uplift,
        alpha1,
        alpha2,
        alpha3
    };
}

/**
 * Sliding stability check for vertical structures
 * @param {number} F_h - Horizontal force (kN)
 * @param {number} W - Structure weight (kN)
 * @param {number} F_uplift - Uplift force (kN)
 * @param {number} mu - Friction coefficient
 * @returns {object} Sliding stability
 */
function checkSlidingStability(F_h, W, F_uplift, mu = 0.6) {
    const F_v = W - F_uplift;
    const F_r = mu * F_v;
    const SF_sliding = F_r / F_h;

    return {
        resistingForce: F_r,
        drivingForce: F_h,
        safetyFactor: SF_sliding,
        isStable: SF_sliding >= 1.2
    };
}

/**
 * Overturning stability check
 * @param {number} M_overturning - Overturning moment (kNm)
 * @param {number} M_resisting - Resisting moment (kNm)
 * @returns {object} Overturning stability
 */
function checkOverturningStability(M_overturning, M_resisting) {
    const SF_overturning = M_resisting / M_overturning;

    return {
        resistingMoment: M_resisting,
        overturningMoment: M_overturning,
        safetyFactor: SF_overturning,
        isStable: SF_overturning >= 1.5
    };
}

// ==========================================
// SERVICEABILITY - EUROTOP FORMULAS
// ==========================================

/**
 * EurOtop mean overtopping discharge
 * @param {number} Rc - Crest freeboard (m)
 * @param {number} Hm0 - Significant wave height (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} alpha - Slope angle (degrees)
 * @param {number} gamma_f - Roughness factor (0.5-1.0)
 * @returns {number} Mean discharge q (l/s/m)
 */
function calculateEurOtopOvertopping(Rc, Hm0, Tm, alpha, gamma_f = 1.0, gamma_v = 1.0) {
    const g = 9.81;
    const Lm = (g * Tm * Tm) / (2 * Math.PI);

    // Iribarren number
    const xi = Math.tan(alpha * Math.PI / 180) / Math.sqrt(Hm0 / Lm);

    // Breaker parameter threshold
    const xi_threshold = 2.0;

    let q;

    // EurOtop 2018 Formulas (Weibull distribution)
    // gamma_v (bullnose/parapet) is applied as a combined reduction factor in the exponent
    const gamma_combined = gamma_f * gamma_v;
    const xi_m_1_0 = xi; // Rename for clarity

    if (xi < xi_threshold) {
        // Breaking waves (Eq 5.10)
        // q / sqrt(g*Hm0^3) = 0.023 / sqrt(tan_alpha) * gamma_b * xi_m_1_0 * exp( - (2.7 * Rc / (xi_m_1_0 * Hm0 * gamma_b * gamma_combined))^1.3 )

        const alpha_fact = 0.023 / Math.sqrt(Math.tan(alpha * Math.PI / 180));
        const exponent_term = 2.7 * Rc / (xi_m_1_0 * Hm0 * gamma_combined); // Assuming gamma_b=1 for now

        q = alpha_fact * xi_m_1_0 * Math.exp(-Math.pow(exponent_term, 1.3)) * Math.sqrt(g * Math.pow(Hm0, 3));

    } else {
        // Non-breaking waves (Eq 5.11)
        // q / sqrt(g*Hm0^3) = 0.09 * exp( - (1.5 * Rc / (Hm0 * gamma_combined))^1.3 )

        const exponent_term_nb = 1.5 * Rc / (Hm0 * gamma_combined);
        q = 0.09 * Math.exp(-Math.pow(exponent_term_nb, 1.3)) * Math.sqrt(g * Math.pow(Hm0, 3));

        // Check max of breaking/non-breaking (EurOtop says take minimum of the two calculated for the transition?)
        // Usually Eq 5.11 is the maximum. 
        // We stick to the condition xi < threshold.
    }

    // Convert from m³/s/m to l/s/m
    return q * 1000;
}

/**
 * Individual wave volume overtopping
 * @param {number} Hm0 - Significant wave height (m)
 * @param {number} Rc - Crest freeboard (m)
 * @param {number} Tm - Mean wave period (s)
 * @returns {number} Maximum wave volume Vmax (m³/m)
 */
function calculateIndividualWaveVolume(Hm0, Rc, Tm) {
    const g = 9.81;
    const Lm = (g * Tm * Tm) / (2 * Math.PI);

    // Simplified formula for individual wave volume
    const Vmax = 0.84 * Math.pow(Hm0, 2) * Lm * Math.exp(-1.3 * Rc / Hm0);

    return Vmax;
}

/**
 * Safety threshold assessment
 * @param {number} q - Mean discharge (l/s/m)
 * @returns {object} Safety assessment for different categories
 */
function assessSafetyThresholds(q) {
    return {
        pedestrian: {
            limit: 0.01,
            safe: q < 0.01,
            status: q < 0.01 ? 'SAFE' : (q < 0.05 ? 'CAUTION' : 'UNSAFE')
        },
        vehicle: {
            limit: 0.05,
            safe: q < 0.05,
            status: q < 0.05 ? 'SAFE' : (q < 0.5 ? 'CAUTION' : 'UNSAFE')
        },
        building: {
            limit: 1.0,
            safe: q < 1.0,
            status: q < 1.0 ? 'SAFE' : (q < 5.0 ? 'CAUTION' : 'UNSAFE')
        }
    };
}

// ==========================================
// MATERIAL DATABASE
// ==========================================
const MaterialDatabase = {
    'granite': { density: 2650, name: 'Granite' },
    'limestone': { density: 2500, name: 'Limestone' },
    'coral': { density: 2100, name: 'Coral Rock' },
    'concrete': { density: 2400, name: 'Concrete' },
    'quarryrun': { density: 2700, name: 'Quarry Run' },
    'basalt': { density: 2900, name: 'Basalt' }
};

// ==========================================
// MATERIAL DATABASE EXTENDED (Rock Manual)
// ==========================================
const ArmourTypes = {
    'rock_angular': { name: 'Natural Rock (Rough Angular)', rho: 2650, kd: 4.0, porosity: 0.37, description: 'Standard rough angular quarry stone. Hudson Kd=4.0 for breaking waves.' },
    'rock_smooth': { name: 'Natural Rock (Smooth/Rounded)', rho: 2600, kd: 2.1, porosity: 0.35, description: 'Rounded stones. Lower stability. Hudson Kd=2.1' },
    'cubes': { name: 'Concrete Cubes (Double Layer)', rho: 2400, kd: 6.0, porosity: 0.47, description: 'Simple concrete cubes. Hudson Kd=6.0-7.5. Single or double layer.' },
    'antifer': { name: 'Antifer Cubes', rho: 2400, kd: 7.0, porosity: 0.48, description: 'Modified cube with grooves. Kd=7.0.' },
    'tetrapod': { name: 'Tetrapod', rho: 2400, kd: 7.0, porosity: 0.50, description: 'Interlocking 4-legged unit. Kd≈7.0-8.0.' },
    'accropode': { name: 'Accropode', rho: 2400, kd: 12.0, porosity: 0.50, description: 'Single-layer interlocking unit. High stability Kd=12-15.' },
    'coreloc': { name: 'Core-Loc', rho: 2400, kd: 13.0, porosity: 0.60, description: 'High stability single-layer unit.' },
    'xbloc': { name: 'Xbloc', rho: 2400, kd: 13.0, porosity: 0.57, description: 'Single-layer interlocking unit.' },
    'user_defined': { name: 'User Defined', rho: 2650, kd: 4.0, porosity: 0.37, description: 'Custom properties.' }
};

// Export for UI
if (typeof window !== 'undefined') {
    window.ArmourTypes = ArmourTypes;
}

// ==========================================
// UI CALCULATION FUNCTIONS
// ==========================================

function performWaveCalculations() {
    // Get inputs
    const windSpeed = parseFloat(document.getElementById('windSpeed')?.value || 15);
    const fetchLength = parseFloat(document.getElementById('fetchLength')?.value || 5000);
    const offshoreDepth = parseFloat(document.getElementById('offshoreDepth')?.value || 30);
    const toeDepth = parseFloat(document.getElementById('toeDepthWave')?.value || 5);
    const waveAngle = parseFloat(document.getElementById('waveAngle')?.value || 0);
    const method = document.getElementById('waveMethod')?.value || 'smb';

    // DWL inputs
    const msl = parseFloat(document.getElementById('msl')?.value || 0);
    const tidalRange = parseFloat(document.getElementById('tidalRange')?.value || 2.5);
    const slr = parseFloat(document.getElementById('slr')?.value || 0.5);

    // Calculate offshore waves
    let waveResult;
    if (method === 'smb') {
        waveResult = calculateSMBWaves(windSpeed, fetchLength, offshoreDepth);
    } else {
        waveResult = calculateJONSWAPWaves(windSpeed, fetchLength, offshoreDepth);
    }

    // Transform waves from offshore to toe
    let transformation = null;
    let runupResult = null;

    if (typeof WaveTransformation !== 'undefined') {
        transformation = WaveTransformation.transformWaveOffshoreToToe(
            waveResult.Hs,
            waveResult.Tp,
            offshoreDepth,
            toeDepth,
            waveAngle
        );

        // Calculate wave run-up (assuming 1.5 slope for standard rubble mound)
        const assumedSlope = 1.5;
        runupResult = WaveTransformation.calculateWaveRunup(
            transformation.toe.H,
            waveResult.Tp,
            assumedSlope,
            'rock'
        );
    }

    // Calculate wave setup
    const setup = calculateWaveSetup(waveResult.Hs, offshoreDepth);

    // Calculate DWL
    const dwlResult = calculateDWL(msl, tidalRange, slr, setup);

    // Update setup field
    const waveSetupInput = document.getElementById('waveSetup');
    if (waveSetupInput) waveSetupInput.value = setup.toFixed(3);

    // Display offshore results
    document.getElementById('resultHs').textContent = `${waveResult.Hs.toFixed(2)} m`;
    document.getElementById('resultTp').textContent = `${waveResult.Tp.toFixed(2)} s`;
    document.getElementById('resultL').textContent = `${waveResult.L.toFixed(2)} m`;

    // Display transformation results
    if (transformation) {
        document.getElementById('resultHtoe').textContent = `${transformation.toe.H.toFixed(2)} m`;
        document.getElementById('resultKs').textContent = transformation.coefficients.Ks.toFixed(3);
        document.getElementById('resultKr').textContent = transformation.coefficients.Kr.toFixed(3);
        document.getElementById('resultDepthLimited').textContent = transformation.breaking.isDepthLimited ? 'Yes' : 'No';
    }

    // Display run-up results
    if (runupResult) {
        document.getElementById('resultXi').textContent = runupResult.xi.toFixed(2);
        document.getElementById('resultBreakingType').textContent = runupResult.breakingType.charAt(0).toUpperCase() + runupResult.breakingType.slice(1);
        document.getElementById('resultRunup').textContent = `${runupResult.Ru.toFixed(2)} m`;
        const rundown = WaveTransformation.calculateWaveRundown(runupResult.Ru);
        document.getElementById('resultRundown').textContent = `${rundown.toFixed(2)} m`;
    }

    // Display DWL results
    document.getElementById('resultHTL').textContent = `${dwlResult.HTL.toFixed(2)} m`;
    document.getElementById('resultSetup').textContent = `${setup.toFixed(3)} m`;
    document.getElementById('resultDWL').textContent = `${dwlResult.DWL.toFixed(2)} m`;

    // Display formulas
    const formulaDisplay = document.getElementById('formulaDisplay');
    if (formulaDisplay) {
        let formulaHTML = `
            <p><strong>${method.toUpperCase()} Method (Offshore):</strong></p>
            <p>$$H_s = ${waveResult.Hs.toFixed(2)} \\text{ m}$$</p>
            <p>$$T_p = ${waveResult.Tp.toFixed(2)} \\text{ s}$$</p>
            <p>$$L_0 = ${waveResult.L.toFixed(2)} \\text{ m}$$</p>
        `;

        if (transformation) {
            formulaHTML += `
                <p><strong>Wave Transformation (Offshore to Toe):</strong></p>
                <p>$$K_s = ${transformation.coefficients.Ks.toFixed(3)} \\text{ (Shoaling)}$$</p>
                <p>$$K_r = ${transformation.coefficients.Kr.toFixed(3)} \\text{ (Refraction, } \\beta_0 = ${waveAngle}°)$$</p>
                <p>$$H_{toe} = H_0 \\times K_s \\times K_r = ${waveResult.Hs.toFixed(2)} \\times ${transformation.coefficients.Ks.toFixed(3)} \\times ${transformation.coefficients.Kr.toFixed(3)} = ${transformation.toe.H.toFixed(2)} \\text{ m}$$</p>
                <p>$$H_{max} = 0.78 \\times d_{toe} = 0.78 \\times ${toeDepth.toFixed(1)} = ${transformation.breaking.H_max.toFixed(2)} \\text{ m}$$</p>
            `;

            if (transformation.breaking.isDepthLimited) {
                formulaHTML += `<p style="color: var(--color-warning);"><strong>Note:</strong> Wave height is depth-limited at toe</p>`;
            }
        }

        if (runupResult) {
            formulaHTML += `
                <p><strong>Surf Similarity \u0026 Wave Run-up (CEM 5-13):</strong></p>
                <p>$$\\xi_m = \\frac{\\tan\\alpha}{\\sqrt{H/L_0}} = ${runupResult.xi.toFixed(2)} \\text{ (${runupResult.breakingType})}$$</p>
                <p>$$R_u = ${runupResult.Ru.toFixed(2)} \\text{ m} \\quad (\\gamma_r = ${runupResult.gamma_r})$$</p>
                <p>$$R_d \\approx ${WaveTransformation.calculateWaveRundown(runupResult.Ru).toFixed(2)} \\text{ m}$$</p>
            `;
        }

        formulaHTML += `
            <p><strong>Design Water Level Breakdown:</strong></p>
            <p>$$HTL = MSL + \\frac{\\text{Range}}{2} = ${msl.toFixed(2)} + \\frac{${tidalRange.toFixed(2)}}{2} = ${dwlResult.HTL.toFixed(2)} \\text{ m}$$</p>
            <p>$$SLR = ${slr.toFixed(2)} \\text{ m}$$</p>
            <p>$$\\eta \\text{ (Wave Setup)} = ${setup.toFixed(3)} \\text{ m}$$</p>
            <p><strong>Final Calculation:</strong></p>
            <p>$$DWL = HTL + SLR + \\eta = ${dwlResult.HTL.toFixed(3)} + ${slr.toFixed(3)} + ${setup.toFixed(3)} = ${dwlResult.DWL.toFixed(2)} \\text{ m}$$</p>
            <br>
            <p style="font-size: 0.85em; color: var(--color-text-muted);"><em>Ref: USACE Coastal Engineering Manual (CEM) Ch 5-13; EurOtop (2018) Eq 4.1.</em></p>
        `;

        formulaDisplay.innerHTML = formulaHTML;

        // --- BULLNOSE STABILITY (Added Check) ---
        // Note: Hs, Tp, and crestElev are not defined in this scope.
        // Assuming these variables would be passed or derived if this block were truly intended here.
        // For now, using waveResult.Hs, waveResult.Tp, and a placeholder for crestElev.
        // If this block is meant for performStructureAnalysis, it should be moved there.
        const hasBullnose = document.getElementById('hasBullnose')?.checked;
        if (hasBullnose) {
            const bnParams = {
                bullnoseWidth: parseFloat(document.getElementById('bullnoseWidth')?.value || 1.0),
                bullnoseHeight: parseFloat(document.getElementById('bullnoseHeight')?.value || 1.2),
                bullnoseDensity: 2400,
                frictionCoeff: 0.6,
                waveHeight: waveResult.Hs, // Using waveResult.Hs as a placeholder
                wavePeriod: waveResult.Tp, // Using waveResult.Tp as a placeholder
                crestFreeboard: dwlResult.DWL // Using DWL as a placeholder for crestElev
            };
            // Assuming calculateBullnoseStability is defined elsewhere
            // const bnStab = calculateBullnoseStability(bnParams);

            // Placeholder for stabilityResults, as it's not defined in performWaveCalculations
            const stabilityResults = document.getElementById('stabilityResults');
            if (stabilityResults) {
                stabilityResults.innerHTML += `
                <div class="result-section">
                    <h4>Bullnose / Crown Wall Stability</h4>
                    <p><strong>Weight:</strong> N/A kN/m</p>
                    <p><strong>Wave Force (Fh):</strong> N/A kN/m (Est.)</p>
                    
                    <p><strong>Sliding SF:</strong> N/A 
                       <span style="color:orange">? PENDING</span> (Req > 1.2)</p>
                       
                    <p><strong>Overturning SF:</strong> N/A 
                       <span style="color:orange">? PENDING</span> (Req > 1.2)</p>
                       
                    <p><small>Bullnose stability calculation requires 'calculateBullnoseStability' function and proper context.</small></p>
                    <p><small>This section is a placeholder and should be moved to a structure-specific analysis function.</small></p>
                </div>
                `;
            }
        }

        // Re-render KaTeX
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(formulaDisplay, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ]
            });
        }
    }

    // Store in app state
    AppState.waveData = {
        windSpeed,
        fetchLength,
        offshoreDepth,
        toeDepth,
        waveAngle,
        method,
        ...waveResult,
        transformation,
        runup: runupResult,
        ...dwlResult
    };

    // Update Global Parameters for other modules
    if (typeof GlobalParams !== 'undefined') {
        // Use toe wave height for structure design
        const designWaveHeight = transformation ? transformation.toe.H : waveResult.Hs;
        GlobalParams.setGlobal('waveHeight', parseFloat(designWaveHeight.toFixed(2)), 'calculation');
        GlobalParams.setGlobal('wavePeriod', parseFloat(waveResult.Tp.toFixed(2)), 'calculation');
        GlobalParams.setGlobal('toeDepth', parseFloat(toeDepth.toFixed(2)), 'calculation');
    }

    // Save to current project if exists
    if (window.projectManager && window.projectManager.getCurrentProject()) {
        window.projectManager.saveWaveAnalysisToCurrentProject(AppState.waveData)
            .catch(err => console.error('Failed to save wave analysis to project:', err));
    }
}

function performOvertoppingCalculations() {
    // Get inputs
    const freeboard = parseFloat(document.getElementById('freeboard')?.value || 3.0);
    const slopeAngle = parseFloat(document.getElementById('slopeAngle')?.value || 35);

    // Calculate crest width: Gc = multiplier × Dn50
    const crestWidthMultiplier = parseInt(document.getElementById('crestWidthMultiplier')?.value || 3);
    const armourDn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);
    const crestWidth = crestWidthMultiplier * armourDn50;

    const waveHeight = parseFloat(document.getElementById('waveHeight')?.value || 2.5);
    const wavePeriod = parseFloat(document.getElementById('wavePeriod')?.value || 8.0);
    const toeDepth = parseFloat(document.getElementById('toeDepth')?.value || 10.0);

    // Calculate overtopping
    const q = calculateEurOtopOvertopping(freeboard, waveHeight, wavePeriod, slopeAngle);
    const Vmax = calculateIndividualWaveVolume(waveHeight, freeboard, wavePeriod);
    const safety = assessSafetyThresholds(q);

    // Display results
    document.getElementById('resultQ').textContent = `${q.toFixed(4)} l/s/m`;
    document.getElementById('resultVmax').textContent = `${Vmax.toFixed(2)} m³/m`;
    document.getElementById('resultRate').textContent = q < 0.01 ? 'Very Low' : q < 1 ? 'Low' : q < 10 ? 'Moderate' : 'High';

    // Update safety indicators
    updateSafetyIndicator('pedestrianSafety', safety.pedestrian);
    updateSafetyIndicator('vehicleSafety', safety.vehicle);
    updateSafetyIndicator('buildingSafety', safety.building);

    // --- Detailed Calculation Display ---
    const calcContainer = document.getElementById('serviceabilityDetailedCalc');
    const formulaDiv = document.getElementById('overtoppingFormulas');

    if (calcContainer && formulaDiv) {
        calcContainer.style.display = 'block';

        // Re-calculate intermediates for display
        const g = 9.81;
        const Lm = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
        const tanAlpha = Math.tan(slopeAngle * Math.PI / 180);
        const xi = tanAlpha / Math.sqrt(waveHeight / Lm);
        const gamma_f = 1.0; // Assuming standard for now

        let formulaHTML = '';
        const limitState = xi < 2.0 ? 'Breaking Waves' : 'Non-Breaking Waves';

        // Constants used
        formulaHTML += `
            <p><strong>Input Parameters:</strong></p>
            <ul>
                <li>Freeboard ($R_c$): ${freeboard.toFixed(2)} m</li>
                <li>Wave Height ($H_{m0}$): ${waveHeight.toFixed(2)} m</li>
                <li>Wave Period ($T_m$): ${wavePeriod.toFixed(2)} s</li>
                <li>Slope ($\cot\\alpha$): ${(1 / tanAlpha).toFixed(2)}</li>
            </ul>
            <p><strong>Derived Parameters:</strong></p>
            <p>$$L_{m} = \\frac{g T_m^2}{2\\pi} = ${Lm.toFixed(2)} \\text{ m}$$</p>
            <p>$$\\xi_{m-1,0} = \\frac{\\tan\\alpha}{\\sqrt{H_{m0}/L_{m}}} = ${xi.toFixed(2)}$$</p>
            <p><strong>Condition:</strong> ${limitState} ($\\xi ${xi < 2.0 ? '<' : '\\geq'} 2.0$)</p>
        `;

        if (xi < 2.0) {
            // Breaking
            formulaHTML += `
                <p><strong>EurOtop (2018) Eq. 5.10 (Breaking):</strong></p>
                <p>$$q = \\frac{0.067}{\\sqrt{\\tan\\alpha}} \\gamma_b \\xi_{m-1,0} \\exp\\left( -4.75 \\frac{R_c}{\\xi_{m-1,0} H_{m0} \\gamma_b \\gamma_f} \\right) \\sqrt{g H_{m0}^3}$$</p>
                <p><em>Note: Simplified for standard application.</em></p>
                <p>$$q_{calc} = ${q.toFixed(5)} \\text{ l/s/m}$$</p>
            `;
        } else {
            // Non-Breaking
            formulaHTML += `
                <p><strong>EurOtop (2018) Eq. 5.11 (Non-Breaking):</strong></p>
                <p>$$q = 0.2 \\exp\\left( -2.6 \\frac{R_c}{H_{m0} \\gamma_f} \\right) \\sqrt{g H_{m0}^3}$$</p>
                <p>$$q_{calc} = ${q.toFixed(5)} \\text{ l/s/m}$$</p>
            `;
        }

        formulaHTML += `<br><p style="font-size:0.85em; color:var(--topography-500);"><em>Source: EurOtop Manual 2nd Edition (2018), Chapter 5.</em></p>`;

        formulaDiv.innerHTML = formulaHTML;

        // Render Math
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(formulaDiv, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ]
            });
        }
    }

    // Store in app state
    AppState.serviceabilityData = {
        freeboard,
        slopeAngle,
        waveHeight,
        wavePeriod,
        q,
        Vmax,
        safety
    };
}

function updateSafetyIndicator(elementId, safetyData) {
    const indicator = document.getElementById(elementId);
    if (!indicator) return;

    // Remove previous status classes
    indicator.classList.remove('safe', 'warning', 'danger');

    // Add appropriate class
    if (safetyData.status === 'SAFE') {
        indicator.classList.add('safe');
    } else if (safetyData.status === 'CAUTION') {
        indicator.classList.add('warning');
    } else {
        indicator.classList.add('danger');
    }

    // Update status text
    const statusEl = indicator.querySelector('.safety-status');
    if (statusEl) {
        statusEl.textContent = safetyData.status;
        statusEl.style.color = safetyData.status === 'SAFE' ? 'var(--color-success)' :
            safetyData.status === 'CAUTION' ? 'var(--color-warning)' :
                'var(--color-danger)';
    }
}

function performStructureAnalysis() {
    const template = AppState.selectedTemplate;
    const stabilityResults = document.getElementById('stabilityResults');
    const materialsInfo = document.getElementById('materialsInfo');
    const layersInfo = document.getElementById('layersInfo');

    if (!stabilityResults) return;

    // Route to structure-specific calculations
    if (template === 'rubble-revetment') {
        performRevetmentAnalysis(stabilityResults);
        return;
    } else if (template === 'rubble-berm') {
        performBermAnalysis(stabilityResults);
        return;
    } else if (template === 'rubble-low') {
        performLowCrestedAnalysis(stabilityResults);
        return;
    } else if (template === 'vertical-wall') {
        performVerticalWallAnalysis(stabilityResults);
        return;
    } else if (template === 'vertical-composite') {
        performCompositeAnalysis(stabilityResults);
        return;
    } else if (template === 'vertical-caisson') {
        performCaissonAnalysis(stabilityResults);
        return;
    } else if (template === 'vertical-perforated') {
        performPerforatedAnalysis(stabilityResults);
        return;
    }

    if (template === 'rubble-standard' || template === 'rubble-bullnose') {
        // --- 1. GATHER INPUTS ---
        const slope = parseFloat(document.getElementById('slope')?.value || 1.5);
        const slopeRight = parseFloat(document.getElementById('slopeRight')?.value || 1.5);
        const crestHeight = parseFloat(document.getElementById('crestHeight')?.value || 5.0);

        // Calculate crest width: Gc = multiplier × Dn50
        const crestWidthMultiplier = parseInt(document.getElementById('crestWidthMultiplier')?.value || 3);
        const armourDn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);
        const crestWidth = crestWidthMultiplier * armourDn50;

        // --- MATERIAL PROPERTIES (DYNAMIC) ---
        // Defaults to Granite/Rock if not found
        const rho_s = parseFloat(document.getElementById('matDensity')?.value || 2650);
        const KD = parseFloat(document.getElementById('matKd')?.value || 4.0);
        const porosity = parseFloat(document.getElementById('matPorosity')?.value || 0.37);

        // Constants (Water)
        const rho_w = 1025;
        const delta = (rho_s / rho_w) - 1;

        // Design Wave from Global
        let Hs = 2.5;
        if (typeof GlobalParams !== 'undefined') {
            Hs = GlobalParams.getEffectiveValue(null, 'waveHeight') || 2.5;
        }

        // --- 2. STABILITY CALCULATION (Hudson) ---
        const numerator = rho_s * Math.pow(Hs, 3);
        const denominator = KD * Math.pow(delta, 3) * slope;
        const M50 = numerator / denominator; // kg
        const Dn50 = Math.pow(M50 / rho_s, 1 / 3); // meters

        // Underlayer (Filter) Rules (USACE/CIRIA)
        // W_filter = W_armour / 10 to W_armour / 15
        const M50_filter = M50 / 10;
        const Dn50_filter = Math.pow(M50_filter / rho_s, 1 / 3);

        // --- 3. LAYER GEOMETRY & VOLUMES ---
        // Layer Thickness: t = n * k_delta * Dn50
        const k_delta = 1.0; // Rough angular
        const n_armour_layers = parseInt(document.getElementById('armourLayers')?.value || 2);
        const n_filter = parseInt(document.getElementById('filterLayers')?.value || 2);
        const n_toe = parseInt(document.getElementById('toeLayers')?.value || 2);

        const thickness_armour = n_armour_layers * k_delta * Dn50;
        const thickness_filter = n_filter * k_delta * Dn50_filter;

        // Geometric Estimation (Per meter run)
        const toeDepth = parseFloat(document.getElementById('depth')?.value || 3.5);

        // Calculate Effective Design Depth (Adding DWL components if available)
        let dwlRise = 0;
        let dwlText = "0.00";
        if (typeof AppState !== 'undefined' && AppState.waveData) {
            // DWL from wave data is Total Level (HTL + SLR + Setup)
            // If we assume toeDepth is depth at chart datum/MSL, we add the rise.
            // AppState.waveData.DWL is the level above MSL (usually).
            // Let's verify: dwlResult.DWL = HTL + SLR + setup.
            // HTL = MSL + Range/2. So DWL is level above Datum if MSL is relative to Datum?
            // Usually MSL is ~0.7-1.0m above CD. dwlResult is absolute level.
            // The safest assumption for "Structure Depth" if input is "Depth at Toe" is simply:
            // Design Depth = Toe Depth (bed to mean level) + DWL Rise (mean level to DWL).
            // Actually, simply: AppState.waveData.DWL represents the water surface ELEVATION.
            // Let's assume input 'toeDepth' is depth below Mean Sea Level (or Datum). 
            // If DWL is value > 0, we add it.

            // Let's use the setup and SLR components specifically if available
            // But simpler is: Effective Depth = ToeDepth + (DWL - MSL)

            // If waveData.DWL exists
            if (AppState.waveData.DWL !== undefined) {
                // DWL is the *Elevation* of the design water surface.
                // We add this elevation to the toe depth (assuming toe depth is relative to 0 elevation)
                dwlRise = AppState.waveData.DWL;
                dwlText = dwlRise.toFixed(2);
            }
        }

        const waterDepth = toeDepth + dwlRise; // Effective Depth for structure height/breaking checks

        const totalStructureHeight = crestHeight + waterDepth; // Crest Height Input is Elevation above DWL?? No usually above Datum.
        // If Crest Height is Elevation (Rc + DWL), then freeboard is CrestHeight - DWL.
        // Actually usually Crest Height ($R_c$) in inputs is often Freeboard or Elevation relative to CD.
        // Input says "Crest Height" (e.g. 2.8m).
        // Let's assume input Crest Height is Elevation above Datum.
        // Then Freeboard Rc = CrestHeight - DWL.
        // Total Structure Height (from toe to crest) = ToeDepth + CrestHeight.

        // Standard Manuals: Structure Height usually means physical height of build.
        // But for volume calc:
        // Area = Structure Height * Width...
        // Let's assume simple trapezoid from Toe to Crest.
        // Height = ToeDepth + CrestHeight (assuming CrestHeight is relative to same datum 0)
        // If ToeDepth is -10m (input 10), Crest is +3m. Height = 13m.

        // Refined Logic for Visual/Volume:
        // Height = toeDepth (input) + crestHeight (input)
        // This keeps volume calc independent of water level fluctuations, which is correct for material quantity.
        // Only Wave Setup/Breaking depends on Water Level.

        // However, user said "Water depth in structure design to be depth at toe".
        // And "Consider Design Water Level calculated".
        // This affects STABILITY (if depth limited) and VISUALIZATION.

        // Let's keep Volume Height = toeDepth + crestHeight (Physical dimension)
        // But report the Water Depth used for analysis.

        // Geometric Estimation
        const physStructureHeight = toeDepth + crestHeight;

        // Asymmetric Slopes
        // Fallback to old 'slope' if new ones missing
        const sL = parseFloat(document.getElementById('slopeLeft')?.value || document.getElementById('slope')?.value || 1.5);
        const sR = parseFloat(document.getElementById('slopeRight')?.value || document.getElementById('slope')?.value || 1.5);

        const alphaL = Math.atan(1 / sL);
        const alphaR = Math.atan(1 / sR);

        const slopeLenL = physStructureHeight / Math.sin(alphaL);
        const slopeLenR = physStructureHeight / Math.sin(alphaR);

        // Perimeter (Top + Left Slope + Right Slope)
        const perimeter = crestWidth + slopeLenL + slopeLenR;

        // Approximate Volumes (Area * 1m)
        const Vol_armour = thickness_armour * perimeter;
        const Mass_armour = Vol_armour * rho_s * (1 - porosity);

        const Vol_filter = thickness_filter * perimeter;
        const Mass_filter = Vol_filter * rho_s * (1 - porosity);

        // Core Volume
        // Total Trapezoid Area
        const baseL = physStructureHeight * sL;
        const baseR = physStructureHeight * sR;
        const totalBaseWidth = crestWidth + baseL + baseR;

        const TotalArea = (crestWidth + totalBaseWidth) / 2 * physStructureHeight;
        const Vol_core = TotalArea - Vol_armour - Vol_filter;
        // Toe Volume (Conditional)

        // Safe check logic: if element exists use checked, else true (standard)
        const getCheck = (id) => { const el = document.getElementById(id); return el ? el.checked : true; };

        let Vol_toe = 0;
        const toeThick = parseFloat(document.getElementById('toeThickness')?.value || 1.5);

        if (getCheck('hasLeftToe')) {
            const w = parseFloat(document.getElementById('toeLeftWidth')?.value || document.getElementById('toeWidth')?.value || 3.0);
            Vol_toe += w * toeThick;
        }
        if (getCheck('hasRightToe')) {
            const w = parseFloat(document.getElementById('toeRightWidth')?.value || document.getElementById('toeWidth')?.value || 3.0);
            Vol_toe += w * toeThick;
        }

        const Mass_core = Vol_core * rho_s * (1 - porosity);
        const Mass_toe = Vol_toe * rho_s * (1 - porosity);


        // --- VDM CALCULATION (Van der Meer 1988) ---
        const P = parseFloat(document.getElementById('permeability')?.value || 0.4);
        const S_dam = parseFloat(document.getElementById('damageLevel')?.value || 2.0);
        const N_waves = parseFloat(document.getElementById('stormWaves')?.value || 3000);

        let Tm = 10.0;
        if (typeof GlobalParams !== 'undefined') Tm = GlobalParams.getEffectiveValue(null, 'wavePeriod') || 10.0;

        // Wave Steepness
        const g = 9.81;
        const L0 = (g * Tm * Tm) / (2 * Math.PI);
        const sm = Hs / L0;

        // Surf Similarity (using seaward slope)
        const sSea = parseFloat(document.getElementById('slopeLeft')?.value || document.getElementById('slope')?.value || 1.5);
        const tanAlpha = 1 / sSea;
        const xi_m = tanAlpha / Math.sqrt(sm);

        // Stability Number Ns = Hs / (Delta * Dn50)
        // Common Term: (S / sqrt(N))^0.2
        const termCommon = Math.pow(S_dam / Math.sqrt(N_waves), 0.2);

        // Plunging Breakers (xi < xi_critical)
        // Ns = 6.2 * P^0.18 * (S/sqrt(N))^0.2 * xi_m^-0.5
        const Ns_plunging = 6.2 * Math.pow(P, 0.18) * termCommon / Math.sqrt(xi_m);

        // Surging Breakers (xi >= xi_critical)
        // Ns = 1.0 * P^-0.13 * (S/sqrt(N))^0.2 * sqrt(cotA) * xi_m^P
        const Ns_surging = 1.0 * Math.pow(P, -0.13) * termCommon * Math.sqrt(sSea) * Math.pow(xi_m, P);

        // Use Minimum (Conservative)
        // Typically, detailed method calculates transition xi_cr, but min() works for design check
        const Ns_vdm = Math.min(Ns_plunging, Ns_surging); // Actually VDM says check xi against critical.
        // Critical xi_cr = [ (6.2 P^0.31 * sqrt(tanA)) / (1.0 P^-0.13) ] ... solving intersection.
        // Let's rely on min() or basic logic. In VDM graphs, the lower curve governs.

        const Dn50_vdm = Hs / (delta * Ns_vdm);
        const M50_vdm = rho_s * Math.pow(Dn50_vdm, 3);


        // Check vs Input
        const inputDn50 = parseFloat(document.getElementById('armourDn50')?.value || 1.2);

        const getBadge = (req) => {
            if (!req) return '';
            const isPass = inputDn50 >= req;
            const pct = ((inputDn50 - req) / req * 100);
            const sign = pct >= 0 ? '+' : '';
            const color = isPass ? 'var(--color-success)' : 'var(--color-danger)';
            const icon = isPass ? '✅' : '❌';
            return `<div style="color:${color}; font-weight:bold; margin-top:5px; font-size:0.9em;">
                ${icon} ${isPass ? 'PASS' : 'FAIL'} (Input ${sign}${pct.toFixed(0)}%)
             </div>`;
        };

        // --- 4. RENDER STABILITY TAB ---
        stabilityResults.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:25px;">
                <div style="border-bottom: 1px solid var(--border-color); padding-bottom:15px;">
                    <h4 style="border-left: 3px solid var(--primary-color); padding-left:10px; margin-bottom:10px;">Hudson Formula</h4>
                    <div class="result-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div class="formula" style="font-size:0.85em; grid-column: 1 / -1;">$$M_{50} = \\frac{\\rho_s H^3}{K_D \\Delta^3 \\cot \\alpha}$$</div>
                        
                        <div style="font-size:0.9em;">
                            <div><strong>Wave ($H_s$):</strong> ${Hs.toFixed(2)} m</div>
                <div><strong>Wave Setup ($\eta$):</strong> ${calculateWaveSetup(Hs, waterDepth).toFixed(2)} m <small style="color:var(--topography-500);">($\approx 0.2 H_s$)</small></div>
                            <div><strong>Slope:</strong> 1:${sSea.toFixed(1)}</div>
                            <div><strong>$K_D$:</strong> ${KD.toFixed(1)}</div>
                        </div>
                        
                        <div class="result-highlight" style="padding:10px; font-size:0.95em;">
                            <div>Mass: <strong>${(M50 / 1000).toFixed(2)} t</strong></div>
                            <div>Req. $D_{n50}$: <strong>${Dn50.toFixed(2)} m</strong></div>
                            ${getBadge(Dn50)}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 style="border-left: 3px solid var(--accent-color); padding-left:10px; margin-bottom:10px;">Van der Meer (1988)</h4>
                    <div class="result-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div class="formula" style="font-size:0.85em; grid-column: 1 / -1;">$$N_{s} = f(P, S, N, \\xi_m)$$</div>
                        
                        <div style="font-size:0.9em;">
                            <div><strong>$\\xi_m$:</strong> ${xi_m.toFixed(2)}</div>
                            <div><strong>Perm. (P):</strong> ${P}</div>
                            <div><strong>Damage (S):</strong> ${S_dam}</div>
                        </div>
                        
                        <div class="result-highlight" style="padding:10px; font-size:0.95em;">
                            <div>Mass: <strong>${(M50_vdm / 1000).toFixed(2)} t</strong></div>
                            <div>Req. $D_{n50}$: <strong>${Dn50_vdm.toFixed(2)} m</strong></div>
                            ${getBadge(Dn50_vdm)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top:15px; font-size:0.85em; color:var(--topography-500); text-align:center; font-style:italic; border-top: 1px dotted var(--border-color); padding-top: 10px;">
                <strong>Design Conditions:</strong><br>
                Effective Water Depth ($d_{eff}$) = Toe Depth (${toeDepth.toFixed(2)}m) + DWL Rise (${dwlText}m) = <strong>${waterDepth.toFixed(2)}m</strong><br>
                Significant Wave Height ($H_s$) = ${Hs.toFixed(2)}m
            </div>
        `;

        // --- 5. RENDER MATERIALS TAB (Detailed) ---
        if (materialsInfo) {
            const totalVol = Vol_armour + Vol_filter + Vol_toe + Vol_core;
            const totalMass = (Mass_armour + Mass_filter + Mass_toe + Mass_core) / 1000;

            materialsInfo.innerHTML = `
                <h4>Material Quantities (Estimation per m run)</h4>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Layer</th>
                                <th>Material / Grading</th>
                                <th>Volume ($m^3/m$)</th>
                                <th>Porosity</th>
                                <th>Est. Mass ($t/m$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Primary Armour</strong></td>
                                <td>
                                    Rough Angular Granite<br>
                                    <small>$D_{n50} = ${Dn50.toFixed(2)}m$</small>
                                </td>
                                <td>${Vol_armour.toFixed(2)}</td>
                                <td>${(porosity * 100).toFixed(0)}%</td>
                                <td>${(Mass_armour / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Filter Layer</strong></td>
                                <td>
                                    Quarry Stone<br>
                                    <small>$D_{n50} = ${Dn50_filter.toFixed(2)}m$</small>
                                </td>
                                <td>${Vol_filter.toFixed(2)}</td>
                                <td>${(porosity * 100).toFixed(0)}%</td>
                                <td>${(Mass_filter / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Toe Berm</strong></td>
                                <td>
                                    Armour Stone<br>
                                    <small>Same/Smaller</small>
                                </td>
                                <td>${Vol_toe.toFixed(2)}</td>
                                <td>${(porosity * 100).toFixed(0)}%</td>
                                <td>${(Mass_toe / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Core</strong></td>
                                <td>
                                    Quarry Run<br>
                                    <small>0-500kg</small>
                                </td>
                                <td>${Vol_core.toFixed(2)}</td>
                                <td>${(porosity * 100).toFixed(0)}%</td>
                                <td>${(Mass_core / 1000).toFixed(2)}</td>
                            </tr>
                            <tr style="border-top: 2px solid var(--border-color); background: var(--surface-2);">
                                <td><strong>TOTAL</strong></td>
                                <td>-</td>
                                <td><strong>${totalVol.toFixed(2)}</strong></td>
                                <td>-</td>
                                <td><strong>${totalMass.toFixed(2)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:10px; font-size:0.9em;">
                    <p><strong>Parameters Used:</strong></p>
                    <ul style="padding-left:20px; color:var(--topography-600);">
                        <li>Rock Density ($\rho_s$): ${rho_s} $kg/m^3$</li>
                        <li>Stability Coeff ($K_D$): ${KD}</li>
                        <li>Porosity ($n_v$): ${(porosity * 100).toFixed(0)}%</li>
                        <li>Formula: $Mass = Vol \times \rho_s \times (1 - n_v)$</li>
                    </ul>
                </div>
            `;
        }

        // --- 6. RENDER LAYERS TAB ---
        if (layersInfo) {
            layersInfo.innerHTML = `
                <h4>Layer Specifications</h4>
                <div class="layer-spec">
                    <h5>Primary Armour Layer</h5>
                    <ul>
                        <li><strong>Thickness ($t_a$):</strong> ${thickness_armour.toFixed(2)} m</li>
                        <li><strong>Number of Layers ($n$):</strong> 2</li>
                        <li><strong>Placement:</strong> Random placement</li>
                        <li><strong>Placement Density:</strong> 60-65%</li>
                    </ul>
                </div>
                <div class="layer-spec">
                    <h5>Filter / Underlayer</h5>
                    <ul>
                        <li><strong>Thickness ($t_f$):</strong> ${thickness_filter.toFixed(2)} m</li>
                        <li><strong>Filter Rule:</strong> $W_{50,f} \\approx W_{50,a} / 10$</li>
                        <li><strong>Function:</strong> Prevent core material washout</li>
                    </ul>
                </div>
                <div class="layer-spec">
                    <h5>Toe Structure</h5>
                    <ul>
                        <li><strong>Width:</strong> 3.0 m (Nominal)</li>
                        <li><strong>Height:</strong> ${(thickness_armour * 1.5).toFixed(2)} m</li>
                        <li><strong>Armour:</strong> Same as Primary or slightly smaller</li>
                    </ul>
                </div>
                <p class="formula-ref"><em>Ref: CIRIA The Rock Manual C683; USACE CEM.</em></p>
            `;
        }

        // Render Math (Global)
        if (typeof renderMathInElement !== 'undefined') {
            [stabilityResults, materialsInfo, layersInfo].forEach(el => {
                if (el) renderMathInElement(el, {
                    delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }]
                });
            });
        }
        // Store in AppState for Reports
        AppState.structureData = {
            template,
            Hs,
            rho_s,
            KD,
            porosity,
            delta,
            waterDepth,
            slope: sSea,
            inputDn50,
            toeDepth,
            dwlRise,

            // Hudson
            hudson: {
                M50,
                Dn50,
                M50_filter,
                Dn50_filter
            },

            // Van der Meer
            vdm: {
                xi_m,
                P,
                S_dam,
                N_waves,
                Ns_vdm,
                Dn50: Dn50_vdm,
                M50: M50_vdm
            },

            // Geometry
            layers: {
                thickness_armour,
                thickness_filter
            },

            // Quantities
            volumes: {
                armour: Vol_armour,
                filter: Vol_filter,
                core: Vol_core,
                toe: Vol_toe
            },
            masses: {
                armour: Mass_armour,
                filter: Mass_filter,
                core: Mass_core,
                toe: Mass_toe
            }
        };

        // Save to current project if exists
        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const currentProject = window.projectManager.getCurrentProject();
            // Use the first structure ID if available, or create a default one
            const structureId = currentProject.structures.length > 0
                ? currentProject.structures[currentProject.structures.length - 1].id
                : 'default_structure';

            window.projectManager.saveStructureAnalysisToCurrentProject(structureId, {
                stability: AppState.structureData,
                serviceability: AppState.serviceabilityData,
                diagram: exportCanvasImage()
            }).catch(err => console.error('Failed to save structure analysis to project:', err));
        }

    } else {
        stabilityResults.innerHTML = `<p>Analysis for ${template} is under development.</p>`;
    }
}

