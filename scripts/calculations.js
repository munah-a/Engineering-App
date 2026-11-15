// ==========================================
// COASTAL ENGINEERING CALCULATIONS
// ==========================================

// ==========================================
// WAVE CALCULATIONS
// ==========================================

/**
 * Solve linear wave dispersion relation iteratively: L = L0 * tanh(2πd / L)
 * @param {number} T - Wave period (s)
 * @param {number} d - Water depth (m)
 * @returns {{L0: number, L: number}} Deep water and local wavelengths (m)
 */
function solveDispersionWavelength(T, d) {
    const g = 9.81;
    if (T <= 0) return { L0: 0, L: 0 };
    const L0 = (g * T * T) / (2 * Math.PI);
    if (d <= 0) return { L0, L: 0 };

    let L = L0 * Math.tanh(Math.pow((2 * Math.PI * Math.sqrt(d / g)) / T, 1.5));
    if (!Number.isFinite(L) || L <= 0) L = L0;

    for (let i = 0; i < 50; i++) {
        const k = (2 * Math.PI) / L;
        const nextL = L0 * Math.tanh(k * d);
        if (Math.abs(nextL - L) < 1e-6) {
            L = nextL;
            break;
        }
        L = nextL;
    }

    return { L0, L };
}

/**
 * Calculate fetch-limited wave growth using SMB method
 * @param {number} U10 - Wind speed at 10m height (m/s)
 * @param {number} F - Fetch length (m)
 * @param {number} d - Water depth (m)
 * @returns {object} Wave parameters {Hs, Tp, Tm, L, L0}
 */
function calculateSMBWaves(U10, F, d) {
    const g = 9.81; // gravity
    if (U10 <= 0 || F <= 0) {
        return { Hs: 0, Tp: 0, Tm: 0, L: 0, L0: 0 };
    }

    // Non-dimensional fetch
    const Fstar = (g * F) / (U10 * U10);

    // Non-dimensional significant wave height (SMB formula)
    const Hsstar = 0.283 * Math.tanh(0.530 * Math.pow(Fstar, 0.375));

    // Non-dimensional peak period
    const Tpstar = 7.54 * Math.tanh(0.833 * Math.pow(Fstar, 0.375));

    // Dimensional values
    const Hs = Hsstar * (U10 * U10) / g;
    const Tp = Tpstar * U10 / g;
    const Tm = Tp / 1.1;

    // Iterative dispersion wavelength
    const { L0, L } = solveDispersionWavelength(Tp, d);

    return { Hs, Tp, Tm, L, L0 };
}

/**
 * Calculate fetch-limited wave growth using JONSWAP
 * @param {number} U10 - Wind speed at 10m height (m/s)
 * @param {number} F - Fetch length (m)
 * @param {number} d - Water depth (m)
 * @returns {object} Wave parameters {Hs, Tp, Tm, L, L0}
 */
function calculateJONSWAPWaves(U10, F, d) {
    const g = 9.81;
    if (U10 <= 0 || F <= 0) {
        return { Hs: 0, Tp: 0, Tm: 0, L: 0, L0: 0 };
    }

    // Non-dimensional fetch
    const Xstar = (g * F) / (U10 * U10);

    // JONSWAP formulas
    const Hsstar = 0.0016 * Math.pow(Xstar, 0.5);
    const fstar = 3.5 * Math.pow(Xstar, -0.33);

    const Hs = Hsstar * (U10 * U10) / g;
    const fp = fstar * g / U10;
    const Tp = 1 / fp;
    const Tm = Tp / 1.1;

    // Iterative dispersion wavelength
    const { L0, L } = solveDispersionWavelength(Tp, d);

    return { Hs, Tp, Tm, L, L0 };
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
 * Unified Van der Meer (1988) rubble mound armour stability calculation
 * Uses critical Iribarren number xi_mc for plunging/surging branch selection.
 * @param {number} Hs - Significant wave height at toe (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} Delta - Relative buoyant density (rho_s / rho_w - 1)
 * @param {number} cotAlpha - Slope cotangent (e.g. 1.5 for 1V:1.5H)
 * @param {number} [rho_a=2650] - Armour stone density (kg/m³)
 * @param {number} [P=0.4] - Notional permeability factor (0.1–0.6)
 * @param {number} [S=2.0] - Damage level (2 = start of damage)
 * @param {number} [N=3000] - Number of storm waves (clamped 100–7500)
 * @returns {object} Van der Meer stability results
 */
function calculateVanDerMeer(Hs, Tm, Delta, cotAlpha, rho_a = 2650, P = 0.4, S = 2.0, N = 3000) {
    if (Hs <= 0 || Tm <= 0 || Delta <= 0 || cotAlpha <= 0) {
        return {
            xi_m: 0, xi_mc: 0, Ns: 0, Ns_plunging: 0, Ns_surging: 0,
            regime: 'invalid', Dn50: 0, M50: 0, W50_tonnes: 0
        };
    }

    const g = 9.81;
    const effN = Math.min(Math.max(N || 3000, 100), 7500);
    const effP = Math.min(Math.max(P, 0.05), 0.65);
    const tanAlpha = 1 / cotAlpha;
    const Lm = (g * Tm * Tm) / (2 * Math.PI);
    const xi_m = tanAlpha / Math.sqrt(Hs / Lm);

    // Critical transition Iribarren number (Van der Meer 1988 / Rock Manual Eq. 5.138)
    const xi_mc = Math.pow(6.2 * Math.pow(effP, 0.31) * Math.sqrt(tanAlpha), 1 / (effP + 0.5));
    const damageTerm = Math.pow(S / Math.sqrt(effN), 0.2);

    const Ns_plunging = 6.2 * Math.pow(effP, 0.18) * damageTerm * Math.pow(xi_m, -0.5);
    const Ns_surging = 1.0 * Math.pow(effP, -0.13) * damageTerm * Math.sqrt(cotAlpha) * Math.pow(xi_m, effP);

    // Plunging governs for xi_m < xi_mc or gentle slopes cot(alpha) >= 4.0
    const isPlunging = cotAlpha >= 4.0 || xi_m < xi_mc;
    const regime = isPlunging ? 'plunging' : 'surging';
    const Ns = isPlunging ? Ns_plunging : Ns_surging;

    const Dn50 = Hs / (Delta * Ns);
    const M50 = rho_a * Math.pow(Dn50, 3);

    return {
        xi_m,
        xi_mc,
        Ns,
        Ns_plunging,
        Ns_surging,
        regime,
        Dn50,
        M50,
        W50_tonnes: M50 / 1000
    };
}

/**
 * Van der Meer (1988) formula for plunging waves
 * @param {number} Hs - Significant wave height (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} cotAlpha - Slope cotangent (1V:cotAlpha H)
 * @param {number} [P=0.4] - Permeability factor
 * @param {number} [N=3000] - Number of storm waves
 * @param {number} [S=2.0] - Damage level
 * @param {number} [Delta=1.585] - Relative density (rho_s/rho_w - 1)
 * @param {number} [rho_a=2650] - Stone density (kg/m³)
 * @returns {object} Plunging stability parameters
 */
function vanderMeerPlunging(Hs, Tm, cotAlpha, P = 0.4, N = 3000, S = 2.0, Delta = 2650 / 1025 - 1, rho_a = 2650) {
    const res = calculateVanDerMeer(Hs, Tm, Delta, cotAlpha, rho_a, P, S, N);
    const requiredDn50 = res.Ns_plunging > 0 ? Hs / (Delta * res.Ns_plunging) : 0;
    return {
        requiredDn50,
        Dn50: requiredDn50,
        xi: res.xi_m,
        xi_mc: res.xi_mc,
        stabilityNumber: res.Ns_plunging,
        M50: rho_a * Math.pow(requiredDn50, 3),
        formula: 'Hs/ΔDn50 = 6.2 * P^0.18 * (S/√N)^0.2 * ξm^-0.5'
    };
}

/**
 * Van der Meer (1988) formula for surging waves
 * @param {number} Hs - Significant wave height (m)
 * @param {number} Tm - Mean wave period (s)
 * @param {number} cotAlpha - Slope cotangent (1V:cotAlpha H)
 * @param {number} [P=0.4] - Permeability factor
 * @param {number} [N=3000] - Number of storm waves
 * @param {number} [S=2.0] - Damage level
 * @param {number} [Delta=1.585] - Relative density (rho_s/rho_w - 1)
 * @param {number} [rho_a=2650] - Stone density (kg/m³)
 * @returns {object} Surging stability parameters
 */
function vanderMeerSurging(Hs, Tm, cotAlpha, P = 0.4, N = 3000, S = 2.0, Delta = 2650 / 1025 - 1, rho_a = 2650) {
    const res = calculateVanDerMeer(Hs, Tm, Delta, cotAlpha, rho_a, P, S, N);
    const requiredDn50 = res.Ns_surging > 0 ? Hs / (Delta * res.Ns_surging) : 0;
    return {
        requiredDn50,
        Dn50: requiredDn50,
        xi: res.xi_m,
        xi_mc: res.xi_mc,
        stabilityNumber: res.Ns_surging,
        M50: rho_a * Math.pow(requiredDn50, 3),
        formula: 'Hs/ΔDn50 = 1.0 * P^-0.13 * (S/√N)^0.2 * √cotα * ξm^P'
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
 * Goda (2000) formula for wave pressure on vertical walls
 * @param {number} H - Design wave height (m)
 * @param {number} d - Water depth at structure toe (m)
 * @param {number} h - Total wall height above seabed (m)
 * @param {number} L - Wavelength at depth d (m)
 * @param {number} [betaDeg=0] - Oblique wave approach angle (degrees)
 * @param {number} [moundHeight=0] - Rubble foundation mound height above seabed (m)
 * @returns {object} Pressure distribution (kPa) and integrated forces (kN/m)
 */
function godaWavePressure(H, d, h, L, betaDeg = 0, moundHeight = 0) {
    const rho_w = 1025; // Seawater density (kg/m³)
    const g = 9.81;
    if (H <= 0 || d <= 0 || L <= 0) {
        return { p1: 0, p2: 0, p3: 0, p_uplift: 0, pu: 0, F_h: 0, eta_star: 0, alpha1: 0, alpha2: 0, alpha3: 0 };
    }

    const beta = (betaDeg * Math.PI) / 180;
    const cosBeta = Math.cos(beta);
    const dw = moundHeight > 0 ? Math.max(0.2, d - moundHeight) : d;
    const d_prime = dw;
    const hc = Math.max(0, h - d); // Wall crest elevation above SWL
    const hb = d + 5 * H * 0.02;

    const k4d = (4 * Math.PI * d) / L;
    const k2d = (2 * Math.PI * d) / L;
    const alpha1 = 0.6 + 0.5 * Math.pow(k4d / Math.sinh(k4d), 2);
    const alpha2 = moundHeight > 0
        ? Math.min(((hb - dw) / (3 * hb)) * Math.pow(H / dw, 2), (2 * dw) / H)
        : 0;
    const alpha3 = 1 - (d_prime / hb) * (1 - 1 / Math.cosh(k2d));

    const eta_star = 0.75 * (1 + cosBeta) * H;
    const p1 = 0.5 * (1 + cosBeta) * (alpha1 + alpha2 * cosBeta * cosBeta) * (rho_w * g * H) / 1000;
    const p3 = alpha3 * p1;
    const hc_star = Math.min(eta_star, hc);
    const p2 = eta_star > 0 ? p1 * Math.max(0, 1 - hc_star / eta_star) : 0;
    const p_uplift = 0.5 * (1 + cosBeta) * alpha1 * alpha3 * (rho_w * g * H) / 1000;

    const F_h = 0.5 * (p1 + p3) * d_prime + 0.5 * (p1 + p2) * hc_star;

    return {
        p1,
        p2,
        p3,
        p_uplift,
        pu: p_uplift,
        F_h,
        eta_star,
        hc_star,
        alpha1,
        alpha2,
        alpha3
    };
}

/**
 * Sliding stability check for vertical structures
 * @param {number} F_h - Horizontal force (kN)
 * @param {number} W - Structure submerged weight (kN)
 * @param {number} F_uplift - Uplift force (kN)
 * @param {number} mu - Friction coefficient
 * @returns {object} Sliding stability
 */
function checkSlidingStability(F_h, W, F_uplift, mu = 0.6) {
    const F_v = Math.max(0, W - F_uplift);
    const F_r = mu * F_v;
    const SF_sliding = F_h > 0 ? F_r / F_h : Infinity;

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
    const SF_overturning = M_overturning > 0 ? M_resisting / M_overturning : Infinity;

    return {
        resistingMoment: M_resisting,
        overturningMoment: M_overturning,
        safetyFactor: SF_overturning,
        isStable: SF_overturning >= 1.5
    };
}

// ==========================================
// SERVICEABILITY - EUROTOP (2018) FORMULAS
// ==========================================

/**
 * Lanczos approximation for the Gamma function Γ(z)
 * @param {number} z - Input value (> 0)
 * @returns {number} Γ(z)
 */
function gammaLanczos(z) {
    const p = [
        676.5203681218851, -1259.1392167224028, 771.32342877765313,
        -176.61502916214059, 12.507343278686905, -0.13857109526572012,
        9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) {
        return Math.PI / (Math.sin(Math.PI * z) * gammaLanczos(1 - z));
    }
    const t = z - 1 + 7.5;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
        x += p[i] / (z - 1 + i + 1);
    }
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z - 0.5) * Math.exp(-t) * x;
}

/**
 * EurOtop (2018) mean overtopping discharge (Equations 5.10, 5.11, 5.19 & 5.20/5.22)
 * Uses continuous minimum of breaking (Eq. 5.10) and non-breaking max (Eq. 5.11).
 * @param {number} Hm0 - Significant wave height at toe (m)
 * @param {number} Tm_10 - Spectral wave period Tm-1,0 (s)
 * @param {number} Rc - Crest freeboard relative to SWL (m, negative if submerged)
 * @param {number} alphaDeg - Seaward slope angle (degrees)
 * @param {number} [gamma_f=0.55] - Surface roughness factor
 * @param {number} [gamma_b=1.0] - Berm factor
 * @param {number} [gamma_beta=1.0] - Wave obliquity factor
 * @param {number} [gamma_v=1.0] - Crest wall / bullnose factor
 * @param {number} [Gc=0] - Armoured crest width (m)
 * @returns {object} { q (m³/s/m), q_l_s_m (L/s/m), xi_m10, regime, Cr, Ru2 }
 */
function calculateEurOtopOvertopping(
    Hm0,
    Tm_10,
    Rc,
    alphaDeg,
    gamma_f = 0.55,
    gamma_b = 1.0,
    gamma_beta = 1.0,
    gamma_v = 1.0,
    Gc = 0
) {
    if (Hm0 <= 0 || Tm_10 <= 0) {
        return { q: 0, q_l_s_m: 0, xi_m10: 0, regime: 'none', Cr: 1.0, Ru2: 0 };
    }

    const g = 9.81;
    const alphaRad = (alphaDeg * Math.PI) / 180;
    const tanAlpha = Math.max(0.05, Math.tan(alphaRad));
    const Lm_10 = (g * Tm_10 * Tm_10) / (2 * Math.PI);
    const xi_m10 = tanAlpha / Math.sqrt(Hm0 / Lm_10);

    // 2% wave run-up height Ru2% (EurOtop 2018 Eq. 5.1 & 5.2 Mean Value)
    const ru_break = 1.65 * gamma_b * gamma_f * gamma_beta * xi_m10 * Hm0;
    const ru_max = 1.00 * gamma_f * gamma_beta * (4.0 - 1.5 / Math.sqrt(Math.max(0.1, gamma_b * xi_m10))) * Hm0;
    const Ru2 = Math.max(0.1 * Hm0, Math.min(ru_break, ru_max));

    // Armoured crest width reduction factor Cr (Besley 1999 / EurOtop Eq. 5.19)
    const Cr = (Gc > 0 && gamma_f < 0.99 && (Gc / Hm0) > 0.75)
        ? Math.min(1.0, 3.06 * Math.exp(-1.5 * (Gc / Hm0)))
        : 1.0;

    const rootFactor = Math.sqrt(g * Math.pow(Hm0, 3));

    // Zero or negative freeboard (EurOtop 2018 Section 5.3.5)
    if (Rc <= 0) {
        const q_dim_zero = Math.min((0.023 / Math.sqrt(tanAlpha)) * gamma_b * xi_m10, 0.09);
        const q_zero = q_dim_zero * Cr * rootFactor;
        const q_weir = Rc < 0 ? 0.54 * Math.sqrt(g * Math.pow(Math.abs(Rc), 3)) : 0;
        const q = q_weir + q_zero;
        return {
            q,
            q_l_s_m: q * 1000,
            xi_m10,
            regime: Rc < 0 ? 'submerged-overflow' : 'zero-freeboard',
            Cr,
            Ru2
        };
    }

    // EurOtop (2018) Eq. 5.10 (Breaking) & Eq. 5.11 (Non-breaking cap)
    const denomBreak = Math.max(1e-6, xi_m10 * Hm0 * gamma_b * gamma_f * gamma_beta * gamma_v);
    const argBreak = (2.7 * Rc) / denomBreak;
    const q_dim_break = (0.023 / Math.sqrt(tanAlpha)) * gamma_b * xi_m10 * Math.exp(-Math.pow(argBreak, 1.3));

    const denomMax = Math.max(1e-6, Hm0 * gamma_f * gamma_beta * gamma_v);
    const argMax = (1.5 * Rc) / denomMax;
    const q_dim_max = 0.09 * Math.exp(-Math.pow(argMax, 1.3));

    const q_dim = Math.min(q_dim_break, q_dim_max);
    const regime = q_dim_break <= q_dim_max ? 'breaking' : 'non-breaking';
    const q = q_dim * Cr * rootFactor;

    return {
        q,
        q_l_s_m: q * 1000,
        xi_m10,
        regime,
        Cr,
        Ru2
    };
}

/**
 * Maximum individual overtopping wave volume Vmax (m³/m) per EurOtop (2018) Section 5.5 (Eq. 5.52–5.56)
 * @param {number} Hm0 - Significant wave height (m)
 * @param {number} Tm_10 - Spectral wave period Tm-1,0 (s)
 * @param {number} Rc - Crest freeboard (m)
 * @param {number} [q_m3_s_m] - Mean overtopping discharge (m³/s/m)
 * @param {object} [opts={}] - Optional { stormDurationSec, Ru2, alphaDeg, gamma_f, gamma_b, gamma_beta, gamma_v, Gc }
 * @returns {number} Maximum individual wave volume Vmax (m³/m)
 */
function calculateIndividualWaveVolume(Hm0, Tm_10, Rc, q_m3_s_m, opts = {}) {
    if (Hm0 <= 0 || Tm_10 <= 0) return 0;

    let q_val = q_m3_s_m;
    let Ru2 = opts.Ru2;

    if (q_val === undefined || Ru2 === undefined) {
        const ot = calculateEurOtopOvertopping(
            Hm0,
            Tm_10,
            Rc,
            opts.alphaDeg !== undefined ? opts.alphaDeg : 35,
            opts.gamma_f !== undefined ? opts.gamma_f : 0.55,
            opts.gamma_b !== undefined ? opts.gamma_b : 1.0,
            opts.gamma_beta !== undefined ? opts.gamma_beta : 1.0,
            opts.gamma_v !== undefined ? opts.gamma_v : 1.0,
            opts.Gc !== undefined ? opts.Gc : 0
        );
        if (q_val === undefined) q_val = ot.q;
        if (Ru2 === undefined) Ru2 = ot.Ru2;
    }

    if (!Number.isFinite(q_val) || q_val <= 1e-9) return 0;

    const Tm = Tm_10 / 1.1;
    const stormDurationSec = opts.stormDurationSec || 10800; // 3-hour design storm
    const Nw = Math.max(1, stormDurationSec / Tm);

    // Probability of overtopping per wave (EurOtop Eq. 5.51)
    const Pow = Rc <= 0
        ? 1.0
        : Math.exp(-Math.pow(Math.sqrt(-Math.log(0.02)) * (Rc / Math.max(0.05, Ru2)), 2));

    if (Pow <= 1e-6) return 0;

    const Now = Math.max(1, Pow * Nw);

    // Weibull shape factor b (EurOtop Eq. 5.54) and scale factor a (Eq. 5.53)
    const b = Math.min(10, 0.73 + 55 * Math.pow(q_val / (9.81 * Hm0 * Tm_10), 0.8));
    const a = (1 / gammaLanczos(1 + 1 / b)) * ((q_val * Tm) / Pow);

    return Now <= 1 ? a : a * Math.pow(Math.log(Now), 1 / b);
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

function _readStaticSI(id, fallback) {
    if (typeof window !== 'undefined' && typeof window.readSIInput === 'function') {
        return window.readSIInput(id, fallback);
    }
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (!el) return fallback;
    const val = parseFloat(el.value);
    return Number.isFinite(val) ? val : fallback;
}

function _readDesignParam(key, fallback) {
    if (typeof window !== 'undefined' && typeof window.getDesignValue === 'function') {
        return window.getDesignValue(key, fallback);
    }
    const el = typeof document !== 'undefined' ? (document.getElementById('design_' + key) || document.getElementById(key)) : null;
    if (!el) return fallback;
    if (el.type === 'checkbox') return Boolean(el.checked);
    if (el.tagName === 'SELECT') {
        const num = parseFloat(el.value);
        return Number.isFinite(num) && String(num) === String(el.value).trim() ? num : el.value;
    }
    const val = parseFloat(el.value);
    return Number.isFinite(val) ? val : fallback;
}

function performWaveCalculations() {
    // Get SI inputs
    const windSpeed = _readStaticSI('windSpeed', 15);
    const fetchLength = _readStaticSI('fetchLength', 5000);
    const offshoreDepth = _readStaticSI('offshoreDepth', 30);
    const toeDepth = _readStaticSI('toeDepthWave', 5);
    const waveAngle = parseFloat(document.getElementById('waveAngle')?.value || 0) || 0;
    const method = document.getElementById('waveMethod')?.value || 'smb';

    // DWL inputs
    const msl = _readStaticSI('msl', 0);
    const tidalRange = _readStaticSI('tidalRange', 2.5);
    const slr = _readStaticSI('slr', 0.5);

    // Calculate offshore waves
    const waveResult = method === 'smb'
        ? calculateSMBWaves(windSpeed, fetchLength, offshoreDepth)
        : calculateJONSWAPWaves(windSpeed, fetchLength, offshoreDepth);

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

        const assumedSlope = 1.5;
        runupResult = WaveTransformation.calculateWaveRunup(
            transformation.toe.H,
            waveResult.Tp,
            assumedSlope,
            'rock'
        );
    }

    // Calculate wave setup & DWL
    const setup = calculateWaveSetup(waveResult.Hs, offshoreDepth);
    const dwlResult = calculateDWL(msl, tidalRange, slr, setup);

    const isImperial = typeof AppState !== 'undefined' && AppState.unitSystem === 'imperial';
    const lenFactor = isImperial ? 3.28084 : 1.0;
    const lenUnit = isImperial ? 'ft' : 'm';

    // Update setup field
    const waveSetupInput = document.getElementById('waveSetup');
    if (waveSetupInput) waveSetupInput.value = (setup * lenFactor).toFixed(3);

    // Display offshore results
    document.getElementById('resultHs').textContent = `${(waveResult.Hs * lenFactor).toFixed(2)} ${lenUnit}`;
    document.getElementById('resultTp').textContent = `${waveResult.Tp.toFixed(2)} s`;
    document.getElementById('resultL').textContent = `${(waveResult.L0 * lenFactor).toFixed(2)} ${lenUnit}`;

    // Display transformation results
    if (transformation) {
        document.getElementById('resultHtoe').textContent = `${(transformation.toe.H * lenFactor).toFixed(2)} ${lenUnit}`;
        document.getElementById('resultKs').textContent = transformation.coefficients.Ks.toFixed(3);
        document.getElementById('resultKr').textContent = transformation.coefficients.Kr.toFixed(3);
        document.getElementById('resultDepthLimited').textContent = transformation.breaking.isDepthLimited ? 'Yes' : 'No';
    }

    // Display run-up results
    if (runupResult) {
        document.getElementById('resultXi').textContent = runupResult.xi.toFixed(2);
        document.getElementById('resultBreakingType').textContent = runupResult.breakingType.charAt(0).toUpperCase() + runupResult.breakingType.slice(1);
        document.getElementById('resultRunup').textContent = `${(runupResult.Ru * lenFactor).toFixed(2)} ${lenUnit}`;
        const rundown = WaveTransformation.calculateWaveRundown(runupResult.Ru);
        document.getElementById('resultRundown').textContent = `${(rundown * lenFactor).toFixed(2)} ${lenUnit}`;
    }

    // Display DWL results
    document.getElementById('resultHTL').textContent = `${(dwlResult.HTL * lenFactor).toFixed(2)} ${lenUnit}`;
    document.getElementById('resultSetup').textContent = `${(setup * lenFactor).toFixed(3)} ${lenUnit}`;
    document.getElementById('resultDWL').textContent = `${(dwlResult.DWL * lenFactor).toFixed(2)} ${lenUnit}`;

    // Display formulas (strictly SI in formula documentation for clarity)
    const formulaDisplay = document.getElementById('formulaDisplay');
    if (formulaDisplay) {
        let formulaHTML = `
            <p><strong>${method.toUpperCase()} Method (Offshore):</strong></p>
            <p>$$H_s = ${waveResult.Hs.toFixed(2)} \\text{ m}, \\quad T_p = ${waveResult.Tp.toFixed(2)} \\text{ s}$$</p>
            <p>$$L_0 = ${waveResult.L0.toFixed(2)} \\text{ m}, \\quad L_{\\text{offshore}} = ${waveResult.L.toFixed(2)} \\text{ m} \\; (d_0 = ${offshoreDepth.toFixed(1)} \\text{ m})$$</p>
        `;

        if (transformation) {
            formulaHTML += `
                <p><strong>Wave Transformation (Offshore to Toe):</strong></p>
                <p>$$K_s = \\sqrt{\\frac{n_0 L_{\\text{offshore}}}{n_{\\text{toe}} L_{\\text{toe}}}} = ${transformation.coefficients.Ks.toFixed(3)}, \\quad K_r = ${transformation.coefficients.Kr.toFixed(3)} \\; (\\beta_0 = ${waveAngle}^\\circ)$$</p>
                <p>$$H_{\\text{toe}} = H_0 \\times K_s \\times K_r = ${waveResult.Hs.toFixed(2)} \\times ${transformation.coefficients.Ks.toFixed(3)} \\times ${transformation.coefficients.Kr.toFixed(3)} = ${transformation.toe.H.toFixed(2)} \\text{ m}$$</p>
                <p>$$H_{\\max} = 0.78 \\times d_{\\text{toe}} = 0.78 \\times ${toeDepth.toFixed(1)} = ${transformation.breaking.H_max.toFixed(2)} \\text{ m}$$</p>
            `;

            if (transformation.breaking.isDepthLimited) {
                formulaHTML += `<p style="color: var(--color-warning);"><strong>Note:</strong> Wave height is depth-limited at toe ($H_{\\text{toe}} = H_{\\max}$)</p>`;
            }
        }

        if (runupResult) {
            formulaHTML += `
                <p><strong>Surf Similarity &amp; Wave Run-up (CEM 5-13):</strong></p>
                <p>$$\\xi_m = \\frac{\\tan\\alpha}{\\sqrt{H/L_0}} = ${runupResult.xi.toFixed(2)} \\text{ (${runupResult.breakingType})}$$</p>
                <p>$$R_u = ${runupResult.Ru.toFixed(2)} \\text{ m} \\quad (\\gamma_r = ${runupResult.gamma_r}), \\quad R_d \\approx ${WaveTransformation.calculateWaveRundown(runupResult.Ru).toFixed(2)} \\text{ m}$$</p>
            `;
        }

        formulaHTML += `
            <p><strong>Design Water Level Breakdown:</strong></p>
            <p>$$HTL = MSL + \\frac{\\text{Range}}{2} = ${msl.toFixed(2)} + \\frac{${tidalRange.toFixed(2)}}{2} = ${dwlResult.HTL.toFixed(2)} \\text{ m}$$</p>
            <p>$$SLR = ${slr.toFixed(2)} \\text{ m}, \\quad \\eta = ${setup.toFixed(3)} \\text{ m}$$</p>
            <p>$$DWL = HTL + SLR + \\eta = ${dwlResult.HTL.toFixed(3)} + ${slr.toFixed(3)} + ${setup.toFixed(3)} = ${dwlResult.DWL.toFixed(2)} \\text{ m}$$</p>
            <br>
            <p style="font-size: 0.85em; color: var(--color-text-muted);"><em>Ref: USACE Coastal Engineering Manual (CEM) Ch 5-13; EurOtop (2018) Eq 4.1.</em></p>
        `;

        formulaDisplay.innerHTML = formulaHTML;

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
        ...dwlResult,
        dwl: {
            ...dwlResult,
            components: { msl, tidalRange, slr, setup }
        }
    };

    // Update Global Parameters for other modules
    if (typeof GlobalParams !== 'undefined') {
        const designWaveHeight = transformation ? transformation.toe.H : waveResult.Hs;
        GlobalParams.setGlobal('waveHeight', parseFloat(designWaveHeight.toFixed(2)), 'calculation');
        GlobalParams.setGlobal('wavePeriod', parseFloat(waveResult.Tp.toFixed(2)), 'calculation');
        GlobalParams.setGlobal('toeDepth', parseFloat(toeDepth.toFixed(2)), 'calculation');
    }

    if (window.projectManager && window.projectManager.getCurrentProject()) {
        window.projectManager.saveWaveAnalysisToCurrentProject(AppState.waveData)
            .catch(err => console.error('Failed to save wave analysis to project:', err));
    }
}

function performOvertoppingCalculations() {
    // Get SI inputs
    const freeboard = _readStaticSI('freeboard', 3.0);
    const slopeAngle = parseFloat((document.getElementById('slopeAngle') || document.getElementById('structureSlope'))?.value || 35) || 35;
    const crestWidth = _readStaticSI('crestWidth', 5.0);
    const gamma_f = parseFloat(document.getElementById('surfaceRoughness')?.value || 0.55) || 0.55;

    const waveHeightRaw = _readStaticSI('waveHeight', 2.5);
    const wavePeriod = _readStaticSI('wavePeriod', 8.0);
    const toeDepth = _readStaticSI('toeDepth', 10.0);

    // Check depth-limited breaking at structure toe
    const Hmax_toe = toeDepth > 0 ? 0.78 * toeDepth : Infinity;
    const isDepthLimited = waveHeightRaw > Hmax_toe;
    const waveHeight = isDepthLimited ? Hmax_toe : waveHeightRaw;

    // Optional bullnose influence if enabled in Designer
    const hasBullnose = Boolean(_readDesignParam('hasBullnose', false));
    const gamma_v = hasBullnose ? (_readDesignParam('bullnoseFactor', 0.7) || 1.0) : 1.0;

    // Calculate EurOtop (2018) overtopping & Weibull Vmax
    const ot = calculateEurOtopOvertopping(waveHeight, wavePeriod, freeboard, slopeAngle, gamma_f, 1.0, 1.0, gamma_v, crestWidth);
    const Vmax = calculateIndividualWaveVolume(waveHeight, wavePeriod, freeboard, ot.q, {
        Ru2: ot.Ru2,
        alphaDeg: slopeAngle,
        gamma_f,
        gamma_v,
        Gc: crestWidth
    });
    const safety = assessSafetyThresholds(ot.q_l_s_m);

    const isImperial = typeof AppState !== 'undefined' && AppState.unitSystem === 'imperial';
    const qDisplay = isImperial ? `${(ot.q_l_s_m * 0.0107639).toFixed(4)} ft³/s/ft` : `${ot.q_l_s_m.toFixed(4)} l/s/m`;
    const vDisplay = isImperial ? `${(Vmax * 10.7639).toFixed(3)} ft³/ft` : `${Vmax.toFixed(3)} m³/m`;

    // Display results
    document.getElementById('resultQ').textContent = qDisplay;
    document.getElementById('resultVmax').textContent = vDisplay;
    document.getElementById('resultRate').textContent = ot.q_l_s_m < 0.01 ? 'Very Low' : ot.q_l_s_m < 1 ? 'Low' : ot.q_l_s_m < 10 ? 'Moderate' : 'High';

    // Update safety indicators
    updateSafetyIndicator('pedestrianSafety', safety.pedestrian);
    updateSafetyIndicator('vehicleSafety', safety.vehicle);
    updateSafetyIndicator('buildingSafety', safety.building);

    // Detailed Calculation Display (EurOtop 2018)
    const calcContainer = document.getElementById('serviceabilityDetailedCalc');
    const formulaDiv = document.getElementById('overtoppingFormulas');

    if (calcContainer && formulaDiv) {
        calcContainer.style.display = 'block';

        const g = 9.81;
        const Lm = (g * wavePeriod * wavePeriod) / (2 * Math.PI);
        const tanAlpha = Math.tan(slopeAngle * Math.PI / 180);

        let formulaHTML = `
            <p><strong>Input &amp; Modification Factors:</strong></p>
            <ul>
                <li>Freeboard ($R_c$): ${freeboard.toFixed(2)} m</li>
                <li>Wave Height ($H_{m0}$): ${waveHeight.toFixed(2)} m ${isDepthLimited ? `(depth-limited from ${waveHeightRaw.toFixed(2)} m at $d_{\\text{toe}}=${toeDepth.toFixed(1)}$ m)` : ''}</li>
                <li>Mean Period ($T_{m-1,0}$): ${wavePeriod.toFixed(2)} s</li>
                <li>Slope ($\\alpha / \\cot\\alpha$): ${slopeAngle.toFixed(1)}&deg; ($1:${(1 / tanAlpha).toFixed(2)}$)</li>
                <li>Roughness Factor ($\\gamma_f$): ${gamma_f.toFixed(2)}, Crest Width Reduction ($C_r$): ${ot.Cr.toFixed(3)} ($G_c=${crestWidth.toFixed(2)}$ m)</li>
                ${hasBullnose ? `<li>Bullnose / Parapet Factor ($\\gamma_v$): ${gamma_v.toFixed(2)}</li>` : ''}
            </ul>
            <p><strong>Derived Hydraulics:</strong></p>
            <p>$$L_{m-1,0} = \\frac{g T_{m-1,0}^2}{2\\pi} = ${Lm.toFixed(2)} \\text{ m}, \\quad \\xi_{m-1,0} = \\frac{\\tan\\alpha}{\\sqrt{H_{m0}/L_{m-1,0}}} = ${ot.xi_m10.toFixed(2)}$$</p>
            <p>$$R_{u2\\%} = ${ot.Ru2.toFixed(2)} \\text{ m} \\quad (\\text{Governing regime: } \\mathbf{${ot.regime}})$$</p>
        `;

        if (ot.regime === 'breaking') {
            formulaHTML += `
                <p><strong>EurOtop (2018) Eq. 5.10 (Mean Value - Breaking Waves):</strong></p>
                <p>$$\\frac{q}{\\sqrt{g H_{m0}^3}} = \\frac{0.023}{\\sqrt{\\tan\\alpha}} \\gamma_b \\xi_{m-1,0} \\exp\\left[-\\left(2.7 \\frac{R_c}{\\xi_{m-1,0} H_{m0} \\gamma_b \\gamma_f \\gamma_\\beta \\gamma_v}\\right)^{1.3}\\right] C_r$$</p>
            `;
        } else if (ot.regime === 'non-breaking') {
            formulaHTML += `
                <p><strong>EurOtop (2018) Eq. 5.11 (Mean Value - Non-Breaking Cap):</strong></p>
                <p>$$\\frac{q}{\\sqrt{g H_{m0}^3}} = 0.09 \\exp\\left[-\\left(1.5 \\frac{R_c}{H_{m0} \\gamma_f \\gamma_\\beta \\gamma_v}\\right)^{1.3}\\right] C_r$$</p>
            `;
        } else {
            formulaHTML += `
                <p><strong>EurOtop (2018) Section 5.3.5 (Zero / Negative Freeboard):</strong></p>
                <p>$$q = q_{\\text{weir}} + q_{\\text{wave}}(R_c=0), \\quad q_{\\text{weir}} = 0.54 \\sqrt{g |R_c|^3} \\; (R_c &lt; 0)$$</p>
            `;
        }

        formulaHTML += `
            <p>$$q = ${ot.q_l_s_m.toFixed(4)} \\text{ L/s/m} \\; (${ot.q.toFixed(6)} \\text{ m}^3\\text{/s/m}), \\quad V_{\\max} = ${Vmax.toFixed(3)} \\text{ m}^3\\text{/m} \\; (${(Vmax * 1000).toFixed(1)} \\text{ L/m})$$</p>
            <p style="font-size:0.85em; color:var(--topography-500);"><em>Ref: EurOtop Manual 2nd Edition (2018), Eqs. 5.10, 5.11, 5.19 &amp; Section 5.5 Weibull distribution.</em></p>
        `;

        formulaDiv.innerHTML = formulaHTML;

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
        crestWidth,
        gamma_f,
        gamma_v,
        Cr: ot.Cr,
        Ru2: ot.Ru2,
        xi_m10: ot.xi_m10,
        regime: ot.regime,
        waveHeight,
        waveHeightRaw,
        isDepthLimited,
        wavePeriod,
        toeDepth,
        q: ot.q_l_s_m,
        q_m3_s_m: ot.q,
        Vmax,
        safety
    };
}

function updateSafetyIndicator(elementId, safetyData) {
    const indicator = document.getElementById(elementId);
    if (!indicator) return;

    indicator.classList.remove('safe', 'warning', 'danger');

    if (safetyData.status === 'SAFE') {
        indicator.classList.add('safe');
    } else if (safetyData.status === 'CAUTION') {
        indicator.classList.add('warning');
    } else {
        indicator.classList.add('danger');
    }

    const statusEl = indicator.querySelector('.safety-status');
    if (statusEl) {
        statusEl.textContent = safetyData.status;
        statusEl.style.color = safetyData.status === 'SAFE' ? 'var(--color-success)' :
            safetyData.status === 'CAUTION' ? 'var(--color-warning)' :
                'var(--color-danger)';
    }
}

function _trapezoidArea(wTop, h, mL, mR) {
    if (h <= 0 || wTop < 0) return 0;
    return h * wTop + 0.5 * (mL + mR) * h * h;
}

function _shrinkTrapezoid(wTop, h, mL, mR, thickness) {
    const hIn = Math.max(0, h - thickness);
    const wIn = Math.max(
        0,
        wTop + thickness * (mL + mR) - thickness * (Math.sqrt(1 + mL * mL) + Math.sqrt(1 + mR * mR))
    );
    return { wTop: wIn, h: hIn };
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
    } else if (template === 'rubble-reef') {
        performReefAnalysis(stabilityResults);
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
    } else if (template === 'custom') {
        performCustomAnalysis(stabilityResults);
        return;
    }

    if (template === 'rubble-standard' || template === 'rubble-bullnose') {
        // --- 1. GATHER INPUTS (SCOPED TO DESIGNER IN SI) ---
        const layerCount = parseInt(_readDesignParam('layerCount', 3), 10) || 3;
        const sL = _readDesignParam('slopeLeft', 1.5);
        const sR = _readDesignParam('slopeRight', 1.5);
        const crestHeight = _readDesignParam('crestHeight', 2.8);

        const crestWidthMultiplier = parseInt(_readDesignParam('crestWidthMultiplier', 3), 10) || 3;
        const inputDn50 = _readDesignParam('armourDn50', 1.2);
        const crestWidth = crestWidthMultiplier * inputDn50;

        // Material Properties
        const armourTypeKey = String(_readDesignParam('armourType', 'rock_angular'));
        const armourMeta = (typeof ArmourTypes !== 'undefined' && ArmourTypes[armourTypeKey])
            ? ArmourTypes[armourTypeKey]
            : { name: 'Natural Rock (Rough Angular)', rho: 2650, kd: 4.0, porosity: 0.37 };

        const rho_s = _readDesignParam('matDensity', armourMeta.rho);
        const KD = _readDesignParam('matKd', armourMeta.kd);
        const porosity = _readDesignParam('matPorosity', armourMeta.porosity);

        // Rock / Quarry properties for Filter & Core (independent of concrete primary armour)
        const filterTypeKey = String(_readDesignParam('filterType', 'rock_angular'));
        const filterMeta = (typeof ArmourTypes !== 'undefined' && ArmourTypes[filterTypeKey])
            ? ArmourTypes[filterTypeKey]
            : { name: 'Quarry Stone', rho: 2650, porosity: 0.37 };
        const rho_filter = filterMeta.rho || 2650;
        const porosity_filter = filterMeta.porosity || 0.37;
        const rho_core = 2650;
        const porosity_core = 0.35;

        const rho_w = 1025;
        const delta = (rho_s / rho_w) - 1;

        // Design Wave from Global
        let Hs = 2.5;
        let Tm = 10.0;
        if (typeof GlobalParams !== 'undefined') {
            Hs = GlobalParams.getEffectiveValue(null, 'waveHeight') || 2.5;
            Tm = GlobalParams.getEffectiveValue(null, 'wavePeriod') || 10.0;
        }

        // --- 2. STABILITY CALCULATION (Hudson & Van der Meer) ---
        const W50_tonnes_hudson = hudsonFormula(Hs, rho_s, rho_w, KD, sL);
        const M50 = W50_tonnes_hudson * 1000;
        const Dn50 = Math.pow(M50 / rho_s, 1 / 3);

        const filterWeightRatio = Math.max(1, _readDesignParam('filterWeightRatio', 10));
        const coreWeightRatio = Math.max(1, _readDesignParam('coreWeightRatio', 200));
        const toeWeightRatio = Math.max(1, _readDesignParam('toeWeightRatio', 10));

        const M50_design = rho_s * Math.pow(inputDn50, 3);
        const M50_filter = M50_design / filterWeightRatio;
        const Dn50_filter = Math.pow(M50_filter / rho_filter, 1 / 3);
        const Dn50_toe = inputDn50 / Math.pow(toeWeightRatio, 1 / 3);

        // Van der Meer (1988)
        const P = _readDesignParam('permeability', 0.4);
        const S_dam = _readDesignParam('damageLevel', 2.0);
        const N_waves = _readDesignParam('stormWaves', 3000);
        const vdm = calculateVanDerMeer(Hs, Tm, delta, sL, rho_s, P, S_dam, N_waves);

        // --- 3. LAYER GEOMETRY & EXACT NESTED TRAPEZOID VOLUMES ---
        const k_delta = 1.0;
        const n_armour_layers = parseInt(_readDesignParam('armourLayers', 2), 10) || 2;
        const n_filter = parseInt(_readDesignParam('filterLayers', 2), 10) || 2;
        const n_toe = parseInt(_readDesignParam('toeLayers', 2), 10) || 2;

        // Use selected design armour Dn50 for physical section geometry & volumes
        const thickness_armour = n_armour_layers * k_delta * inputDn50;
        const thickness_filter = layerCount >= 3 ? n_filter * k_delta * Dn50_filter : 0;

        const toeDepth = _readDesignParam('depth', 3.5);
        let dwlRise = 0;
        let dwlText = '0.00';
        if (typeof AppState !== 'undefined' && AppState.waveData && AppState.waveData.DWL !== undefined) {
            dwlRise = AppState.waveData.DWL;
            dwlText = dwlRise.toFixed(2);
        }
        const waterDepth = toeDepth + dwlRise;
        const physStructureHeight = toeDepth + crestHeight;

        const TotalArea = _trapezoidArea(crestWidth, physStructureHeight, sL, sR);
        let Vol_armour = 0;
        let Vol_filter = 0;
        let Vol_core = 0;

        if (layerCount === 1) {
            Vol_armour = TotalArea;
        } else if (layerCount === 2) {
            const coreDim = _shrinkTrapezoid(crestWidth, physStructureHeight, sL, sR, thickness_armour);
            const CoreArea = _trapezoidArea(coreDim.wTop, coreDim.h, sL, sR);
            Vol_armour = Math.max(0, TotalArea - CoreArea);
            Vol_core = Math.max(0, CoreArea);
        } else {
            const underArmourDim = _shrinkTrapezoid(crestWidth, physStructureHeight, sL, sR, thickness_armour);
            const UnderArmourArea = _trapezoidArea(underArmourDim.wTop, underArmourDim.h, sL, sR);
            const coreDim = _shrinkTrapezoid(underArmourDim.wTop, underArmourDim.h, sL, sR, thickness_filter);
            const CoreArea = _trapezoidArea(coreDim.wTop, coreDim.h, sL, sR);

            Vol_armour = Math.max(0, TotalArea - UnderArmourArea);
            Vol_filter = Math.max(0, UnderArmourArea - CoreArea);
            Vol_core = Math.max(0, CoreArea);
        }

        const Mass_armour = Vol_armour * rho_s * (1 - porosity);
        const Mass_filter = Vol_filter * rho_filter * (1 - porosity_filter);
        const Mass_core = Vol_core * rho_core * (1 - porosity_core);

        // Toe Volume
        const hasLeftToe = Boolean(_readDesignParam('hasLeftToe', true));
        const hasRightToe = Boolean(_readDesignParam('hasRightToe', true));
        const toeWidthMultiplier = parseInt(_readDesignParam('toeWidthMultiplier', 4), 10) || 4;
        const toeWidthEach = toeWidthMultiplier * Dn50_toe;
        const toeThick = n_toe * k_delta * Dn50_toe;
        let Vol_toe = 0;
        if (hasLeftToe) Vol_toe += toeWidthEach * toeThick;
        if (hasRightToe) Vol_toe += toeWidthEach * toeThick;
        const Mass_toe = Vol_toe * rho_filter * (1 - porosity_filter);

        // Bullnose / Parapet Check
        const hasBullnose = template === 'rubble-bullnose' || Boolean(_readDesignParam('hasBullnose', false));
        let bullnoseResult = null;
        if (hasBullnose && typeof calculateBullnoseStability === 'function') {
            bullnoseResult = calculateBullnoseStability({
                bullnoseWidth: _readDesignParam('bullnoseWidth', 1.0),
                bullnoseHeight: _readDesignParam('bullnoseHeight', 1.2),
                bullnoseDensity: 2400,
                frictionCoeff: 0.6,
                waveHeight: Hs,
                crestFreeboard: Math.max(0.1, crestHeight - dwlRise)
            });
        }

        const getBadge = (req) => {
            if (!req) return '';
            const isPass = inputDn50 >= req;
            const pct = ((inputDn50 - req) / req) * 100;
            const sign = pct >= 0 ? '+' : '';
            const color = isPass ? 'var(--color-success)' : 'var(--color-danger)';
            const icon = isPass ? '✓' : '✗';
            return `<div style="color:${color}; font-weight:bold; margin-top:5px; font-size:0.9em;">
                ${icon} ${isPass ? 'PASS' : 'FAIL'} (Input ${sign}${pct.toFixed(0)}%)
             </div>`;
        };

        // --- 4. RENDER STABILITY TAB ---
        let bullnoseHTML = '';
        if (bullnoseResult) {
            bullnoseHTML = `
                <div style="border-top: 1px solid var(--border-color); padding-top:15px;">
                    <h4 style="border-left: 3px solid var(--secondary-color); padding-left:10px; margin-bottom:10px;">Bullnose / Crown Wall Stability</h4>
                    <div class="result-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div style="font-size:0.9em;">
                            <div><strong>Self-Weight ($W$):</strong> ${bullnoseResult.weight.toFixed(1)} kN/m</div>
                            <div><strong>Wave Load ($F_h$):</strong> ${bullnoseResult.forces.F_h.toFixed(1)} kN/m</div>
                            <div><strong>Uplift ($F_u$):</strong> ${bullnoseResult.forces.F_u.toFixed(1)} kN/m</div>
                        </div>
                        <div class="result-highlight" style="padding:10px; font-size:0.95em;">
                            <div>Sliding SF: <strong>${bullnoseResult.sliding.FS.toFixed(2)}</strong> (${bullnoseResult.sliding.passed ? 'PASS' : 'FAIL'})</div>
                            <div>Overturn SF: <strong>${bullnoseResult.overturning.FS.toFixed(2)}</strong> (${bullnoseResult.overturning.passed ? 'PASS' : 'FAIL'})</div>
                        </div>
                    </div>
                </div>`;
        }

        stabilityResults.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:20px;">
                <div style="border-bottom: 1px solid var(--border-color); padding-bottom:15px;">
                    <h4 style="border-left: 3px solid var(--primary-color); padding-left:10px; margin-bottom:10px;">Hudson Formula</h4>
                    <div class="result-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                        <div class="formula" style="font-size:0.85em; grid-column: 1 / -1;">$$M_{50} = \\frac{\\rho_s H^3}{K_D \\Delta^3 \\cot \\alpha}$$</div>
                        <div style="font-size:0.9em;">
                            <div><strong>Wave ($H_s$):</strong> ${Hs.toFixed(2)} m</div>
                            <div><strong>Wave Setup ($\\eta$):</strong> ${calculateWaveSetup(Hs, waterDepth).toFixed(2)} m</div>
                            <div><strong>Slope:</strong> 1:${sL.toFixed(1)}</div>
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
                        <div class="formula" style="font-size:0.85em; grid-column: 1 / -1;">
                            ${vdm.regime === 'plunging'
                                ? '$$\\frac{H_s}{\\Delta D_{n50}} = 6.2 P^{0.18} \\left(\\frac{S}{\\sqrt{N}}\\right)^{0.2} \\xi_m^{-0.5}$$'
                                : '$$\\frac{H_s}{\\Delta D_{n50}} = 1.0 P^{-0.13} \\left(\\frac{S}{\\sqrt{N}}\\right)^{0.2} \\sqrt{\\cot\\alpha} \\, \\xi_m^P$$'}
                        </div>
                        <div style="font-size:0.9em;">
                            <div><strong>Regime:</strong> ${vdm.regime.toUpperCase()} ($\\xi_m = ${vdm.xi_m.toFixed(2)}$, $\\xi_{mc} = ${vdm.xi_mc.toFixed(2)}$)</div>
                            <div><strong>Perm. ($P$):</strong> ${P}, <strong>Damage ($S$):</strong> ${S_dam}</div>
                            <div><strong>Stability $N_s$:</strong> ${vdm.Ns.toFixed(2)} ($N_p=${vdm.Ns_plunging.toFixed(2)}, N_s=${vdm.Ns_surging.toFixed(2)}$)</div>
                        </div>
                        <div class="result-highlight" style="padding:10px; font-size:0.95em;">
                            <div>Mass: <strong>${(vdm.M50 / 1000).toFixed(2)} t</strong></div>
                            <div>Req. $D_{n50}$: <strong>${vdm.Dn50.toFixed(2)} m</strong></div>
                            ${getBadge(vdm.Dn50)}
                        </div>
                    </div>
                </div>

                ${bullnoseHTML}
            </div>

            <div style="margin-top:15px; font-size:0.85em; color:var(--topography-500); text-align:center; font-style:italic; border-top: 1px dotted var(--border-color); padding-top: 10px;">
                <strong>Design Conditions:</strong> Effective Depth ($d_{\\text{eff}}$) = ${toeDepth.toFixed(2)} m + DWL (${dwlText} m) = <strong>${waterDepth.toFixed(2)} m</strong> | Input $D_{n50}$ = ${inputDn50.toFixed(2)} m
            </div>
        `;

        // --- 5. RENDER MATERIALS TAB ---
        if (materialsInfo) {
            const totalVol = Vol_armour + Vol_filter + Vol_toe + Vol_core;
            const totalMass = (Mass_armour + Mass_filter + Mass_toe + Mass_core) / 1000;

            materialsInfo.innerHTML = `
                <h4>Material Quantities (Nested Cross-Section per m run)</h4>
                <div style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Layer</th>
                                <th>Material / Sizing</th>
                                <th>Volume ($m^3/m$)</th>
                                <th>Porosity</th>
                                <th>Est. Mass ($t/m$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Primary Armour</strong></td>
                                <td>${armourMeta.name}<br><small>Design $D_{n50} = ${inputDn50.toFixed(2)}$ m ($n=${n_armour_layers}$)</small></td>
                                <td>${Vol_armour.toFixed(2)}</td>
                                <td>${(porosity * 100).toFixed(0)}%</td>
                                <td>${(Mass_armour / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Filter Layer</strong></td>
                                <td>${filterMeta.name}<br><small>$D_{n50} = ${Dn50_filter.toFixed(2)}$ m (1/${filterWeightRatio})</small></td>
                                <td>${Vol_filter.toFixed(2)}</td>
                                <td>${(porosity_filter * 100).toFixed(0)}%</td>
                                <td>${(Mass_filter / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Toe Berm</strong></td>
                                <td>Rock Toe ($D_{n50} = ${Dn50_toe.toFixed(2)}$ m)<br><small>Width ${toeWidthEach.toFixed(2)} m/side</small></td>
                                <td>${Vol_toe.toFixed(2)}</td>
                                <td>${(porosity_filter * 100).toFixed(0)}%</td>
                                <td>${(Mass_toe / 1000).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Core</strong></td>
                                <td>Quarry Run<br><small>1/${coreWeightRatio} armour weight</small></td>
                                <td>${Vol_core.toFixed(2)}</td>
                                <td>${(porosity_core * 100).toFixed(0)}%</td>
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
            `;
        }

        // --- 6. RENDER LAYERS TAB ---
        if (layersInfo) {
            layersInfo.innerHTML = `
                <h4>Layer Specifications</h4>
                <div class="layer-spec">
                    <h5>Primary Armour Layer (${armourMeta.name})</h5>
                    <ul>
                        <li><strong>Thickness ($t_a$):</strong> ${thickness_armour.toFixed(2)} m ($n = ${n_armour_layers}$ layers, $D_{n50} = ${inputDn50.toFixed(2)}$ m)</li>
                        <li><strong>Crest Width ($G_c$):</strong> ${crestWidth.toFixed(2)} m (${crestWidthMultiplier} &times; $D_{n50}$)</li>
                        <li><strong>Density / $K_D$:</strong> ${rho_s} kg/m&sup3; / ${KD}</li>
                    </ul>
                </div>
                <div class="layer-spec">
                    <h5>Filter / Underlayer</h5>
                    <ul>
                        <li><strong>Thickness ($t_f$):</strong> ${thickness_filter.toFixed(2)} m ($n = ${layerCount >= 3 ? n_filter : 0}$ layers)</li>
                        <li><strong>Filter Rule:</strong> $W_{50,f} = W_{50,a} / ${filterWeightRatio}$ ($D_{n50,f} = ${Dn50_filter.toFixed(2)}$ m)</li>
                    </ul>
                </div>
                <div class="layer-spec">
                    <h5>Toe Structure</h5>
                    <ul>
                        <li><strong>Berm Width:</strong> ${toeWidthEach.toFixed(2)} m (${toeWidthMultiplier} &times; $D_{n50,t}$), Left: ${hasLeftToe ? 'Enabled' : 'Disabled'}, Right: ${hasRightToe ? 'Enabled' : 'Disabled'}</li>
                        <li><strong>Thickness:</strong> ${toeThick.toFixed(2)} m ($D_{n50,t} = ${Dn50_toe.toFixed(2)}$ m)</li>
                    </ul>
                </div>
                <p class="formula-ref"><em>Ref: CIRIA The Rock Manual C683; Van der Meer (1988); USACE CEM.</em></p>
            `;
        }

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
            templateName: template === 'rubble-bullnose' ? 'Rubble Mound with Bullnose' : 'Standard Rubble Mound Breakwater',
            Hs,
            Tm,
            rho_s,
            KD,
            porosity,
            delta,
            waterDepth,
            slope: sL,
            slopeRight: sR,
            crestHeight,
            crestWidth,
            inputDn50,
            toeDepth,
            dwlRise,
            layerCount,
            hudson: { M50, Dn50, M50_filter, Dn50_filter },
            vdm: {
                xi_m: vdm.xi_m,
                xi_mc: vdm.xi_mc,
                regime: vdm.regime,
                P,
                S_dam,
                N_waves,
                Ns_vdm: vdm.Ns,
                Ns_plunging: vdm.Ns_plunging,
                Ns_surging: vdm.Ns_surging,
                Dn50: vdm.Dn50,
                M50: vdm.M50
            },
            bullnose: bullnoseResult,
            layers: { thickness_armour, thickness_filter, n_armour_layers, n_filter, toeWidthEach, toeThick },
            volumes: { armour: Vol_armour, filter: Vol_filter, core: Vol_core, toe: Vol_toe },
            masses: { armour: Mass_armour, filter: Mass_filter, core: Mass_core, toe: Mass_toe }
        };

        if (window.projectManager && window.projectManager.getCurrentProject()) {
            const currentProject = window.projectManager.getCurrentProject();
            const structureId = currentProject.structures.length > 0
                ? currentProject.structures[currentProject.structures.length - 1].id
                : 'default_structure';

            window.projectManager.saveStructureAnalysisToCurrentProject(structureId, {
                stability: AppState.structureData,
                serviceability: AppState.serviceabilityData,
                diagram: typeof exportCanvasImage === 'function' ? exportCanvasImage() : null
            }).catch(err => console.error('Failed to save structure analysis to project:', err));
        }
    } else {
        stabilityResults.innerHTML = `<p>Analysis for ${template} is not yet configured.</p>`;
    }
}

// CommonJS exports for Node.js automated test suite
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        solveDispersionWavelength,
        calculateSMBWaves,
        calculateJONSWAPWaves,
        calculateBreakingHeightMiche,
        calculateBreakingHeightGoda,
        calculateDWL,
        calculateWaveSetup,
        hudsonFormula,
        calculateVanDerMeer,
        vanderMeerPlunging,
        vanderMeerSurging,
        calculateMassFromDn50,
        godaWavePressure,
        checkSlidingStability,
        checkOverturningStability,
        gammaLanczos,
        calculateEurOtopOvertopping,
        calculateIndividualWaveVolume,
        assessSafetyThresholds,
        ArmourTypes,
        MaterialDatabase
    };
}

