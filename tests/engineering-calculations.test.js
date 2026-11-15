const test = require('node:test');
const assert = require('node:assert/strict');

const WT = require('../scripts/wave-transformation.js');
const Calc = require('../scripts/calculations.js');
const StructCalc = require('../scripts/structure-calculations.js');

function assertClose(actual, expected, tol, msg) {
    assert.ok(
        Math.abs(actual - expected) <= tol,
        `${msg || 'Value mismatch'}: expected ${expected} ± ${tol}, got ${actual}`
    );
}

test('Dispersion solver matches RMB-001 benchmark and deep-water limit', () => {
    const L_benchmark = WT.calculateLocalWavelength(8, 7.2);
    assertClose(L_benchmark, 62.0, 0.5, 'RMB-001 wavelength at T=8s, d=7.2m');

    const { L0, L } = Calc.solveDispersionWavelength(8, 200);
    assertClose(L0, (9.81 * 64) / (2 * Math.PI), 1e-6, 'Deep-water wavelength L0');
    assertClose(L, L0, 1e-4, 'Deep-water convergence L -> L0');
});

test('SMB and JONSWAP wave growth use iterative dispersion and grow monotonically', () => {
    const smbLow = Calc.calculateSMBWaves(10, 5000, 15);
    const smbHigh = Calc.calculateSMBWaves(20, 5000, 15);
    assert.ok(smbHigh.Hs > smbLow.Hs && smbHigh.Tp > smbLow.Tp, 'SMB grows with U10');

    const jonswap = Calc.calculateJONSWAPWaves(15, 10000, 10);
    const expectedL = WT.calculateLocalWavelength(jonswap.Tp, 10);
    assertClose(jonswap.L, expectedL, 1e-3, 'JONSWAP uses full iterative dispersion wavelength');
});

test('Shoaling coefficient conserves energy flux between arbitrary depths (Ks = 1 when d0 = d_toe)', () => {
    const sameDepth = WT.transformWavesToToe(2.0, 8.0, 5.0, 5.0, 0);
    assertClose(sameDepth.coefficients.Ks, 1.0, 1e-9, 'Ks must equal 1.0 when d_offshore == d_toe');
    assertClose(sameDepth.coefficients.Kr, 1.0, 1e-9, 'Kr must equal 1.0 for normal incidence');
    assert.ok(sameDepth.toe.H <= 0.78 * 5.0 + 1e-9, 'H_toe obeys depth-limited cap');

    // Deep-to-shallow benchmark: Ks = sqrt(L0 / (2 * n * L))
    const L0 = WT.calculateDeepWaterWavelength(8);
    const L = WT.calculateLocalWavelength(8, 4);
    const n = WT.calculateGroupVelocityFactor((2 * Math.PI) / L, 4);
    const ks3Arg = WT.calculateShoalingCoefficient(L0, L, n);
    assertClose(ks3Arg, Math.sqrt(L0 / (2 * n * L)), 1e-9, '3-arg Ks matches deep-water formula');
});

test('Hudson formula matches RMB-007 worked benchmark', () => {
    // gamma_a = 2500 kg/m3, rho_w = 1000 kg/m3, H = 2 m, KD = 4.0, cotAlpha = 2.0 -> 0.7407 t
    const W50_tonnes = Calc.hudsonFormula(2.0, 2500, 1000, 4.0, 2.0);
    assertClose(W50_tonnes, 0.74074, 1e-4, 'RMB-007 Hudson stone mass');
});

test('Van der Meer (1988) uses critical Iribarren xi_mc transition instead of Math.min', () => {
    const Hs = 3.0;
    const Tm = 7.0;
    const rho_s = 2650;
    const Delta = rho_s / 1025 - 1;
    const cotAlpha = 2.0;
    const P = 0.4;

    const plungingCase = Calc.calculateVanDerMeer(Hs, Tm, Delta, cotAlpha, rho_s, P, 2.0, 3000);
    assert.ok(plungingCase.xi_m < plungingCase.xi_mc, 'Short wave period gives plunging regime');
    assert.equal(plungingCase.regime, 'plunging');
    assertClose(plungingCase.Ns, plungingCase.Ns_plunging, 1e-9, 'Governing Ns equals Ns_plunging');

    const surgingCase = Calc.calculateVanDerMeer(1.5, 14.0, Delta, 1.5, rho_s, 0.5, 2.0, 3000);
    assert.ok(surgingCase.xi_m >= surgingCase.xi_mc, 'Long wave on steep slope gives surging regime');
    assert.equal(surgingCase.regime, 'surging');
    assertClose(surgingCase.Ns, surgingCase.Ns_surging, 1e-9, 'Governing Ns equals Ns_surging');

    // Gentle slope >= 4 must use plunging even at higher xi_m
    const gentleCase = Calc.calculateVanDerMeer(1.0, 25.0, Delta, 4.0, rho_s, 0.5, 2.0, 3000);
    assert.equal(gentleCase.regime, 'plunging');

    // Standalone vanderMeerPlunging includes Delta scaling
    const standalone = Calc.vanderMeerPlunging(Hs, Tm, cotAlpha, P, 3000, 2.0, Delta, rho_s);
    assertClose(standalone.Dn50, plungingCase.Dn50, 1e-9, 'Standalone plunging matches unified Van der Meer');
});

test('EurOtop (2018) overtopping is continuous across regime transition, safe at Rc <= 0, and bounded in Vmax', () => {
    const qPos = Calc.calculateEurOtopOvertopping(2.5, 8.0, 3.0, 35, 0.55, 1.0, 1.0, 1.0, 5.0);
    assert.ok(Number.isFinite(qPos.q) && qPos.q > 0, 'Positive freeboard produces finite discharge');
    assert.ok(qPos.Cr < 1.0 && qPos.Cr > 0, 'Wide armoured crest reduces overtopping via Cr');

    const qZero = Calc.calculateEurOtopOvertopping(2.5, 8.0, 0, 35, 0.55);
    assert.ok(Number.isFinite(qZero.q) && qZero.q > qPos.q, 'Zero freeboard yields finite discharge larger than Rc=3');
    assert.equal(qZero.regime, 'zero-freeboard');

    const qNeg = Calc.calculateEurOtopOvertopping(2.5, 8.0, -0.5, 35, 0.55);
    assert.ok(Number.isFinite(qNeg.q) && qNeg.q > qZero.q, 'Submerged crest combines weir + zero-freeboard without NaN');
    assert.equal(qNeg.regime, 'submerged-overflow');

    const Vmax = Calc.calculateIndividualWaveVolume(2.5, 8.0, 3.0, qPos.q, { Ru2: qPos.Ru2 });
    assert.ok(Number.isFinite(Vmax) && Vmax > 0 && Vmax < 100, 'Weibull Vmax is physically bounded');
});

test('Structure-specific modules: Revetment, Berm, Reef, Low-Crested, Goda Wall, Composite, Caisson & Bullnose', () => {
    // Revetment
    const rev = StructCalc.calculateRevetmentStability({
        armourDn50: 0.9, matDensity: 2650, slopeLeft: 2.5, permeability: 0.5,
        damageLevel: 2.0, stormWaves: 3000, waveHeight: 2.2, wavePeriod: 7.0, depth: 3.0
    });
    assert.ok(Number.isFinite(rev.xi_critical) && rev.xi_critical > 2.0, 'Revetment uses Van der Meer xi_mc');

    // Berm with bermElevation = 0 or negative must never yield NaN
    const bermNeg = StructCalc.calculateBermStability({
        armourDn50: 1.5, matDensity: 2650, slopeLeft: 1.5, bermWidth: 18,
        bermElevation: -0.5, recession: 8, waveHeight: 3.0, wavePeriod: 10.0, depth: 5.0
    });
    assert.ok(Number.isFinite(bermNeg.recession_expected) && Number.isFinite(bermNeg.stabilityRatio), 'Berm handles negative elevation without NaN');

    // Reef breakwater transmission
    const reef = StructCalc.calculateReefTransmission({
        waveHeight: 2.5, wavePeriod: 8.0, depth: 6.0, structureHeight: 5.5, crestWidth: 6.0, slopeLeft: 1.5
    });
    assert.ok(reef.Kt >= 0.075 && reef.Kt <= 0.80, 'Reef Kt within physical bounds [0.075, 0.80]');
    assertClose(reef.Ht, reef.Kt * 2.5, 1e-9, 'Transmitted wave height matches Kt * Hs');

    // Low-crested slope conversion and decreasing Kt with higher crest
    const low1 = StructCalc.calculateLowCrestedPerformance({ crestHeight: 0.5, crestWidth: 5.0, waveHeight: 2.5, wavePeriod: 8.0, slopeLeft: 1.5 });
    const low2 = StructCalc.calculateLowCrestedPerformance({ crestHeight: 1.5, crestWidth: 5.0, waveHeight: 2.5, wavePeriod: 8.0, slopeLeft: 1.5 });
    assertClose(low1.alphaDeg, (Math.atan(1 / 1.5) * 180) / Math.PI, 1e-6, 'Low-crested converts cot(alpha) to degrees');
    assert.ok(low2.transmission.Kt < low1.transmission.Kt, 'Higher crest reduces transmitted wave coefficient Kt');

    // Goda Vertical Wall: full depth + emerged height integration & buoyancy stability
    const wallForces = StructCalc.calculateVerticalWallForces({
        wallHeight: 13.0, foundationWidth: 12.0, wallThickness: 12.0, depth: 10.0,
        waveHeight: 4.0, wavePeriod: 10.0, waveAngle: 0
    });
    assert.ok(wallForces.forces.p1 > 0 && wallForces.forces.p3 > 0 && wallForces.forces.M_uplift > 0, 'Goda pressures and uplift moment computed');
    assert.ok(wallForces.forces.F_h > 0.5 * (wallForces.forces.p1 + wallForces.forces.p3) * 10.0, 'F_h includes both submerged and emerged sections');

    const wallStab = StructCalc.checkVerticalWallStability({
        wallHeight: 13.0, wallThickness: 12.0, foundationWidth: 12.0, depth: 10.0,
        concreteDensity: 2400, frictionCoeff: 0.6, ...wallForces.forces
    });
    assert.ok(wallStab.buoyancy > 0 && wallStab.weight < wallStab.weightDry, 'Buoyancy reduces effective submerged weight');
    assert.ok(Number.isFinite(wallStab.bearing.q_max) && wallStab.bearing.q_max > 0, 'Bearing pressure computed');

    // Composite mound & wall
    const comp = StructCalc.calculateCompositeStructure({
        moundHeight: 4.0, moundWidth: 8.0, moundSlope: 1.5, armourDn50: 1.5, matDensity: 2650,
        wallHeight: 8.0, wallThickness: 6.0, concreteDensity: 2400, waveHeight: 4.0, wavePeriod: 10.0, depth: 10.0
    });
    assert.ok(comp.mound.W_required > 1.0, 'Composite Hudson W_required uses matDensity not water density');
    assert.ok(comp.wall.F_h > 0 && comp.wall.FS_slide > 0, 'Composite wall uses Goda forces');

    // Caisson stability
    const cais = StructCalc.calculateCaissonStability({
        caissonWidth: 14.0, caissonHeight: 13.0, wallThickness: 0.5, cellCount: 3, foundationHeight: 2.0,
        concreteDensity: 2400, fillDensity: 1900, frictionCoeff: 0.6, waveHeight: 4.5, wavePeriod: 10.0, depth: 12.0
    });
    assert.ok(cais.buoyancy > 0 && cais.forces.F_uplift > 0, 'Caisson accounts for buoyancy and uplift');
    assert.ok(Number.isFinite(cais.bearing.pressure) && cais.bearing.pressure > 0, 'Caisson eccentric bearing computed');
});
