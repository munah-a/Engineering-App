const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Minimal global shims for loading browser-centric modules in Node
if (typeof global.window === 'undefined') {
    global.window = global;
}

const { GlobalParameterManager } = require('../scripts/global-parameters.js');
const { UnitConverter, escapeHtml, getTemplateParameters } = require('../scripts/main.js');
const { generateReportHTML } = require('../scripts/pdf-export.js');
const calc = require('../scripts/calculations.js');
const structCalc = require('../scripts/structure-calculations.js');
const waveTrans = require('../scripts/wave-transformation.js');

const TEMPLATE_IDS = [
    'rubble-standard',
    'rubble-bullnose',
    'rubble-berm',
    'rubble-reef',
    'rubble-low',
    'rubble-revetment',
    'vertical-wall',
    'vertical-composite',
    'vertical-caisson',
    'vertical-perforated',
    'custom'
];

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

test('index.html has zero duplicate id attributes and includes required new UI elements', () => {
    const idMatches = [...indexHtml.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    const counts = new Map();
    for (const id of idMatches) {
        counts.set(id, (counts.get(id) || 0) + 1);
    }
    const duplicates = [...counts.entries()].filter(([, n]) => n > 1);
    assert.deepEqual(duplicates, [], `Duplicate IDs found: ${JSON.stringify(duplicates)}`);

    // Required UI elements
    assert.ok(idMatches.includes('surfaceRoughness'), 'Missing #surfaceRoughness selector');
    assert.ok(idMatches.includes('saveLibraryModal'), 'Missing #saveLibraryModal');
    assert.ok(idMatches.includes('saveStructName'), 'Missing #saveStructName');
    assert.ok(idMatches.includes('confirmSaveLibraryBtn'), 'Missing #confirmSaveLibraryBtn');
    assert.ok(idMatches.includes('startProjectWizardBtn'), 'Missing #startProjectWizardBtn');
    assert.ok(idMatches.includes('projectsGrid'), 'Missing #projectsGrid');

    // Check #structureTemplateSelect includes rubble-reef
    const tplSelectMatch = indexHtml.match(/<select[^>]*id="structureTemplateSelect"[^>]*>([\s\S]*?)<\/select>/);
    assert.ok(tplSelectMatch, 'Missing #structureTemplateSelect');
    assert.ok(tplSelectMatch[1].includes('value="rubble-reef"'), 'rubble-reef missing from #structureTemplateSelect');

    // Check #filterType includes all 11 templates (except custom? wait all 11 should be present)
    const filterMatch = indexHtml.match(/<select[^>]*id="filterType"[^>]*>([\s\S]*?)<\/select>/);
    assert.ok(filterMatch, 'Missing #filterType');
    for (const tpl of TEMPLATE_IDS) {
        assert.ok(filterMatch[1].includes(`value="${tpl}"`), `Template ${tpl} missing from #filterType`);
    }
});

test('Designer design_* control IDs never collide with static index.html IDs across all 11 templates', () => {
    const staticIds = new Set([...indexHtml.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

    for (const tpl of TEMPLATE_IDS) {
        const params = getTemplateParameters(tpl);
        assert.ok(Array.isArray(params) && params.length > 0, `Template ${tpl} returned empty parameter list`);

        const localIds = new Set();
        for (const p of params) {
            if (!p.id) continue;
            const domId = `design_${p.id}`;
            assert.ok(!localIds.has(domId), `Duplicate param id ${domId} inside template ${tpl}`);
            localIds.add(domId);
            assert.ok(!staticIds.has(domId), `Static DOM collision for ${domId} in template ${tpl}`);
        }
    }
});

test('UnitConverter converts accurately and keeps angles/time/dimensionless invariant', () => {
    const convertibleTypes = [
        { type: 'length', siVal: 10 },
        { type: 'length_cm', siVal: 50 },
        { type: 'speed', siVal: 20 },
        { type: 'density', siVal: 2650 },
        { type: 'discharge', siVal: 1.5 },
        { type: 'volume_per_m', siVal: 250 }
    ];

    for (const { type, siVal } of convertibleTypes) {
        const imp = UnitConverter.fromSI(siVal, type, 'imperial');
        assert.ok(Number.isFinite(imp), `${type} imperial value should be finite`);
        assert.notEqual(imp, siVal, `${type} imperial conversion should differ from SI`);
        const backToSI = UnitConverter.toSI(imp, type, 'imperial');
        assert.ok(Math.abs(backToSI - siVal) < 1e-6, `${type} round-trip failed: ${backToSI} vs ${siVal}`);
    }

    // Invariant types
    for (const invType of ['angle', 'time', 'percent', 'dimensionless']) {
        assert.equal(UnitConverter.fromSI(33.5, invType, 'imperial'), 33.5, `${invType} fromSI must remain invariant`);
        assert.equal(UnitConverter.toSI(33.5, invType, 'imperial'), 33.5, `${invType} toSI must remain invariant`);
    }

    assert.equal(UnitConverter.getUnitLabel('speed', 'imperial'), 'mph');
    assert.equal(UnitConverter.getUnitLabel('speed', 'metric'), 'm/s');
    assert.equal(UnitConverter.getUnitLabel('angle', 'imperial'), '°');
    assert.equal(UnitConverter.getUnitLabel('angle', 'metric'), '°');
});

test('GlobalParameterManager supports global sets, module overrides, and export/import round-trip', () => {
    const gpm = new GlobalParameterManager();
    gpm.defineParameter('waveHeight', { label: 'Wave Height', defaultUnit: 'm', type: 'number' });
    gpm.defineParameter('waterDepth', { label: 'Water Depth', defaultUnit: 'm', type: 'number' });

    gpm.setGlobalParameter('waveHeight', 3.4, 'test');
    gpm.setGlobalParameter('environmental', 'waterDepth', 12.0, 'test');

    assert.equal(gpm.getParameter('waveHeight').value, 3.4);
    assert.equal(gpm.getParameter('environmental', 'waterDepth').value, 12.0);
    assert.equal(gpm.hasOverride('designer', 'waveHeight'), false);

    gpm.setLocalOverride('designer', 'waveHeight', 4.1);
    assert.equal(gpm.hasOverride('designer', 'waveHeight'), true);
    assert.equal(gpm.getParameter('waveHeight', undefined, 'designer').value, 4.1);
    assert.equal(gpm.getParameter('waveHeight').value, 3.4);

    const exported = gpm.exportParameters();
    const restored = new GlobalParameterManager();
    restored.defineParameter('waveHeight', { label: 'Wave Height', defaultUnit: 'm', type: 'number' });
    restored.defineParameter('waterDepth', { label: 'Water Depth', defaultUnit: 'm', type: 'number' });
    restored.importParameters(exported);

    assert.equal(restored.getParameter('waveHeight').value, 3.4);
    assert.equal(restored.getParameter('waveHeight', undefined, 'designer').value, 4.1);
    assert.equal(restored.hasOverride('designer', 'waveHeight'), true);

    restored.clearLocalOverride('designer', 'waveHeight');
    assert.equal(restored.hasOverride('designer', 'waveHeight'), false);
    assert.equal(restored.getParameter('waveHeight', undefined, 'designer').value, 3.4);
});

test('escapeHtml neutralizes script tags and HTML special characters', () => {
    const payload = '<script>alert("xss")</script> & \'single\'';
    const escaped = escapeHtml(payload);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(escaped.includes('&lt;script&gt;'));
    assert.ok(escaped.includes('&quot;xss&quot;'));
    assert.ok(escaped.includes('&amp;'));
    assert.ok(escaped.includes('&#39;single&#39;'));
});

test('generateReportHTML escapes XSS payloads and renders Wave, Structure (Rubble/Reef/Wall/Caisson), and EurOtop 2018 Serviceability', () => {
    const waveTransRes = waveTrans.transformWaveOffshoreToToe(3.2, 8.5, 25, 10, 15);
    const waveData = {
        method: 'smb',
        windSpeed: 22,
        fetchLength: 50000,
        waterDepth: 25,
        offshoreDepth: 25,
        toeDepth: 10,
        Hs: waveTransRes.toe.H,
        Tp: 8.5,
        L: waveTransRes.toe.L,
        L0: waveTransRes.L0,
        Hb: waveTransRes.breaking.H_max,
        HTL: 1.5,
        slr: 0.5,
        setup: 0.35,
        DWL: 2.35,
        transformation: waveTransRes
    };

    const otPositive = calc.calculateEurOtopOvertopping(waveData.Hs, 8.5, 3.0, 33.69, 0.55, 1.0, 1.0, 1.0, 3.6);
    const otZero = calc.calculateEurOtopOvertopping(waveData.Hs, 8.5, 0.0, 33.69, 0.55, 1.0, 1.0, 1.0, 3.6);

    const wallParams = { wallHeight: 8, wallThickness: 3, foundationWidth: 6, depth: 6, waveHeight: 2.8, wavePeriod: 8, waveAngle: 0, concreteDensity: 2400, fillDensity: 1800, frictionCoeff: 0.6 };
    const wallForces = structCalc.calculateVerticalWallForces(wallParams);
    const wallStab = structCalc.checkVerticalWallStability({ ...wallParams, ...wallForces.forces });

    const caissonResult = structCalc.calculateCaissonStability({
        depth: 12, caissonWidth: 12, caissonHeight: 15, wallThickness: 0.5, cellCount: 4,
        concreteDensity: 2400, fillDensity: 1800, frictionCoeff: 0.6, waveHeight: 3.5, wavePeriod: 9.0
    });

    const reefResult = structCalc.calculateReefTransmission({
        waveHeight: 2.5, wavePeriod: 7.0, depth: 4.0, structureHeight: 3.5, crestWidth: 6.0, slope: 2.0, armourDn50: 0.6
    });

    const mockProject = {
        structures: [
            { id: 's1', name: 'Main <Breakwater>', type: 'rubble-standard', status: 'analyzed' },
            { id: 's2', name: 'Harbour Wall', type: 'vertical-wall', status: 'analyzed' },
            { id: 's3', name: 'Caisson Pier', type: 'vertical-caisson', status: 'analyzed' },
            { id: 's4', name: 'Submerged Reef', type: 'rubble-reef', status: 'analyzed' }
        ],
        structureAnalyses: {
            s1: {
                stability: {
                    template: 'rubble-standard',
                    Hs: waveData.Hs,
                    waterDepth: 10,
                    slope: 1.5,
                    rho_s: 2650,
                    KD: 4.0,
                    delta: 1.585,
                    inputDn50: 1.2,
                    hudson: { M50: 4500, Dn50: 1.19 },
                    vdm: { xi_m: 3.1, regime: 'Surging', P: 0.4, S_dam: 2, N_waves: 3000, Ns_vdm: 2.1, Dn50: 0.92, M50: 2100 },
                    volumes: { armour: 22, filter: 14, core: 45, toe: 6 },
                    masses: { armour: 35000, filter: 22000, core: 70000, toe: 9500 }
                },
                serviceability: {
                    freeboard: 3.0,
                    slopeAngle: 33.69,
                    crestWidth: 3.6,
                    gamma_f: 0.55,
                    gamma_v: 1.0,
                    Cr: otPositive.Cr,
                    Ru2: otPositive.Ru2,
                    xi_m10: otPositive.xi_m10,
                    waveHeight: waveData.Hs,
                    wavePeriod: 8.5,
                    q: otPositive.q_l_s_m,
                    Vmax: 120,
                    safety: { pedestrian: { safe: true, status: 'SAFE' }, vehicle: { safe: true, status: 'SAFE' }, building: { safe: true, status: 'SAFE' } }
                }
            },
            s2: {
                stability: { template: 'vertical-wall', params: wallParams, forces: wallForces, stability: wallStab }
            },
            s3: {
                stability: { template: 'vertical-caisson', params: { caissonWidth: 12, caissonHeight: 15, cellCount: 4 }, result: caissonResult }
            },
            s4: {
                stability: { template: 'rubble-reef', params: { depth: 4, crestHeight: -0.5, crestWidth: 6 }, result: reefResult }
            }
        }
    };

    const html = generateReportHTML({
        projectName: '<script>alert("xss")</script>Port Project',
        projectLocation: 'Atoll & Island',
        engineerName: 'Ada "Engineer"',
        companyName: 'Coastal <Corp>',
        includeWave: true,
        includeStructure: true,
        includeService: true,
        includeFormulas: true,
        includeDiagrams: false,
        waveData,
        project: mockProject
    });

    // XSS safety check
    assert.ok(!html.includes('<script>alert("xss")</script>'), 'XSS script tag must be escaped in report HTML');
    assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Port Project'));
    assert.ok(html.includes('Main &lt;Breakwater&gt;'));

    // Wave transformation included
    assert.ok(html.includes('Shoaling Coefficient'), 'Wave section should display Ks');
    assert.ok(html.includes(waveTransRes.coefficients.Ks.toFixed(3)));

    // Fixed LaTeX token (\xi_m not \ξ_m)
    assert.ok(!html.includes('\\ξ_m'), 'Invalid \\ξ_m LaTeX token must not appear');
    assert.ok(html.includes('\\xi_m'), 'Valid \\xi_m LaTeX token should appear');

    // Specialized structure sections rendered
    assert.ok(html.includes('Vertical Gravity Wall'), 'Vertical wall section missing');
    assert.ok(html.includes('Caisson Breakwater'), 'Caisson section missing');
    assert.ok(html.includes('Submerged / Reef Breakwater'), 'Reef section missing');

    // EurOtop 2018 non-breaking equation rendered for steep slope (xi >= 2.0)
    assert.ok(html.includes('0.09') && html.includes('1.5'), 'EurOtop 2018 Eq 5.11 non-breaking coefficients missing');

    // Breaking regime (mild slope -> xi < 2.0) + Zero freeboard check
    const otZeroBreaking = calc.calculateEurOtopOvertopping(waveData.Hs, 8.5, 0.0, 14.0, 0.55, 1.0, 1.0, 1.0, 3.6);
    const htmlZero = generateReportHTML({
        projectName: 'Zero Freeboard Check',
        includeWave: false,
        includeStructure: false,
        includeService: true,
        includeFormulas: false,
        serviceabilityData: {
            freeboard: 0,
            slopeAngle: 14.0,
            crestWidth: 3.6,
            gamma_f: 0.55,
            gamma_v: 1.0,
            Cr: otZeroBreaking.Cr,
            Ru2: otZeroBreaking.Ru2,
            xi_m10: otZeroBreaking.xi_m10,
            waveHeight: waveData.Hs,
            wavePeriod: 8.5,
            q: otZeroBreaking.q_l_s_m,
            Vmax: 450,
            safety: { pedestrian: { safe: false, status: 'EXCEEDED' }, vehicle: { safe: false, status: 'EXCEEDED' }, building: { safe: false, status: 'EXCEEDED' } }
        }
    });
    assert.ok(htmlZero.includes('0.023') && htmlZero.includes('2.7'), 'EurOtop 2018 Eq 5.10 breaking coefficients missing');
    assert.ok(htmlZero.includes('zero-freeboard'), 'Rc <= 0 serviceability note should render');
    assert.ok(htmlZero.includes(otZeroBreaking.q_l_s_m.toFixed(4)), 'Rc = 0 q_l_s_m should render');
});
