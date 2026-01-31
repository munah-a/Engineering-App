// ==========================================
// WAVE TRANSFORMATION MODULE
// CEM (Coastal Engineering Manual) Chapter 5-13
// ==========================================

/**
 * Calculate deep water wavelength
 * @param {number} T - Wave period (s)
 * @returns {number} Deep water wavelength L0 (m)
 */
function calculateDeepWaterWavelength(T) {
    const g = 9.81;
    return (g * T * T) / (2 * Math.PI);
}

/**
 * Calculate local wavelength using dispersion relation
 * Iterative solution of: L = (gT²/2π) × tanh(2πd/L)
 * @param {number} T - Wave period (s)
 * @param {number} d - Water depth (m)
 * @returns {number} Local wavelength L (m)
 */
function calculateLocalWavelength(T, d) {
    const g = 9.81;
    const L0 = calculateDeepWaterWavelength(T);

    // Iterative solution
    let L = L0;
    for (let i = 0; i < 10; i++) {
        const k = (2 * Math.PI) / L;
        L = L0 * Math.tanh(k * d);
    }

    return L;
}

/**
 * Calculate group velocity factor n
 * n = 0.5 × (1 + 2kd/sinh(2kd))
 * @param {number} k - Wave number (rad/m)
 * @param {number} d - Water depth (m)
 * @returns {number} Group velocity factor n
 */
function calculateGroupVelocityFactor(k, d) {
    const kd = k * d;
    const sinh2kd = Math.sinh(2 * kd);

    if (sinh2kd === 0) return 0.5; // Deep water limit

    const n = 0.5 * (1 + (2 * kd) / sinh2kd);
    return n;
}

/**
 * Calculate shoaling coefficient
 * Ks = √(L0 / (2nL))
 * @param {number} L0 - Deep water wavelength (m)
 * @param {number} L - Local wavelength (m)
 * @param {number} n - Group velocity factor
 * @returns {number} Shoaling coefficient Ks
 */
function calculateShoalingCoefficient(L0, L, n) {
    const Ks = Math.sqrt(L0 / (2 * n * L));
    return Ks;
}

/**
 * Calculate wave approach angle at depth d using Snell's Law
 * sin(β) / C = sin(β0) / C0
 * @param {number} beta0 - Offshore wave angle (degrees)
 * @param {number} L0 - Deep water wavelength (m)
 * @param {number} L - Local wavelength (m)
 * @returns {number} Local wave angle β (degrees)
 */
function calculateRefractionAngle(beta0, L0, L) {
    const beta0_rad = beta0 * Math.PI / 180;

    // Celerity ratio C/C0 = L/L0 (since period is constant)
    const C_ratio = L / L0;

    // Snell's law: sin(β) = sin(β0) × (C/C0)
    const sinBeta = Math.sin(beta0_rad) * C_ratio;

    // Prevent numerical issues
    if (Math.abs(sinBeta) > 1) {
        return beta0; // Return original angle if calculation fails
    }

    const beta_rad = Math.asin(sinBeta);
    return beta_rad * 180 / Math.PI;
}

/**
 * Calculate refraction coefficient
 * Kr = √(cos(β0) / cos(β))
 * @param {number} beta0 - Offshore wave angle (degrees)
 * @param {number} beta - Local wave angle (degrees)
 * @returns {number} Refraction coefficient Kr
 */
function calculateRefractionCoefficient(beta0, beta) {
    const beta0_rad = beta0 * Math.PI / 180;
    const beta_rad = beta * Math.PI / 180;

    const cosBeta0 = Math.cos(beta0_rad);
    const cosBeta = Math.cos(beta_rad);

    if (cosBeta === 0) return 1.0; // Avoid division by zero

    const Kr = Math.sqrt(cosBeta0 / cosBeta);
    return Kr;
}

/**
 * Transform wave parameters from offshore to nearshore (toe)
 * @param {number} H0 - Offshore wave height (m)
 * @param {number} T - Wave period (s)
 * @param {number} d_offshore - Offshore depth (m)
 * @param {number} d_toe - Toe depth (m)
 * @param {number} beta0 - Offshore wave approach angle (degrees, 0 = shore-normal)
 * @returns {object} Transformed wave parameters and coefficients
 */
function transformWaveOffshoreToToe(H0, T, d_offshore, d_toe, beta0 = 0) {
    const g = 9.81;

    // 1. Calculate deep water wavelength
    const L0 = calculateDeepWaterWavelength(T);

    // 2. Calculate offshore wavelength
    const L_offshore = calculateLocalWavelength(T, d_offshore);
    const k_offshore = (2 * Math.PI) / L_offshore;
    const n_offshore = calculateGroupVelocityFactor(k_offshore, d_offshore);

    // 3. Calculate toe wavelength
    const L_toe = calculateLocalWavelength(T, d_toe);
    const k_toe = (2 * Math.PI) / L_toe;
    const n_toe = calculateGroupVelocityFactor(k_toe, d_toe);

    // 4. Calculate shoaling coefficient (offshore to toe)
    const Ks = calculateShoalingCoefficient(L_offshore, L_toe, n_toe);

    // 5. Calculate refraction
    const beta_toe = calculateRefractionAngle(beta0, L_offshore, L_toe);
    const Kr = calculateRefractionCoefficient(beta0, beta_toe);

    // 6. Transform wave height
    let H_toe = H0 * Ks * Kr;

    // 7. Apply depth-limited breaking (Miche criterion)
    const H_max = 0.78 * d_toe;
    const isDepthLimited = H_toe > H_max;

    if (isDepthLimited) {
        H_toe = H_max;
    }

    return {
        offshore: {
            H: H0,
            T: T,
            L: L_offshore,
            d: d_offshore,
            beta: beta0
        },
        toe: {
            H: H_toe,
            T: T,
            L: L_toe,
            d: d_toe,
            beta: beta_toe
        },
        coefficients: {
            Ks: Ks,
            Kr: Kr,
            KsKr: Ks * Kr
        },
        breaking: {
            H_max: H_max,
            isDepthLimited: isDepthLimited,
            breakingRatio: H_toe / d_toe
        },
        L0: L0
    };
}

/**
 * Calculate surf similarity parameter (Iribarren number)
 * ξ = tan(α) / √(H/L0)
 * @param {number} slope - Structure slope (cotα, e.g., 1.5 for 1V:1.5H)
 * @param {number} H - Wave height (m)
 * @param {number} L0 - Deep water wavelength (m)
 * @returns {number} Surf similarity parameter ξ
 */
function calculateSurfSimilarity(slope, H, L0) {
    // slope is cotα, so tanα = 1/slope
    const tanAlpha = 1 / slope;
    const steepness = H / L0;

    if (steepness <= 0) return 0;

    const xi = tanAlpha / Math.sqrt(steepness);
    return xi;
}

/**
 * Classify wave breaking type based on surf similarity
 * @param {number} xi - Surf similarity parameter
 * @returns {string} Breaking type: 'spilling', 'plunging', or 'surging'
 */
function classifyBreakingType(xi) {
    if (xi < 0.5) {
        return 'spilling';
    } else if (xi < 3.3) {
        return 'plunging';
    } else {
        return 'surging';
    }
}

/**
 * Get roughness reduction factor for different structure types
 * @param {string} structureType - Type of structure
 * @returns {number} Roughness factor γr (0-1)
 */
function getRoughnessReductionFactor(structureType) {
    const factors = {
        'smooth': 1.0,           // Smooth concrete, asphalt
        'concrete': 1.0,         // Concrete blocks
        'rock': 0.55,            // Rock armour (rough angular)
        'rock_smooth': 0.60,     // Rounded rock
        'cubes': 0.50,           // Concrete cubes
        'tetrapod': 0.45,        // Tetrapods
        'dolos': 0.43,           // Dolosse
        'accropode': 0.46,       // Accropode
        'xbloc': 0.45            // Xbloc
    };

    return factors[structureType] || 0.55; // Default to rock armour
}

/**
 * Calculate wave run-up using CEM Chapter 5-13 formulas
 * @param {number} H - Wave height at toe (m)
 * @param {number} T - Wave period (s)
 * @param {number} slope - Structure slope (cotα)
 * @param {string} structureType - Structure type for roughness factor
 * @returns {object} Run-up calculations
 */
function calculateWaveRunup(H, T, slope, structureType = 'rock') {
    const g = 9.81;

    // Calculate deep water wavelength
    const L0 = calculateDeepWaterWavelength(T);

    // Calculate surf similarity
    const xi = calculateSurfSimilarity(slope, H, L0);

    // Get roughness reduction factor
    const gamma_r = getRoughnessReductionFactor(structureType);

    // Breaking type
    const breakingType = classifyBreakingType(xi);

    // Calculate run-up for smooth slope (CEM 5-13)
    let Ru_smooth;

    if (xi < 2.0) {
        // Plunging/spilling breakers
        Ru_smooth = 1.6 * xi * H;
    } else {
        // Surging breakers (with upper limit)
        Ru_smooth = Math.min(4.0 * H, 1.6 * xi * H);
    }

    // Apply roughness reduction
    const Ru = gamma_r * Ru_smooth;

    // Calculate run-up coefficient
    const Ru_over_H = Ru / H;

    return {
        Ru: Ru,                          // Wave run-up (m)
        Ru_smooth: Ru_smooth,            // Run-up for smooth slope (m)
        Ru_over_H: Ru_over_H,            // Dimensionless run-up
        xi: xi,                          // Surf similarity parameter
        breakingType: breakingType,      // Breaking classification
        gamma_r: gamma_r,                // Roughness factor applied
        structureType: structureType     // Structure type used
    };
}

/**
 * Calculate wave run-down (approximate)
 * Rd ≈ -0.33 × Ru (typical approximation)
 * @param {number} Ru - Wave run-up (m)
 * @returns {number} Wave run-down Rd (m, negative value)
 */
function calculateWaveRundown(Ru) {
    return -0.33 * Ru;
}

/**
 * Comprehensive wave transformation and run-up analysis
 * @param {object} params - Input parameters
 * @returns {object} Complete transformation and run-up results
 */
function analyzeWaveTransformationAndRunup(params) {
    const {
        H_offshore,
        T,
        d_offshore,
        d_toe,
        beta0 = 0,
        slope,
        structureType = 'rock'
    } = params;

    // 1. Transform waves from offshore to toe
    const transformation = transformWaveOffshoreToToe(
        H_offshore,
        T,
        d_offshore,
        d_toe,
        beta0
    );

    // 2. Calculate run-up at toe
    const runup = calculateWaveRunup(
        transformation.toe.H,
        T,
        slope,
        structureType
    );

    // 3. Calculate run-down
    const Rd = calculateWaveRundown(runup.Ru);

    return {
        transformation: transformation,
        runup: runup,
        rundown: Rd,
        summary: {
            H_offshore: H_offshore,
            H_toe: transformation.toe.H,
            reduction_percent: ((H_offshore - transformation.toe.H) / H_offshore * 100).toFixed(1),
            Ru: runup.Ru,
            Rd: Rd,
            xi: runup.xi,
            breakingType: runup.breakingType
        }
    };
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.WaveTransformation = {
        calculateDeepWaterWavelength,
        calculateLocalWavelength,
        calculateShoalingCoefficient,
        calculateRefractionCoefficient,
        transformWaveOffshoreToToe,
        calculateSurfSimilarity,
        classifyBreakingType,
        calculateWaveRunup,
        calculateWaveRundown,
        analyzeWaveTransformationAndRunup,
        getRoughnessReductionFactor
    };
}
