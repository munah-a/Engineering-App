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

    // Van der Meer (1988) stability formulas (Rock Manual Eq. 5.138 / EurOtop 2018)
    const P = Math.min(Math.max(permeability, 0.05), 0.65);
    const S = damageLevel;
    const N = Math.min(Math.max(stormWaves || 3000, 100), 7500);
    const xi_critical = Math.pow(6.2 * Math.pow(P, 0.31) * Math.sqrt(tanAlpha), 1 / (P + 0.5));
    const isPlunging = slopeLeft >= 4.0 || xi_m < xi_critical;

    let Hs_stable;
    let formula;

    if (isPlunging) {
        const c_pl = 6.2 * Math.pow(P, 0.18);
        Hs_stable = Delta * armourDn50 * c_pl * Math.pow(S / Math.sqrt(N), 0.2) * Math.pow(xi_m, -0.5);
        formula = 'H_s / (\\Delta \\times D_{n50}) = 6.2 P^{0.18} (S/\\sqrt{N})^{0.2} \\xi_m^{-0.5}';
    } else {
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
        xi_critical,
        formula,
        reference: 'Van der Meer (1988); CIRIA Rock Manual C683 Eq. 5.138',
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
 * Calculate wave run-up on revetment (EurOtop 2018 Eq. 5.1 & 5.2)
 * @param {object} params - Revetment parameters
 * @returns {object} Run-up results
 */
function calculateRevetmentRunup(params) {
    const {
        waveHeight,
        wavePeriod,
        slopeLeft,
        gamma_f = 0.55,
        gamma_b = 1.0,
        gamma_beta = 1.0
    } = params;

    const g = 9.81;
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
    const tanAlpha = 1 / slopeLeft;
    const xi = tanAlpha / Math.sqrt(waveHeight / L0);

    const ru_break = 1.65 * gamma_b * gamma_f * gamma_beta * xi * waveHeight;
    const ru_max = 1.00 * gamma_f * gamma_beta * (4.0 - 1.5 / Math.sqrt(Math.max(0.1, gamma_b * xi))) * waveHeight;
    const Ru2 = Math.max(0.1 * waveHeight, Math.min(ru_break, ru_max));

    return {
        Ru2,
        xi,
        gamma_f,
        formula: 'R_{u2\\%} / H_{m0} = \\min(1.65\\gamma_b\\gamma_f\\gamma_\\beta\\xi_{m-1,0},\\; 1.00\\gamma_f\\gamma_\\beta(4.0 - 1.5/\\sqrt{\\gamma_b\\xi_{m-1,0}}))',
        reference: 'EurOtop II (2018), Section 5.2 (Eqs. 5.1 & 5.2)'
    };
}

// ==========================================
// BERM BREAKWATER CALCULATIONS
// ==========================================

/**
 * Calculate berm breakwater stability and recession (Torum / Van der Meer)
 * @param {object} params - Berm breakwater parameters (bermElevation relative to SWL)
 * @returns {object} Stability and recession results
 */
function calculateBermStability(params) {
    const {
        armourDn50,
        matDensity,
        bermWidth,
        bermElevation = 1.0,
        recession = 5.0,
        waveHeight,
        wavePeriod = 10.0,
        depth = 5.0
    } = params;

    const g = 9.81;
    const rho_w = 1025;
    const Delta = (matDensity - rho_w) / rho_w;

    // Effective vertical berm parameter guarded against zero or negative elevation relative to SWL
    const bermDepth = Math.max(0.1 * waveHeight, Math.abs(bermElevation));

    // Dimensionless stability number Ho and period parameter Ho*To
    const Ho = waveHeight / (Delta * armourDn50);
    const To = wavePeriod * Math.sqrt(g / armourDn50);
    const HoTo = Ho * To;

    // Van der Meer / Torum recession estimate (m)
    const rec_dn50 = HoTo > 16
        ? Math.max(0, 2.7e-6 * Math.pow(HoTo, 3) + 9e-6 * Math.pow(HoTo, 2) + 0.11 * HoTo - 1.8)
        : 0;
    const recession_expected = rec_dn50 * armourDn50;
    const requiredBermWidth = Math.max(3 * waveHeight, recession_expected + 2 * armourDn50);

    // Hardly reshaping / statically stable threshold Ho <= 2.7 and adequate berm width
    const Ho_allowed = 2.7;
    const stabilityRatio = Ho_allowed / Math.max(0.01, Ho);
    const widthOk = bermWidth >= requiredBermWidth && bermWidth >= recession_expected;
    const passed = Ho <= Ho_allowed && widthOk && recession_expected <= recession;

    return {
        stabilityRatio,
        passed,
        Ns: Ho,
        Ho,
        HoTo,
        Ns_allowed: Ho_allowed,
        bermDepth,
        depth,
        recession_expected,
        recession_allowed: recession,
        requiredBermWidth,
        widthOk,
        formula: 'H_o = \\frac{H_s}{\\Delta D_{n50}} \\le 2.7, \\quad \\frac{Rec}{D_{n50}} = 2.7\\times 10^{-6}(H_o T_o)^3 + 9\\times 10^{-6}(H_o T_o)^2 + 0.11 H_o T_o - 1.8',
        reference: 'Rock Manual (2007) Section 5.2.6; Torum (1998); EurOtop II (2018)',
        note: Ho <= 2.0 ? 'Icelandic-type statically stable berm' : Ho <= 2.7 ? 'Hardly reshaping berm breakwater' : 'Reshaping berm — check recession vs berm width'
    };
}

// ==========================================
// REEF / SUBMERGED BREAKWATER CALCULATIONS
// ==========================================

/**
 * Calculate wave transmission & stability for a reef / submerged breakwater
 * References: d'Angremond et al. (1996), Van der Meer et al. (2005), Ahrens (1989)
 * @param {object} params - Reef breakwater parameters
 * @returns {object} Transmission and stability results
 */
function calculateReefTransmission(params) {
    const {
        waveHeight,
        wavePeriod = 8.0,
        depth,
        structureHeight,
        crestWidth,
        slopeLeft = 1.5,
        armourDn50 = 1.0,
        matDensity = 2650,
        waterDensity = 1025
    } = params;

    const g = 9.81;
    const Rc = structureHeight - depth; // Negative when submerged below SWL
    const L0 = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
    const xi = (1 / slopeLeft) / Math.sqrt(Math.max(1e-5, waveHeight / L0));

    // d'Angremond et al. (1996) wave transmission formula clamped to [0.075, 0.80]
    const rawKt = -0.4 * (Rc / waveHeight) +
        0.64 * Math.pow(Math.max(0.1, crestWidth / waveHeight), -0.31) * (1 - Math.exp(-0.5 * xi));
    const Kt = Math.max(0.075, Math.min(0.80, rawKt));
    const Ht = Kt * waveHeight;
    const energyAttenuation = (1 - Kt * Kt) * 100;

    // Reef armour stability (spectral stability number / depth-adjusted Hudson)
    const Delta = (matDensity - waterDensity) / waterDensity;
    const submergenceRatio = Rc / waveHeight;
    const Ns_reef = 2.0 * Math.exp(Math.max(-0.5, -0.3 * submergenceRatio));
    const Dn50_required = waveHeight / (Delta * Ns_reef);
    const passed = armourDn50 >= Dn50_required;

    return {
        Rc,
        xi,
        Kt,
        Ht,
        energyAttenuation,
        Dn50_required,
        armourDn50,
        stabilityRatio: armourDn50 / Math.max(0.01, Dn50_required),
        passed,
        isSubmerged: Rc < 0,
        formula: "K_t = -0.4 \\frac{R_c}{H_s} + 0.64 \\left(\\frac{B}{H_s}\\right)^{-0.31}(1 - e^{-0.5\\xi}) \\in [0.075, 0.80]",
        reference: "d'Angremond et al. (1996); Van der Meer et al. (2005); Ahrens (1989)"
    };
}

// ==========================================
// LOW-CRESTED BREAKWATER CALCULATIONS
// ==========================================

/**
 * Resolve EurOtop overtopping function safely in both browser and Node.js
 */
function _getEurOtopFn() {
    if (typeof calculateEurOtopOvertopping === 'function') {
        return calculateEurOtopOvertopping;
    }
    if (typeof require === 'function') {
        try {
            return require('./calculations.js').calculateEurOtopOvertopping;
        } catch (e) {
            return null;
        }
    }
    return null;
}

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
        wavePeriod = 8.0,
        slopeLeft = 1.5,
        hasBullnose = false,
        bullnoseFactor = 0.7,
        gamma_f = 0.55
    } = params;

    const g = 9.81;
    const Rc = crestHeight;
    const Gc = crestWidth;
    const Hs = waveHeight;
    const alphaDeg = (Math.atan(1 / slopeLeft) * 180) / Math.PI;
    const gamma_v = hasBullnose ? bullnoseFactor : 1.0;

    const eurOtopFn = _getEurOtopFn();
    let q_l_s_m = 0;
    let xi = (1 / slopeLeft) / Math.sqrt(Hs / ((g * wavePeriod * wavePeriod) / (2 * Math.PI)));

    if (eurOtopFn) {
        const ot = eurOtopFn(Hs, wavePeriod, Rc, alphaDeg, gamma_f, 1.0, 1.0, gamma_v, Gc);
        q_l_s_m = ot.q_l_s_m;
        xi = ot.xi_m10;
    } else {
        const q_dim = Rc <= 0
            ? Math.min((0.023 / Math.sqrt(1 / slopeLeft)) * xi, 0.09)
            : Math.min(
                (0.023 / Math.sqrt(1 / slopeLeft)) * xi * Math.exp(-Math.pow((2.7 * Math.max(0, Rc)) / (xi * Hs * gamma_f * gamma_v), 1.3)),
                0.09 * Math.exp(-Math.pow((1.5 * Math.max(0, Rc)) / (Hs * gamma_f * gamma_v), 1.3))
            );
        q_l_s_m = q_dim * Math.sqrt(g * Math.pow(Hs, 3)) * 1000;
    }

    // d'Angremond et al. (1996) wave transmission: Kt decreases as positive freeboard Rc increases
    const rawKt = -0.4 * (Rc / Hs) + 0.64 * Math.pow(Math.max(0.1, Gc / Hs), -0.31) * (1 - Math.exp(-0.5 * xi));
    const Kt_final = Math.max(0.075, Math.min(0.80, rawKt));

    return {
        alphaDeg,
        overtopping: {
            q: q_l_s_m,
            formula: '\\frac{q}{\\sqrt{g H_{m0}^3}} = \\min\\left(\\frac{0.023}{\\sqrt{\\tan\\alpha}}\\xi_{m-1,0} e^{-(2.7 R_c / (\\xi_{m-1,0} H_{m0}\\gamma_f\\gamma_v))^{1.3}},\\; 0.09 e^{-(1.5 R_c / (H_{m0}\\gamma_f\\gamma_v))^{1.3}}\\right)',
            reference: 'EurOtop II (2018), Eqs. 5.10, 5.11 & 5.19'
        },
        transmission: {
            Kt: Kt_final,
            Ht: Kt_final * Hs,
            formula: "K_t = -0.4(R_c/H_s) + 0.64(G_c/H_s)^{-0.31}(1 - e^{-0.5\\xi})",
            reference: "d'Angremond et al. (1996); CEM VI-5-7"
        },
        note: 'Low-crested structures attenuate waves via both overtopping dissipation and transmission reduction'
    };
}

// ==========================================
// VERTICAL WALL CALCULATIONS (GODA 2000)
// ==========================================

/**
 * Calculate Goda (2000) wave forces and overturning moments on a vertical wall
 * @param {object} params - Vertical wall parameters (wallHeight = total height above foundation)
 * @returns {object} Wave force and pressure results
 */
function calculateVerticalWallForces(params) {
    const {
        wallHeight,
        foundationWidth,
        wallThickness = 3.0,
        depth,
        waveHeight,
        wavePeriod,
        waveAngle = 0
    } = params;

    const g = 9.81;
    const rho_w = 1025;
    const d = depth;
    const T = wavePeriod;
    const beta = (waveAngle * Math.PI) / 180;
    const cosBeta = Math.cos(beta);
    const moundHeight = params.foundationHeight || params.moundHeight || 0;

    // Iterative dispersion wavelength at depth d (50 iterations)
    const L0 = (g * T * T) / (2 * Math.PI);
    let L = L0;
    for (let i = 0; i < 50; i++) {
        const nextL = L0 * Math.tanh((2 * Math.PI * d) / L);
        if (Math.abs(nextL - L) < 1e-6) {
            L = nextL;
            break;
        }
        L = nextL;
    }

    // Goda (2000) depth & mound geometry
    const dw = moundHeight > 0 ? Math.max(0.2, d - moundHeight) : d;
    const d_prime = dw;
    const hb = d + 5 * waveHeight * 0.02; // Breaking depth approx (slope 1:50)
    const H_design = Math.min(1.8 * waveHeight, 0.78 * hb);

    // Goda pressure modification factors
    const k4d = (4 * Math.PI * d) / L;
    const k2d = (2 * Math.PI * d) / L;
    const alpha1 = 0.6 + 0.5 * Math.pow(k4d / Math.sinh(k4d), 2);
    const alpha2 = moundHeight > 0
        ? Math.min(((hb - dw) / (3 * hb)) * Math.pow(H_design / dw, 2), (2 * dw) / H_design)
        : 0;
    const alpha3 = 1 - (d_prime / hb) * (1 - 1 / Math.cosh(k2d));

    // Wave crest elevation above SWL
    const eta_star = 0.75 * (1 + cosBeta) * H_design;

    // Wall crest height above SWL (wallHeight is total height from foundation level to crest)
    const hc = Math.max(0, wallHeight - d_prime);
    const hc_star = Math.min(eta_star, hc);

    // Goda pressures (kPa) — note H_design multiplies (alpha1 + alpha2 cos^2 beta)
    const p1 = 0.5 * (1 + cosBeta) * (alpha1 + alpha2 * cosBeta * cosBeta) * (rho_w * g * H_design) / 1000;
    const p3 = alpha3 * p1;
    const p2 = eta_star > 0 ? p1 * Math.max(0, 1 - hc_star / eta_star) : 0;

    // Uplift pressure at seaward toe (kPa)
    const pu = 0.5 * (1 + cosBeta) * alpha1 * alpha3 * (rho_w * g * H_design) / 1000;

    // Integrated horizontal force over submerged wall (d_prime) + wetted emerged wall (hc_star)
    const F_sub = 0.5 * (p1 + p3) * d_prime;
    const F_emerged = 0.5 * (p1 + p2) * hc_star;
    const F_h = F_sub + F_emerged;

    // Overturning moment about landward heel (lever arm measured upward from wall base)
    const M_sub = p3 * d_prime * (d_prime / 2) + 0.5 * (p1 - p3) * d_prime * ((2 * d_prime) / 3);
    const M_emerged = p2 * hc_star * (d_prime + hc_star / 2) + 0.5 * (p1 - p2) * hc_star * (d_prime + hc_star / 3);
    const M_overturning = M_sub + M_emerged;

    // Uplift force & overturning moment about landward heel (triangular pressure from toe to 0 at heel -> arm = 2B/3)
    const B_eff = foundationWidth || wallThickness || 1.0;
    const F_uplift = 0.5 * pu * B_eff;
    const M_uplift = F_uplift * ((2 * B_eff) / 3);

    const warnings = [];
    if (d / L < 0.2) {
        warnings.push('Shallow water (d/L < 0.2) — verify breaking wave criterion');
    }
    if (waveHeight / d > 0.6) {
        warnings.push('Breaking wave condition (Hs/d > 0.6) — impact loads possible');
    }
    if (Math.abs(waveAngle) > 30) {
        warnings.push('Large wave angle (>30 deg) — oblique wave effects significant');
    }

    return {
        forces: {
            F_h,
            F_horizontal: F_h,
            F_uplift,
            p1,
            p2,
            p3,
            p4: pu,
            pu,
            M_overturning,
            M_uplift
        },
        pressures: {
            alpha1: alpha1.toFixed(3),
            alpha2: alpha2.toFixed(3),
            alpha3: alpha3.toFixed(3)
        },
        waveParams: {
            H_design: H_design.toFixed(2),
            L: L.toFixed(2),
            L0: L0.toFixed(2),
            eta_star: eta_star.toFixed(2),
            hc_star: hc_star.toFixed(2),
            d_over_L: (d / L).toFixed(3)
        },
        formula: 'p_1 = 0.5(1+\\cos\\beta)(\\alpha_1+\\alpha_2\\cos^2\\beta)\\rho_w g H_D, \\quad p_3 = \\alpha_3 p_1, \\quad p_u = 0.5(1+\\cos\\beta)\\alpha_1\\alpha_3\\rho_w g H_D',
        reference: 'Goda (2000) Random Seas and Design of Maritime Structures; CEM VI-5-3',
        warnings,
        note: 'Full Goda pressure integration over submerged and emerged wall faces with base uplift'
    };
}

/**
 * Check vertical wall stability (submerged buoyancy, uplift, sliding, overturning, bearing)
 * @param {object} params - Wall parameters with Goda forces
 * @returns {object} Stability check results
 */
function checkVerticalWallStability(params) {
    const {
        wallHeight,
        wallThickness,
        foundationWidth,
        depth = 0,
        moundHeight = 0,
        concreteDensity = 2400,
        fillDensity = 1800,
        frictionCoeff = 0.6,
        allowableBearing = 400,
        F_h,
        F_uplift = 0,
        M_overturning,
        M_uplift = 0
    } = params;

    const g = 9.81;
    const rho_w = 1025;
    const B = Math.max(foundationWidth || wallThickness || 1.0, 0.5);
    const t_wall = Math.min(wallThickness || B, B);

    // Dry weight per meter run
    const V_concrete = wallHeight * t_wall;
    const V_fill = wallHeight * Math.max(0, B - t_wall);
    const W_dry = ((V_concrete * concreteDensity + V_fill * fillDensity) * g) / 1000; // kN/m

    // Hydrostatic buoyancy on submerged volume below SWL
    const d_wall_submerged = Math.min(wallHeight, Math.max(0, depth - moundHeight));
    const buoyancy = (B * d_wall_submerged * rho_w * g) / 1000; // kN/m
    const W_submerged = Math.max(0, W_dry - buoyancy);

    // Effective vertical normal reaction after wave uplift
    const N_eff = Math.max(0, W_submerged - F_uplift);

    // Sliding check
    const mu = frictionCoeff;
    const FS_slide = F_h > 0 ? (mu * N_eff) / F_h : Infinity;

    // Overturning check about heel (including uplift moment)
    const M_resisting = W_submerged * (B / 2);
    const M_total_overturn = M_overturning + M_uplift;
    const FS_overturn = M_total_overturn > 0 ? M_resisting / M_total_overturn : Infinity;

    // Eccentric toe bearing pressure
    const M_net = M_resisting - M_total_overturn;
    const x_res = N_eff > 0 ? M_net / N_eff : 0;
    const eccentricity = B / 2 - x_res;
    let q_max;
    if (N_eff <= 0 || Math.abs(eccentricity) >= B / 2) {
        q_max = Infinity;
    } else if (Math.abs(eccentricity) <= B / 6) {
        q_max = (N_eff / B) * (1 + (6 * Math.abs(eccentricity)) / B);
    } else {
        q_max = (2 * N_eff) / (3 * (B / 2 - Math.abs(eccentricity)));
    }
    const FS_bearing = Number.isFinite(q_max) && q_max > 0 ? allowableBearing / q_max : 0;

    return {
        sliding: {
            FS: FS_slide,
            passed: FS_slide >= 1.2,
            required: 1.2,
            formula: 'FS_{\\text{slide}} = \\frac{\\mu (W\' - F_u)}{F_H}'
        },
        overturning: {
            FS: FS_overturn,
            passed: FS_overturn >= 1.2,
            required: 1.2,
            formula: 'FS_{\\text{overturn}} = \\frac{W\' \\cdot B/2}{M_H + M_u}'
        },
        bearing: {
            q_max,
            eccentricity,
            allowable: allowableBearing,
            FS: FS_bearing,
            passed: Number.isFinite(q_max) && q_max <= allowableBearing
        },
        weight: W_submerged,
        weightDry: W_dry,
        buoyancy,
        N_eff,
        reference: 'Goda (2000); CEM VI-5-4'
    };
}

// ==========================================
// COMPOSITE STRUCTURE CALCULATIONS
// ==========================================

/**
 * Calculate composite structure (rubble mound base + Goda vertical crown wall)
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
        concreteDensity = 2400,
        frictionCoeff = 0.6,
        waveHeight,
        wavePeriod = 10.0,
        depth
    } = params;

    const rho_w = 1025;
    const Delta = (matDensity - rho_w) / rho_w;

    // 1. Check rubble mound armour stability (Hudson formula with matDensity in numerator)
    const KD = 2.0; // Conservative mound shoulder KD
    const M_required = (matDensity * Math.pow(waveHeight, 3)) / (KD * Math.pow(Delta, 3) * moundSlope);
    const M_provided = matDensity * Math.pow(armourDn50, 3);
    const mound_stable = M_provided >= M_required;

    // 2. Modified Goda forces on vertical wall seated on mound (height above foundation = wallHeight)
    const wallForces = calculateVerticalWallForces({
        wallHeight,
        foundationWidth: wallThickness,
        wallThickness,
        moundHeight,
        depth,
        waveHeight,
        wavePeriod,
        waveAngle: 0
    });

    // 3. Wall stability with buoyancy + uplift
    const wallStability = checkVerticalWallStability({
        wallHeight,
        wallThickness,
        foundationWidth: wallThickness,
        depth,
        moundHeight,
        concreteDensity,
        fillDensity: concreteDensity,
        frictionCoeff,
        F_h: wallForces.forces.F_h,
        F_uplift: wallForces.forces.F_uplift,
        M_overturning: wallForces.forces.M_overturning,
        M_uplift: wallForces.forces.M_uplift
    });

    return {
        mound: {
            stable: mound_stable,
            moundWidth,
            W_required: M_required / 1000,
            W_provided: M_provided / 1000,
            formula: 'M_{50} = \\frac{\\rho_s H^3}{K_D \\Delta^3 \\cot\\alpha}',
            reference: 'Hudson Formula; CEM VI-5-3'
        },
        wall: {
            F_h: wallForces.forces.F_h,
            F_uplift: wallForces.forces.F_uplift,
            p1: wallForces.forces.p1,
            p3: wallForces.forces.p3,
            FS_slide: wallStability.sliding.FS,
            FS_overturn: wallStability.overturning.FS,
            q_max: wallStability.bearing.q_max,
            weightSubmerged: wallStability.weight,
            stable: wallStability.sliding.passed && wallStability.overturning.passed,
            formula: 'Modified Goda (2000) with rubble berm α₂',
            reference: 'Goda (2000); Takahashi (2002); CEM VI-5-4'
        },
        note: 'Composite structures combine rubble mound foundation protection with a vertical superstructure wall'
    };
}

// ==========================================
// CAISSON CALCULATIONS
// ==========================================

/**
 * Calculate cellular caisson stability (walls, slabs, fill, buoyancy, Goda uplift, eccentric bearing)
 * @param {object} params - Caisson parameters
 * @returns {object} Stability results
 */
function calculateCaissonStability(params) {
    const {
        caissonWidth,
        caissonHeight,
        wallThickness,
        cellCount = 3,
        foundationHeight = 2.0,
        concreteDensity = 2400,
        fillDensity = 1900,
        frictionCoeff = 0.6,
        allowableBearing = 500,
        waveHeight,
        wavePeriod = 11.0,
        waveAngle = 0,
        depth
    } = params;

    const g = 9.81;
    const rho_w = 1025;

    // Concrete volume per m length: base slab + top slab + (cellCount + 1) transverse/longitudinal walls
    const t = wallThickness;
    const innerH = Math.max(0, caissonHeight - 2 * t);
    const numWalls = Math.max(2, (parseInt(cellCount, 10) || 3) + 1);
    const totalWallThick = Math.min(caissonWidth, numWalls * t);
    const V_concrete = caissonWidth * Math.min(caissonHeight, 2 * t) + totalWallThick * innerH;
    const V_fill = Math.max(0, caissonWidth * caissonHeight - V_concrete);
    const W_dry = ((V_concrete * concreteDensity + V_fill * fillDensity) * g) / 1000;

    // Hydrostatic buoyancy below SWL on caisson resting at (depth - foundationHeight)
    const d_caisson = Math.max(0, depth - foundationHeight);
    const d_sub = Math.min(caissonHeight, d_caisson);
    const buoyancy = (caissonWidth * d_sub * rho_w * g) / 1000;
    const W_sub = Math.max(0, W_dry - buoyancy);

    // Goda forces & uplift
    const forces = calculateVerticalWallForces({
        wallHeight: caissonHeight,
        foundationWidth: caissonWidth,
        wallThickness: caissonWidth,
        moundHeight: foundationHeight,
        depth,
        waveHeight,
        wavePeriod,
        waveAngle
    });

    const F_h = forces.forces.F_h;
    const F_uplift = forces.forces.F_uplift;
    const M_overturning = forces.forces.M_overturning;
    const M_uplift = forces.forces.M_uplift;

    // Sliding check with buoyancy & uplift
    const N_eff = Math.max(0, W_sub - F_uplift);
    const FS_slide = F_h > 0 ? (frictionCoeff * N_eff) / F_h : Infinity;

    // Overturning check about heel
    const M_resisting = W_sub * (caissonWidth / 2);
    const M_total_overturn = M_overturning + M_uplift;
    const FS_overturn = M_total_overturn > 0 ? M_resisting / M_total_overturn : Infinity;

    // Eccentric trapezoidal / triangular toe bearing pressure
    const M_net = M_resisting - M_total_overturn;
    const x_res = N_eff > 0 ? M_net / N_eff : 0;
    const eccentricity = caissonWidth / 2 - x_res;
    let bearing_pressure;
    if (N_eff <= 0 || Math.abs(eccentricity) >= caissonWidth / 2) {
        bearing_pressure = Infinity;
    } else if (Math.abs(eccentricity) <= caissonWidth / 6) {
        bearing_pressure = (N_eff / caissonWidth) * (1 + (6 * Math.abs(eccentricity)) / caissonWidth);
    } else {
        bearing_pressure = (2 * N_eff) / (3 * (caissonWidth / 2 - Math.abs(eccentricity)));
    }
    const FS_bearing = Number.isFinite(bearing_pressure) && bearing_pressure > 0
        ? allowableBearing / bearing_pressure
        : 0;

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
            eccentricity,
            allowable: allowableBearing,
            FS: FS_bearing,
            passed: Number.isFinite(bearing_pressure) && FS_bearing >= 1.5,
            required: 1.5
        },
        forces: forces.forces,
        weight: W_sub,
        weightDry: W_dry,
        buoyancy,
        N_eff,
        formula: 'Goda (2000) forces + buoyancy + uplift + eccentric bearing',
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
