// ==========================================
// STRUCTURE-SPECIFIC CALCULATIONS
// ==========================================
// Calculation functions for different coastal structure types
// References: EurOtop II (2018), CEM Part VI Ch 5, Goda (2000), Takahashi (2002)

// ==========================================
// RUBBLE MOUND REVETMENT CALCULATIONS
// ==========================================

/**
 * Calculate revetment stability using Van der Meer formulas
 * @param {object} params - Revetment parameters
 * @returns {object} Stability results with formulas and references
 */
function calculateRevetmentStability(params) {
    const {
        armourDn50,
        matDensity,
        slopeLeft,
        permeability = 0.5,
        damageLevel = 2.0,
        stormWaves = 3000,
        waveHeight,
        wavePeriod,
        depth
    } = params;

    const rho_w = 1025; // Seawater density kg/m³
    const g = 9.81;
    const Delta = (matDensity - rho_w) / rho_w;

    // Calculate deep water wave length
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);

    // Calculate surf similarity parameter (Iribarren number)
    const alpha_rad = Math.atan(1 / slopeLeft);
    const tanAlpha = Math.tan(alpha_rad);
    const xi_m = tanAlpha / Math.sqrt(waveHeight / L0);

    // Van der Meer stability formulas (EurOtop 2018, Section 5.2.1)
    // Determine wave breaking type
    const xi_critical = Math.sqrt(tanAlpha); // Transition point
    const isPlunging = xi_m < xi_critical;

    let Hs_stable;
    let formula;
    const P = permeability; // Notional permeability: 0.1 (impermeable) to 0.6 (very permeable)
    const S = damageLevel; // Damage level: start of damage S=2, intermediate S=3-5, failure S=8
    const N = stormWaves;

    if (isPlunging) {
        // Plunging breakers (ξ < √tanα)
        // Hs / (Δ × Dn50) = (6.2 × P^0.18) × (S/√N)^0.2 × ξ_m^(-0.5)
        const c_pl = 6.2 * Math.pow(P, 0.18);
        Hs_stable = Delta * armourDn50 * c_pl * Math.pow(S / Math.sqrt(N), 0.2) * Math.pow(xi_m, -0.5);
        formula = 'H_s / (\\Delta \\times D_{n50}) = 6.2 P^{0.18} (S/\\sqrt{N})^{0.2} \\xi_m^{-0.5}';
    } else {
        // Surging breakers (ξ ≥ √tanα)
        // Hs / (Δ × Dn50) = (1.0 × P^(-0.13)) × (S/√N)^0.2 × √cotα × ξ_m^P
        const c_su = 1.0 * Math.pow(P, -0.13);
        const cotAlpha = 1 / tanAlpha;
        Hs_stable = Delta * armourDn50 * c_su * Math.pow(S / Math.sqrt(N), 0.2) * Math.sqrt(cotAlpha) * Math.pow(xi_m, P);
        formula = 'H_s / (\\Delta \\times D_{n50}) = 1.0 P^{-0.13} (S/\\sqrt{N})^{0.2} \\sqrt{\\cot\\alpha} \\xi_m^P';
    }

    const stabilityRatio = Hs_stable / waveHeight;
    const passed = stabilityRatio >= 1.0;

    // Additional checks
    const warnings = [];
    if (P < 0.1 || P > 0.6) {
        warnings.push('Permeability factor P outside typical range (0.1-0.6)');
    }
    if (S < 2 || S > 8) {
        warnings.push('Damage level S outside typical range (2-8)');
    }
    if (slopeLeft < 1.5 || slopeLeft > 6) {
        warnings.push('Slope outside typical range for revetments (1:1.5 to 1:6)');
    }

    return {
        stabilityRatio,
        passed,
        Hs_stable,
        xi_m,
        waveCondition: isPlunging ? 'Plunging' : 'Surging',
        xi_critical: xi_critical.toFixed(2),
        formula,
        reference: 'EurOtop II (2018), Section 5.2.1, Equations 5.8 & 5.9',
        warnings,
        details: {
            Delta,
            P,
            S,
            N,
            slope: `1:${slopeLeft.toFixed(1)}`
        }
    };
}

/**
 * Calculate wave run-up on revetment (EurOtop 2018)
 * @param {object} params - Revetment parameters
 * @returns {object} Run-up results
 */
function calculateRevetmentRunup(params) {
    const {
        waveHeight,
        wavePeriod,
        slopeLeft,
        depth
    } = params;

    const g = 9.81;
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
    const alpha_deg = Math.atan(1 / slopeLeft) * (180 / Math.PI);
    const xi = Math.tan(alpha_deg * Math.PI / 180) / Math.sqrt(waveHeight / L0);

    // EurOtop 2018 run-up formula
    const gamma_b = 1.0; // Breaking wave factor
    const gamma_f = 0.9; // Roughness factor for rock
    const gamma_beta = 1.0; // Obliquity factor

    const Ru2 = 1.65 * gamma_b * gamma_f * gamma_beta * xi * waveHeight;

    return {
        Ru2,
        xi,
        formula: 'Ru2% / Hs = 1.65 × γb × γf × γβ × ξm-1,0',
        reference: 'EurOtop II (2018), Section 5.2'
    };
}

// ==========================================
// BERM BREAKWATER CALCULATIONS
// ==========================================

/**
 * Calculate berm breakwater stability (Van der Meer for reshaping)
 * @param {object} params - Berm breakwater parameters
 * @returns {object} Stability results
 */
function calculateBermStability(params) {
    const {
        armourDn50,
        matDensity,
        slopeLeft,
        bermWidth,
        bermElevation,
        recession,
        permeability = 0.4,
        damageLevel = 0.5, // Nod - number of displaced units
        waveHeight,
        depth
    } = params;

    const rho_w = 1025;
    const Delta = (matDensity - rho_w) / rho_w;

    // Berm submergence
    const hb = depth - bermElevation;

    // Stability number for reshaping structures (EurOtop 2018, Section 5.2.3)
    const Ns = waveHeight / (Delta * armourDn50);

    // Van der Meer for berm breakwaters
    const Nod = damageLevel;
    const Ns_allowed = 1.0 * Math.pow(Nod, 0.15) * Math.pow(hb / waveHeight, 0.5);

    const stabilityRatio = Ns_allowed / Ns;
    const passed = stabilityRatio >= 1.0;

    return {
        stabilityRatio,
        passed,
        Ns,
        Ns_allowed,
        recession_expected: recession,
        formula: 'Ns = Hs / (Δ × Dn50) = 1.0 × Nod^0.15 × (hb/Hs)^0.5',
        reference: 'EurOtop II (2018), Section 5.2.3; CEM VI-5-47',
        note: 'Berm breakwaters are designed to reshape under storm conditions'
    };
}



// ==========================================
// LOW-CRESTED BREAKWATER CALCULATIONS
// ==========================================

/**
 * Calculate overtopping and transmission for low-crested breakwater
 * @param {object} params - Low-crested parameters
 * @returns {object} Overtopping and transmission results
 */
function calculateLowCrestedPerformance(params) {
    const {
        crestHeight,
        crestWidth,
        waveHeight,
        wavePeriod,
        slopeLeft,
        slopeRight,
        depth
    } = params;

    const g = 9.81;
    const Rc = crestHeight;
    const Gc = crestWidth;
    const Hs = waveHeight;

    // Overtopping for low-crested structures (EurOtop 2018, Chapter 5/7)
    // If emerged (Rc > 0), use standard EurOtop formulas (now updated to 2018 in calculations.js)
    // If zero freeboard or submerged, overtopping transitions to transmission/overflow
    let q;

    if (typeof calculateEurOtopOvertopping !== 'undefined' && Rc > 0) {
        // Use the centralized 2018 formula
        q = calculateEurOtopOvertopping(Rc, Hs, wavePeriod, slopeLeft);
    } else {
        // Fallback or Submerged/Zero Freeboard (Simplified)
        // EurOtop 2018 Eq 5.11 for non-breaking as a baseline
        const gamma_f = 0.9;
        const q_dimensionless = 0.09 * Math.exp(-Math.pow(1.5 * Math.abs(Rc) / (Hs * gamma_f), 1.3));
        q = q_dimensionless * Math.sqrt(g * Math.pow(Hs, 3)) * 1000;

        // Note: For submerged structures, one should look at transmission primarily
    }

    // Transmission
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
    const xi = Math.tan(Math.atan(1 / slopeLeft)) / Math.sqrt(Hs / L0);
    const Kt = 0.4 * (Rc / Hs) + 0.64 * Math.pow(Gc / Hs, -0.31) * (1 - Math.exp(-0.5 * xi));
    const Kt_final = Math.max(0, Math.min(1, Kt));

    return {
        overtopping: {
            q,
            formula: 'q / √(g×Hs³) = 0.2 × exp(-2.6 × Rc/(Hs × γf))',
            reference: 'EurOtop II (2018), Chapter 7'
        },
        transmission: {
            Kt: Kt_final,
            Ht: Kt_final * Hs,
            formula: 'Kt = f(Rc/Hs, Gc/Hs, ξ)',
            reference: 'CEM VI-5-7'
        },
        note: 'Low-crested structures allow both overtopping and transmission'
    };
}

// ==========================================
// VERTICAL WALL CALCULATIONS (GODA)
// ==========================================

/**
 * Calculate Goda wave forces on vertical wall
 * @param {object} params - Vertical wall parameters
 * @returns {object} Wave force results
 */
function calculateVerticalWallForces(params) {
    const {
        wallHeight,
        foundationWidth,
        depth,
        waveHeight,
        wavePeriod,
        waveAngle = 0,
        concreteDensity = 2400,
        fillDensity = 1800
    } = params;

    const g = 9.81;
    const rho_w = 1025;
    const d = depth; // Water depth at structure
    const H = waveHeight; // Design wave height (usually H1/3 or H1/250)
    const T = wavePeriod;
    const beta = waveAngle * Math.PI / 180; // Wave angle in radians
    const hc = wallHeight; // Wall height above seabed

    // Calculate wave length using dispersion relation
    const L0 = (g * T * T) / (2 * Math.PI); // Deep water wavelength
    let L = L0; // Initial guess
    // Iterative solution for wavelength
    for (let i = 0; i < 5; i++) {
        L = L0 * Math.tanh(2 * Math.PI * d / L);
    }

    // Goda pressure modification factors (Goda 2000, Takahashi 2002)
    // α1: Pressure intensity factor
    const sinh_term = Math.sinh(4 * Math.PI * d / L);
    const alpha1 = 0.6 + 0.5 * Math.pow((4 * Math.PI * d / L) / sinh_term, 2);

    // α2: Depth-related reduction factor (Goda)
    // Depends on mound height (hm). If wall is on seabed, hm = 0.
    const moundHeight = params.foundationHeight || params.moundHeight || 0;
    const dw = d - moundHeight; // Depth to top of mound

    // Goda Formula for α2
    // α2 = min( (1 - dw/d)/3 * (H/d)^2, 2*d/H )
    // If moundHeight = 0, dw = d, term becomes 0.

    let alpha2_val = 0;
    if (moundHeight > 0) {
        const term1 = ((1 - dw / d) / 3) * Math.pow(H / d, 2);
        const term2 = 2 * d / H;
        alpha2_val = Math.min(term1, term2);
    }
    const alpha2 = alpha2_val;

    // α3: Pressure at seabed
    const cosh_term = Math.cosh(2 * Math.PI * d / L);
    const alpha3 = 1 - (hc / d) * (1 - 1 / cosh_term);

    // Design water level elevation (Goda 2000)
    // η* = 0.75 × (1 + cosβ) × H for normal conditions
    const eta_star = 0.75 * (1 + Math.cos(beta)) * H;

    // Wave pressure at top of wall (SWL) - Goda formula
    // p1 = 0.5 × (1 + cosβ) × (α1 + α2×cosβ) × ρw × g × η*
    const p1 = 0.5 * (1 + Math.cos(beta)) * (alpha1 + alpha2 * Math.cos(beta)) * rho_w * g * eta_star / 1000; // kPa

    // Wave pressure at seabed
    const p3 = alpha3 * p1; // kPa

    // Uplift pressure at heel
    const p4 = 0.5 * (1 + Math.cos(beta)) * alpha1 * alpha3 * rho_w * g * H / 1000; // kPa

    // Total horizontal force per unit width (kN/m)
    // Trapezoidal pressure distribution
    const F_h = 0.5 * (p1 + p3) * eta_star;

    // Uplift force (kN/m)
    const F_uplift = 0.5 * p4 * foundationWidth;

    // Moment arm for horizontal force (from seabed)
    const h_F = (p1 + 2 * p3) / (p1 + p3) * eta_star / 3;

    // Overturning moment about toe (kNm/m)
    const M_overturning = F_h * h_F;

    // Warnings
    const warnings = [];
    if (d / L < 0.2) {
        warnings.push('Shallow water (d/L < 0.2) - Goda formula may be less accurate');
    }
    if (H / d > 0.6) {
        warnings.push('Breaking wave condition (H/d > 0.6) - Use breaking wave formula');
    }
    if (Math.abs(waveAngle) > 30) {
        warnings.push('Large wave angle (>30°) - Oblique wave effects significant');
    }

    return {
        forces: {
            F_h,
            F_uplift,
            p1,
            p3,
            p4,
            M_overturning
        },
        pressures: {
            alpha1: alpha1.toFixed(3),
            alpha2: alpha2.toFixed(3),
            alpha3: alpha3.toFixed(3)
        },
        waveParams: {
            L: L.toFixed(2),
            L0: L0.toFixed(2),
            eta_star: eta_star.toFixed(2),
            d_over_L: (d / L).toFixed(3)
        },
        formula: 'p_1 = 0.5(1+cosβ)(α_1+α_2cosβ)ρ_w g η*, p_3 = α_3 p_1',
        reference: 'Goda (2000) Random Seas and Design of Maritime Structures; Takahashi (2002); CEM VI-5-3',
        warnings,
        note: 'Goda formula for standing wave pressure on vertical walls'
    };
}

/**
 * Check vertical wall stability (sliding and overturning)
 * @param {object} params - Wall parameters with forces
 * @returns {object} Stability check results
 */
function checkVerticalWallStability(params) {
    const {
        wallHeight,
        wallThickness,
        foundationWidth,
        concreteDensity = 2400,
        fillDensity = 1800,
        frictionCoeff = 0.6,
        F_h, // Horizontal force from Goda
        M_overturning // Overturning moment from Goda
    } = params;

    const g = 9.81;

    // Calculate wall weight
    const V_concrete = wallHeight * wallThickness * 1; // per meter
    const V_fill = wallHeight * (foundationWidth - wallThickness) * 1;
    const W = (V_concrete * concreteDensity + V_fill * fillDensity) * g / 1000; // kN/m

    // Sliding check
    const mu = frictionCoeff;
    const FS_slide = (mu * W) / F_h;

    // Overturning check
    const M_resisting = W * (foundationWidth / 2);
    const FS_overturn = M_resisting / M_overturning;

    return {
        sliding: {
            FS: FS_slide,
            passed: FS_slide >= 1.2,
            required: 1.2,
            formula: 'FS_slide = (μ × W) / FH'
        },
        overturning: {
            FS: FS_overturn,
            passed: FS_overturn >= 1.2,
            required: 1.2,
            formula: 'FS_overturn = (W × B/2) / M_overturning'
        },
        weight: W,
        reference: 'CEM VI-5-4; Goda (2000)'
    };
}

// ==========================================
// COMPOSITE STRUCTURE CALCULATIONS
// ==========================================

/**
 * Calculate composite structure (mound + wall) performance
 * @param {object} params - Composite structure parameters
 * @returns {object} Combined stability results
 */
function calculateCompositeStructure(params) {
    const {
        moundHeight,
        moundWidth,
        moundSlope,
        armourDn50,
        matDensity,
        wallHeight,
        wallThickness,
        concreteDensity,
        waveHeight,
        wavePeriod,
        depth
    } = params;

    const rho_w = 1025;
    const Delta = (matDensity - rho_w) / rho_w;

    // 1. Check mound stability (Hudson formula)
    const KD = 2.0; // Typical for angular rock
    const W_required = (rho_w * Math.pow(waveHeight, 3)) / (KD * Math.pow(Delta, 3) * moundSlope);
    const W_provided = matDensity * Math.pow(armourDn50, 3);
    const mound_stable = W_provided >= W_required;

    // 2. Calculate wave forces on wall (modified for mound)
    const d_wall = depth - moundHeight; // Effective depth at wall
    const eta_star = 0.75 * waveHeight;
    const p1 = 0.5 * 1.5 * rho_w * 9.81 * eta_star / 1000; // Simplified
    const F_h = 0.5 * p1 * eta_star;

    // 3. Wall stability
    const W_wall = wallHeight * wallThickness * concreteDensity * 9.81 / 1000;
    const FS_slide = (0.6 * W_wall) / F_h;

    return {
        mound: {
            stable: mound_stable,
            W_required: W_required / 1000, // tonnes
            W_provided: W_provided / 1000,
            formula: 'W = (ρw × H³) / (KD × Δ³ × cotα)',
            reference: 'Hudson formula; CEM VI-5-3'
        },
        wall: {
            F_h,
            FS_slide,
            stable: FS_slide >= 1.2,
            formula: 'Modified Goda for composite',
            reference: 'Takahashi (2002); CEM VI-5-4'
        },
        note: 'Composite structures combine rubble mound protection with vertical wall'
    };
}

// ==========================================
// CAISSON CALCULATIONS
// ==========================================

/**
 * Calculate caisson stability (sliding, overturning, bearing)
 * @param {object} params - Caisson parameters
 * @returns {object} Stability results
 */
function calculateCaissonStability(params) {
    const {
        caissonWidth,
        caissonHeight,
        wallThickness,
        cellCount,
        foundationHeight,
        concreteDensity = 2400,
        fillDensity = 1900,
        frictionCoeff = 0.6,
        waveHeight,
        wavePeriod,
        depth
    } = params;

    const g = 9.81;
    const rho_w = 1025;

    // Calculate caisson weight
    const V_concrete = 2 * wallThickness * caissonHeight + caissonWidth * wallThickness; // Simplified
    const V_fill = caissonWidth * caissonHeight - V_concrete;
    const W = (V_concrete * concreteDensity + V_fill * fillDensity) * g / 1000; // kN/m

    // Goda wave forces (simplified)
    const eta_star = 0.75 * waveHeight;
    const p1 = 0.5 * 1.5 * rho_w * g * eta_star / 1000;
    const F_h = 0.5 * p1 * eta_star;
    const M_overturning = F_h * (eta_star / 3);

    // Sliding check
    const FS_slide = (frictionCoeff * W) / F_h;

    // Overturning check
    const M_resisting = W * (caissonWidth / 2);
    const FS_overturn = M_resisting / M_overturning;

    // Bearing capacity (simplified)
    const bearing_pressure = W / caissonWidth; // kPa
    const allowable_bearing = 200; // Typical for sand foundation
    const FS_bearing = allowable_bearing / bearing_pressure;

    return {
        sliding: {
            FS: FS_slide,
            passed: FS_slide >= 1.2,
            required: 1.2
        },
        overturning: {
            FS: FS_overturn,
            passed: FS_overturn >= 1.2,
            required: 1.2
        },
        bearing: {
            pressure: bearing_pressure,
            FS: FS_bearing,
            passed: FS_bearing >= 2.0,
            required: 2.0
        },
        weight: W,
        formula: 'Goda forces + stability checks',
        reference: 'Goda (2000); CEM VI-5-4'
    };
}

// ==========================================
// PERFORATED WALL CALCULATIONS
// ==========================================

/**
 * Calculate perforated wall performance (reduced reflection)
 * @param {object} params - Perforated wall parameters
 * @returns {object} Performance results
 */
function calculatePerforatedWall(params) {
    const {
        perforationRatio, // percentage
        chamberWidth,
        wallHeight,
        waveHeight,
        wavePeriod,
        depth,
        reflectionCoeff = 0.4
    } = params;

    const g = 9.81;
    const epsilon = perforationRatio / 100; // Convert to decimal
    const B = chamberWidth;
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);

    // Reflection coefficient for perforated wall (Jarlan-type)
    const Kr = reflectionCoeff; // User-specified or calculated

    // Wave force reduction due to perforation
    const F_solid = 0.5 * 1.5 * 1025 * g * 0.75 * waveHeight * 0.75 * waveHeight / 1000;
    const F_perforated = F_solid * (1 - 0.4 * epsilon);

    // Energy dissipation
    const energy_dissipation = (1 - Kr * Kr) * 100; // percentage

    return {
        reflection: {
            Kr,
            energy_dissipation,
            formula: 'Kr = f(ε, B/L, kd)',
            reference: 'Takahashi (2002); Jarlan-type perforated wall'
        },
        forces: {
            F_perforated,
            reduction: (1 - F_perforated / F_solid) * 100, // percentage
            formula: 'F_perf = F_solid × (1 - 0.4×ε)',
            reference: 'Takahashi (2002); CEM VI-5-4'
        },
        note: 'Perforations reduce wave reflection and forces through energy dissipation'
    };
}


// ==========================================
// BULLNOSE / CROWN WALL STABILITY (Simplified)
// ==========================================

/**
 * Calculate stability of crown wall / bullnose on top of rubble mound
 * Using simplified quasi-static method
 * @param {object} params - Bullnose and wave parameters
 * @returns {object} Stability results
 */
function calculateBullnoseStability(params) {
    const {
        bullnoseWidth,
        bullnoseHeight,
        bullnoseDensity = 2400, // kg/m3 (Concrete)
        frictionCoeff = 0.6, // Concrete on Rubble
        waveHeight, // Hs
        crestFreeboard // Rc
    } = params;

    const g = 9.81;
    const rho_w = 1025; // Seawater

    // 1. Weight of Bullnose (W)
    const W = bullnoseWidth * bullnoseHeight * bullnoseDensity * g / 1000; // kN/m

    // 2. Wave Forces (Simplified Estimation)
    // F_h = P_dyn * Height. P_dyn = 1.0 * rho * g * Hs
    const F_h = (1.0 * rho_w * g * waveHeight / 1000) * bullnoseHeight; // kN/m

    // Uplift Force (F_u) - Triangular distribution
    const p_u = 0.5 * (1.0 * rho_w * g * waveHeight / 1000); // kPa
    const F_u = 0.5 * p_u * bullnoseWidth; // kN/m

    // 3. Stability Checks
    // Sliding: Resisting = Friction * (W - F_u)
    const F_resist_sliding = frictionCoeff * Math.max(0, W - F_u);
    const FS_sliding = F_resist_sliding / F_h;

    // Overturning Moments about heel
    const M_stabilizing = W * (bullnoseWidth / 2);
    // Overturning: F_h at mid-height + F_u at 2/3 width
    const M_overturning = (F_h * (bullnoseHeight / 2)) + (F_u * (2 * bullnoseWidth / 3));

    const FS_overturn = M_stabilizing / M_overturning;

    return {
        weight: W,
        forces: { F_h, F_u },
        sliding: {
            FS: FS_sliding,
            passed: FS_sliding >= 1.2
        },
        overturning: {
            FS: FS_overturn,
            passed: FS_overturn >= 1.2
        },
        formula: 'Quasi-static check (F_h ≈ ρgHs × H_bn)',
        reference: 'Simplified approximation (Pedersen 1996 concepts)',
        note: 'Assumes dynamic pressure on full face height.'
    };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateRevetmentStability,
        calculateRevetmentRunup,
        calculateBermStability,
        calculateReefTransmission,
        calculateLowCrestedPerformance,
        calculateVerticalWallForces,
        checkVerticalWallStability,
        calculateCompositeStructure,
        calculateCaissonStability,
        calculatePerforatedWall,
        calculateBullnoseStability
    };
}
